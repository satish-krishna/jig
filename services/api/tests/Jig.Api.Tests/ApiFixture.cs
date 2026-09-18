using FastEndpoints.Testing;
using Jig.Infrastructure;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Jig.Api.Tests;

/// <summary>Boots the real API through the FastEndpoints test host, but swaps the
/// SQLite file database for an in-memory one on a shared open connection. Needs no
/// Docker, so it stays on the default green path (see ADR 0001).</summary>
/// <remarks>
/// The connection is static because its lifetime is the fixture TYPE's, not the
/// instance's. AppFixture caches one host per fixture type for the whole assembly, so
/// ConfigureServices runs exactly once however many test classes take this fixture,
/// while xUnit still constructs and tears down one fixture instance per class. Holding
/// the connection in an instance field was therefore wrong in both directions once a
/// second endpoint test class existed: the instances whose ConfigureServices never ran
/// had a null field and threw out of TearDownAsync, and whichever instance did tear
/// down first would have closed the in-memory database out from under every class that
/// had not finished yet. The generator adds an endpoint test class per slice, so the
/// second class is the normal case, not the exotic one.
///
/// Nothing disposes it, deliberately. The database lives in memory on a connection the
/// cached host holds for as long as it exists, and the only moment every class is
/// certainly finished with it is process exit, which reclaims it anyway.
/// </remarks>
public sealed class ApiFixture : AppFixture<Program>
{
    private static SqliteConnection? _connection;

    protected override void ConfigureServices(IServiceCollection services)
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        services.RemoveAll<DbContextOptions<JigDbContext>>();
        services.RemoveAll<JigDbContext>();
        services.AddDbContext<JigDbContext>(options => options.UseSqlite(_connection));
    }
}
