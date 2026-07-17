using System;
using System.Collections.Immutable;

namespace Jig.Analyzers;

/// <summary>
/// One line of the layer map: a namespace pattern that must not depend on another.
/// Patterns are wildcarded on the product prefix ("*.Api"), because layer names are
/// structural and the product name is not — the same map holds in every clone of the
/// template with no rename step.
/// </summary>
public readonly struct LayerRule
{
    private const string Wildcard = "*.";

    public string From { get; }
    public string To { get; }

    private LayerRule(string from, string to)
    {
        From = from;
        To = to;
    }

    /// <summary>Parse the layer map. Blank lines and "#" comments are ignored; a malformed line is skipped.</summary>
    public static ImmutableArray<LayerRule> Parse(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return ImmutableArray<LayerRule>.Empty;

        var rules = ImmutableArray.CreateBuilder<LayerRule>();
        foreach (var rawLine in text!.Split('\n'))
        {
            var line = rawLine;
            var comment = line.IndexOf('#');
            if (comment >= 0) line = line.Substring(0, comment);

            var parts = line.Split(new[] { "->" }, StringSplitOptions.None);
            if (parts.Length != 2) continue;

            var from = parts[0].Trim();
            var to = parts[1].Trim();
            if (from.Length == 0 || to.Length == 0) continue;

            rules.Add(new LayerRule(from, to));
        }

        return rules.ToImmutable();
    }

    /// <summary>True when a reference from <paramref name="fromNamespace"/> to <paramref name="toNamespace"/> breaks this rule.</summary>
    public bool Covers(string fromNamespace, string toNamespace) =>
        Matches(From, fromNamespace) && Matches(To, toNamespace);

    /// <summary>
    /// Match a namespace against a pattern on segment boundaries, so "*.Api" covers
    /// "Jig.Api" and "Jig.Api.Users" but not "Jig.ApiClient" and not the global namespace
    /// (where top-level statements put Program).
    /// </summary>
    private static bool Matches(string pattern, string ns)
    {
        var layer = pattern.StartsWith(Wildcard, StringComparison.Ordinal)
            ? pattern.Substring(Wildcard.Length)
            : pattern;

        return ns == layer
            || ns.EndsWith("." + layer, StringComparison.Ordinal)
            || ns.StartsWith(layer + ".", StringComparison.Ordinal)
            || ns.IndexOf("." + layer + ".", StringComparison.Ordinal) >= 0;
    }
}
