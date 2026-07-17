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
    /// Match a namespace against a pattern. "*" stands for exactly one segment — the
    /// product prefix that `tools/init/init.mjs` derives once per clone — never "any prefix".
    /// So "*.Infrastructure" matches "Jig.Infrastructure" and "Jig.Infrastructure.Sub" but
    /// not "Microsoft.EntityFrameworkCore.Infrastructure": that namespace has two segments
    /// before "Infrastructure", so it belongs to a third party, not to our Infrastructure
    /// layer. A pattern without "*." is matched as a fixed, literal prefix instead (segment
    /// boundaries still apply), so "Jig.Domain" matches "Jig.Domain.Sub" but not "Acme.Domain".
    /// </summary>
    private static bool Matches(string pattern, string ns)
    {
        var segments = ns.Split('.');

        if (pattern.StartsWith(Wildcard, StringComparison.Ordinal))
        {
            // "*.Layer[.Rest]" needs at least a product segment plus the layer segment.
            var layerSegments = pattern.Substring(Wildcard.Length).Split('.');
            if (segments.Length < 1 + layerSegments.Length) return false;

            for (var i = 0; i < layerSegments.Length; i++)
            {
                if (segments[1 + i] != layerSegments[i]) return false;
            }

            return true;
        }

        // No wildcard: the pattern itself must match a prefix of whole segments.
        var patternSegments = pattern.Split('.');
        if (segments.Length < patternSegments.Length) return false;

        for (var i = 0; i < patternSegments.Length; i++)
        {
            if (segments[i] != patternSegments[i]) return false;
        }

        return true;
    }
}
