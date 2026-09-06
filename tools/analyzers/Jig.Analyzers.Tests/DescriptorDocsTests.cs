using System.IO;
using Shouldly;

namespace Jig.Analyzers.Tests;

/// <summary>
/// Every diagnostic mechanizes a written decision, and the link to that decision has to
/// reach the person reading the failure.
///
/// The C# compiler appends helpLinkUri to the console diagnostic text itself — verified
/// under -v q, the default terminal logger, -tl:off, and through `dotnet test`, which is
/// the path `tools/verify` takes. `description` never reaches the console on any logger;
/// it surfaces only in SARIF as fullDescription. So the link is the channel that works,
/// and a repo-relative path beats an https:// URL against a private repo whose readers
/// are an editor and an agent holding a file-reading tool.
///
/// The second test is the one that matters. A link is a promise, and a promise nothing
/// checks is the DR0002 failure mode wearing a different hat: delete the doc later and
/// the pointer rots into a lie while every build stays green. This turns the docs into
/// a gate.
/// </summary>
public class DescriptorDocsTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    /// <summary>
    /// Walks up from the test assembly to the directory holding CLAUDE.md. That file is at
    /// the repo root, is never in an intermediate directory, and survives `tools/init`, so
    /// the marker is correct in a clone as well as in the template.
    /// </summary>
    private static string FindRepoRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "CLAUDE.md")))
        {
            dir = dir.Parent;
        }

        dir.ShouldNotBeNull("could not locate the repo root (no CLAUDE.md above the test assembly)");
        return dir!.FullName;
    }

    [Fact]
    public void Every_diagnostic_carries_a_help_link()
    {
        foreach (var descriptor in new LayerDependencyAnalyzer().SupportedDiagnostics)
        {
            descriptor.HelpLinkUri.ShouldNotBeNullOrWhiteSpace(
                $"{descriptor.Id} has no helpLinkUri, so its failure names no document");
        }
    }

    [Fact]
    public void Every_help_link_points_at_a_document_that_exists()
    {
        foreach (var descriptor in new LayerDependencyAnalyzer().SupportedDiagnostics)
        {
            var path = Path.Combine(RepoRoot, descriptor.HelpLinkUri.Replace('/', Path.DirectorySeparatorChar));

            File.Exists(path).ShouldBeTrue(
                $"{descriptor.Id} points at '{descriptor.HelpLinkUri}', which does not exist");
        }
    }

    [Fact]
    public void Every_help_link_is_repo_relative()
    {
        foreach (var descriptor in new LayerDependencyAnalyzer().SupportedDiagnostics)
        {
            descriptor.HelpLinkUri.ShouldNotStartWith("http",
                Case.Insensitive,
                $"{descriptor.Id} uses an absolute URL. The readers are an editor and an agent " +
                "with a file-reading tool, against a private repo — a repo-relative path is the " +
                "one both can open.");
        }
    }
}
