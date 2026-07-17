using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Diagnostics;
using Microsoft.CodeAnalysis.Text;

namespace Jig.Analyzers.Tests;

/// <summary>
/// Compiles a source string with the analyzer attached and returns what it reported.
/// Fixtures declare their own Jig.* namespaces, so the tests never reference the real
/// projects and stay hermetic.
/// </summary>
internal static class AnalyzerHarness
{
    private static readonly ImmutableArray<MetadataReference> References =
        ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!)
            .Split(Path.PathSeparator)
            .Select(path => (MetadataReference)MetadataReference.CreateFromFile(path))
            .ToImmutableArray();

    public static async Task<ImmutableArray<Diagnostic>> RunAsync(
        string source,
        string? ruleset,
        OutputKind outputKind = OutputKind.DynamicallyLinkedLibrary)
    {
        var compilation = CSharpCompilation.Create(
            assemblyName: "Fixture",
            syntaxTrees: new[] { CSharpSyntaxTree.ParseText(source) },
            references: References,
            options: new CSharpCompilationOptions(outputKind));

        // A fixture that fails to compile produces no analyzer diagnostics at all, which is
        // indistinguishable from "the analyzer correctly found nothing wrong." Assert the
        // fixture is actually valid C# before trusting what the analyzer says about it —
        // otherwise a typo in a fixture silently turns an assertion into a tautology.
        var errors = compilation.GetDiagnostics()
            .Where(d => d.Severity == DiagnosticSeverity.Error)
            .ToArray();
        if (errors.Length > 0)
        {
            throw new InvalidOperationException(
                "Fixture does not compile, so any analyzer result would be meaningless:"
                + Environment.NewLine
                + string.Join(Environment.NewLine, errors.Select(e => e.ToString())));
        }

        var options = new AnalyzerOptions(ruleset is null
            ? ImmutableArray<AdditionalText>.Empty
            : ImmutableArray.Create<AdditionalText>(new RulesetText(ruleset)));

        var withAnalyzers = compilation.WithAnalyzers(
            ImmutableArray.Create<DiagnosticAnalyzer>(new LayerDependencyAnalyzer()),
            options);

        return await withAnalyzers.GetAnalyzerDiagnosticsAsync(CancellationToken.None);
    }

    private sealed class RulesetText(string text) : AdditionalText
    {
        public override string Path => LayerDependencyAnalyzer.RulesetFileName;

        public override SourceText GetText(CancellationToken cancellationToken = default) =>
            SourceText.From(text);
    }
}
