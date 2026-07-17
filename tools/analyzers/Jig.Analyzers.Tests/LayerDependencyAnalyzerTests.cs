using Shouldly;

namespace Jig.Analyzers.Tests;

public class LayerDependencyAnalyzerTests
{
    private const string Ruleset = """
        *.Domain      -> *.Application
        *.Domain      -> *.Infrastructure
        *.Application -> *.Infrastructure
        *.Api         -> *.Infrastructure
        """;

    [Fact]
    public async Task Reports_an_endpoint_reaching_into_infrastructure()
    {
        const string source = """
            namespace Jig.Infrastructure { public class JigDbContext { } }
            namespace Jig.Api.Users
            {
                public class GetUserEndpoint
                {
                    private readonly Jig.Infrastructure.JigDbContext _db = new();
                }
            }
            """;

        var diagnostics = await AnalyzerHarness.RunAsync(source, Ruleset);

        var violation = diagnostics.ShouldHaveSingleItem();
        violation.Id.ShouldBe("DR0001");
        violation.GetMessage().ShouldBe(
            "'*.Api' must not depend on '*.Infrastructure': the type 'JigDbContext' lives there.");
        violation.Severity.ShouldBe(Microsoft.CodeAnalysis.DiagnosticSeverity.Error);
    }

    [Fact]
    public async Task Reports_a_dependency_that_arrives_through_a_third_namespace()
    {
        // The case a .csproj grep cannot see: Application never names Infrastructure,
        // it names Common, and Common hands the infrastructure type straight through.
        const string source = """
            namespace Jig.Infrastructure { public class JigDbContext { } }
            namespace Jig.Common { public static class Bridge { public static Jig.Infrastructure.JigDbContext Get() => new(); } }
            namespace Jig.Application
            {
                public class UserService
                {
                    private readonly Jig.Infrastructure.JigDbContext _db = Jig.Common.Bridge.Get();
                }
            }
            """;

        var diagnostics = await AnalyzerHarness.RunAsync(source, Ruleset);

        diagnostics.ShouldContain(d => d.Id == "DR0001");
    }

    [Fact]
    public async Task Does_not_report_the_composition_root_in_the_global_namespace()
    {
        // Program.cs uses top-level statements, so its generated class has no namespace.
        // No "*.Api" pattern matches it — the composition root exempts itself structurally.
        const string source = """
            var db = new Jig.Infrastructure.JigDbContext();
            namespace Jig.Infrastructure { public class JigDbContext { } }
            """;

        // Top-level statements require an executable output kind to compile at all
        // (CS8805 otherwise) — this is the one fixture that legitimately needs it.
        var diagnostics = await AnalyzerHarness.RunAsync(
            source, Ruleset, Microsoft.CodeAnalysis.OutputKind.ConsoleApplication);

        diagnostics.ShouldBeEmpty();
    }

    [Fact]
    public async Task Does_not_report_infrastructure_using_the_application_port()
    {
        // The legal direction. A rule that cannot decline to fire is a build break, not a rule.
        const string source = """
            namespace Jig.Application { public interface IUserRepository { } }
            namespace Jig.Infrastructure
            {
                public class UserRepository : Jig.Application.IUserRepository { }
            }
            """;

        var diagnostics = await AnalyzerHarness.RunAsync(source, Ruleset);

        diagnostics.ShouldBeEmpty();
    }

    [Fact]
    public async Task Reports_a_nested_type_violation_once()
    {
        const string source = """
            namespace Jig.Infrastructure { public class Outer { public class Inner { } } }
            namespace Jig.Api.Users
            {
                public class GetUserEndpoint
                {
                    private readonly Jig.Infrastructure.Outer.Inner _nested = new();
                }
            }
            """;

        var diagnostics = await AnalyzerHarness.RunAsync(source, Ruleset);

        var violation = diagnostics.ShouldHaveSingleItem();
        violation.Id.ShouldBe("DR0001");
        violation.GetMessage().ShouldBe(
            "'*.Api' must not depend on '*.Infrastructure': the type 'Inner' lives there.");
    }
}
