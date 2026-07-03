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
public sealed class ApiFixture : AppFixture<Program>
{
    private SqliteConnection _connection = null!;

    protected override void ConfigureServices(IServiceCollection services)
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        services.RemoveAll<DbContextOptions<JigDbContext>>();
        services.RemoveAll<JigDbContext>();
        services.AddDbContext<JigDbContext>(options => options.UseSqlite(_connection));
    }

    protected override async ValueTask TearDownAsync()
    {
        await _connection.DisposeAsync();
    }
}
