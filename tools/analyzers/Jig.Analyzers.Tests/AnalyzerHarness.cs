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

    public static async Task<ImmutableArray<Diagnostic>> RunAsync(string source, string? ruleset)
    {
        var compilation = CSharpCompilation.Create(
            assemblyName: "Fixture",
            syntaxTrees: new[] { CSharpSyntaxTree.ParseText(source) },
            references: References,
            options: new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

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
