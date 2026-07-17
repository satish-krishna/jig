using System.Collections.Immutable;
using System.IO;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Diagnostics;

namespace Jig.Analyzers;

/// <summary>
/// Enforces the layer map in ArchLayers.txt against the semantic model.
///
/// Layer dependency is a property of a graph, not of a file: .NET flows transitive
/// project references straight through, so a type can be in scope through an
/// intermediate project while every file a text search reads is innocent. Roslyn has
/// already resolved that graph — this reads it rather than rebuilding it.
///
/// Both diagnostics are NotConfigurable: the severity lives in compiled code, so
/// .editorconfig, NoWarn, and #pragma cannot switch them off. See ADR 0009.
/// </summary>
[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class LayerDependencyAnalyzer : DiagnosticAnalyzer
{
    public const string RulesetFileName = "ArchLayers.txt";

    internal static readonly DiagnosticDescriptor LayerViolation = new(
        id: "DR0001",
        title: "Layer dependency violation",
        messageFormat: "'{0}' must not depend on '{1}': the type '{2}' lives there.",
        category: "Architecture",
        defaultSeverity: DiagnosticSeverity.Error,
        isEnabledByDefault: true,
        description: "The layer map in ArchLayers.txt forbids this dependency. Fix the dependency, not the map.",
        customTags: WellKnownDiagnosticTags.NotConfigurable);

    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics { get; } =
        ImmutableArray.Create(LayerViolation);

    public override void Initialize(AnalysisContext context)
    {
        context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
        context.EnableConcurrentExecution();
        context.RegisterCompilationStartAction(OnCompilationStart);
    }

    private static void OnCompilationStart(CompilationStartAnalysisContext context)
    {
        var rules = LayerRule.Parse(ReadRuleset(context.Options));
        if (rules.Length == 0) return;

        context.RegisterSyntaxNodeAction(
            node => Inspect(node, rules),
            SyntaxKind.IdentifierName,
            SyntaxKind.GenericName);
    }

    private static string? ReadRuleset(AnalyzerOptions options) =>
        options.AdditionalFiles
            .FirstOrDefault(file => Path.GetFileName(file.Path) == RulesetFileName)
            ?.GetText()?.ToString();

    private static void Inspect(SyntaxNodeAnalysisContext context, ImmutableArray<LayerRule> rules)
    {
        var from = context.ContainingSymbol?.ContainingNamespace?.ToDisplayString();
        if (from is null) return;

        var symbol = context.SemanticModel.GetSymbolInfo(context.Node).Symbol;
        var type = symbol as ITypeSymbol ?? symbol?.ContainingType;
        var to = type?.ContainingNamespace?.ToDisplayString();
        if (to is null) return;

        foreach (var rule in rules)
        {
            if (!rule.Covers(from, to)) continue;

            context.ReportDiagnostic(Diagnostic.Create(
                LayerViolation, context.Node.GetLocation(), rule.From, rule.To, type!.Name));
            return;
        }
    }
}
