using System.Collections.Immutable;
using System.IO;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
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

    internal static readonly DiagnosticDescriptor EmptyRuleset = new(
        id: "DR0002",
        title: "Architecture ruleset is empty",
        messageFormat: "The architecture ruleset '{0}' is empty or missing; DR0001 enforced nothing.",
        category: "Architecture",
        defaultSeverity: DiagnosticSeverity.Error,
        isEnabledByDefault: true,
        description: "A check that reports success because it found nothing to check is paperwork. Restore ArchLayers.txt.",
        customTags: new[] { WellKnownDiagnosticTags.NotConfigurable, WellKnownDiagnosticTags.CompilationEnd });

    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics { get; } =
        ImmutableArray.Create(LayerViolation, EmptyRuleset);

    public override void Initialize(AnalysisContext context)
    {
        context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
        context.EnableConcurrentExecution();
        context.RegisterCompilationStartAction(OnCompilationStart);
    }

    private static void OnCompilationStart(CompilationStartAnalysisContext context)
    {
        var rules = LayerRule.Parse(ReadRuleset(context.Options));
        if (rules.Length == 0)
        {
            // A check that goes green because its ruleset vanished is paperwork. Deletion is
            // neither Write nor Edit, so no PreToolUse hook can catch `rm ArchLayers.txt` —
            // this is the only guard that sees it. See ADR 0009.
            context.RegisterCompilationEndAction(end => end.ReportDiagnostic(
                Diagnostic.Create(EmptyRuleset, Location.None, RulesetFileName)));
            return;
        }

        context.RegisterSyntaxNodeAction(
            node => Inspect(node, rules),
            SyntaxKind.IdentifierName,
            SyntaxKind.GenericName,
            SyntaxKind.QualifiedName,
            SyntaxKind.SimpleMemberAccessExpression);
    }

    private static string? ReadRuleset(AnalyzerOptions options) =>
        options.AdditionalFiles
            .FirstOrDefault(file => Path.GetFileName(file.Path) == RulesetFileName)
            ?.GetText()?.ToString();

    private static void Inspect(SyntaxNodeAnalysisContext context, ImmutableArray<LayerRule> rules)
    {
        // A qualified name or a member-access chain produces one node per segment (each
        // dotted piece is itself a QualifiedNameSyntax or MemberAccessExpressionSyntax whose
        // child is the next segment down). Only the outermost node names the thing actually
        // referenced, so analyze that one and let the inner segments fall out — otherwise a
        // nested type, or a chain like "Jig.Infrastructure.JigDbContext.Cleanup()", would
        // report the same violation once per segment instead of once.
        if (context.Node.Parent is QualifiedNameSyntax or MemberAccessExpressionSyntax) return;

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
