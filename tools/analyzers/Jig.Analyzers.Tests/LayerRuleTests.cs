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
    [InlineData("<global namespace>", "Jig.Infrastructure", false)] // Program.cs, top-level statements
    [InlineData("Jig.Application", "Jig.Infrastructure", false)] // a different rule's business
    [InlineData("Jig.ApiClient", "Jig.Infrastructure", false)]   // segment-anchored, not substring
    public void Covers_matches_on_segment_boundaries(string from, string to, bool expected)
    {
        var rule = LayerRule.Parse("*.Api -> *.Infrastructure")[0];

        rule.Covers(from, to).ShouldBe(expected);
    }
}
