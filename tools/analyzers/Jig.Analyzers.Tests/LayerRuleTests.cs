using Jig.Analyzers;
using Shouldly;

namespace Jig.Analyzers.Tests;

public class LayerRuleTests
{
    [Fact]
    public void Parse_reads_a_rule_per_line()
    {
        var rules = LayerRule.Parse("*.Domain -> *.Infrastructure\n*.Application -> *.Infrastructure");

        rules.Length.ShouldBe(2);
        rules[0].From.ShouldBe("*.Domain");
        rules[0].To.ShouldBe("*.Infrastructure");
    }

    [Fact]
    public void Parse_ignores_comments_and_blank_lines()
    {
        var rules = LayerRule.Parse("# from -> forbidden\n\n*.Domain -> *.Infrastructure   # the important one\n");

        rules.Length.ShouldBe(1);
        rules[0].To.ShouldBe("*.Infrastructure");
    }

    [Fact]
    public void Parse_returns_empty_for_null_or_whitespace()
    {
        LayerRule.Parse(null).ShouldBeEmpty();
        LayerRule.Parse("   \n\n").ShouldBeEmpty();
        LayerRule.Parse("# only a comment").ShouldBeEmpty();
    }

    [Theory]
    [InlineData("Jig.Api", "Jig.Infrastructure", true)]          // the layer root itself
    [InlineData("Jig.Api.Users", "Jig.Infrastructure", true)]    // a feature slice under it
    [InlineData("Acme.Api.Users", "Acme.Infrastructure", true)]  // renamed clone, same rule
    // Covers both spellings of the global namespace as per Roslyn behavior:
    // <global namespace> is the theoretical case; empty string is what ToDisplayString() may return.
    // Both must fail to match, allowing Program.cs to legitimately touch Infrastructure.
    [InlineData("<global namespace>", "Jig.Infrastructure", false)] // Program.cs, top-level statements
    [InlineData("", "Jig.Infrastructure", false)]                // global namespace, empty display string
    [InlineData("Jig.Application", "Jig.Infrastructure", false)] // a different rule's business
    [InlineData("Jig.ApiClient", "Jig.Infrastructure", false)]   // segment-anchored, not substring
    [InlineData("Api", "Infrastructure", false)]                 // "*" requires exactly one product segment
    [InlineData("Api.Users", "Infrastructure", false)]           // ditto, no bare-layer match either
    [InlineData("Jig.Api", "Microsoft.EntityFrameworkCore.Infrastructure", false)] // third-party, not our layer
    [InlineData("Jig.Api", "Some.Vendor.Api", false)]                              // ditto, on the "to" side
    public void Covers_matches_on_segment_boundaries(string from, string to, bool expected)
    {
        var rule = LayerRule.Parse("*.Api -> *.Infrastructure")[0];

        rule.Covers(from, to).ShouldBe(expected);
    }

    [Fact]
    public void Covers_supports_a_pattern_without_a_wildcard()
    {
        var rule = LayerRule.Parse("Jig.Domain -> Jig.Infrastructure")[0];

        rule.Covers("Jig.Domain", "Jig.Infrastructure").ShouldBe(true);
        rule.Covers("Acme.Domain", "Acme.Infrastructure").ShouldBe(false);
    }

    [Fact]
    public void Covers_does_not_match_a_third_party_namespace_that_merely_ends_in_a_layer_name()
    {
        // "*" is the product prefix — exactly one segment. Microsoft.EntityFrameworkCore.Infrastructure
        // is not our Infrastructure layer, and DR0001 is NotConfigurable, so a false positive here
        // would fail a clone's build with no way to suppress it.
        var rule = LayerRule.Parse("*.Application -> *.Infrastructure")[0];

        rule.Covers("Jig.Application", "Microsoft.EntityFrameworkCore.Infrastructure").ShouldBeFalse();
        rule.Covers("Jig.Application", "Jig.Infrastructure").ShouldBeTrue();
    }
}
