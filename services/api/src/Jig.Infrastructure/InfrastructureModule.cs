using Jig.Application;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Jig.Infrastructure;

/// <summary>Composition root for the persistence layer.</summary>
/// <capability>api.infrastructure-module</capability>
/// <intent>One call wires the database and repositories, so the host does not know EF Core details.</intent>
/// <reuse>Call services.AddInfrastructure(connectionString) from the API composition root, then InitializeDatabaseAsync on startup.</reuse>
public static class InfrastructureModule
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<JigDbContext>(options => options.UseSqlite(connectionString));
        services.AddScoped<IUserRepository, UserRepository>();
        return services;
    }

    /// <summary>Ensure the schema exists. Keeps EF Core out of the host: the API calls this,
    /// not DbContext.Database directly. Swap EnsureCreated for MigrateAsync when migrations arrive.</summary>
    public static async Task InitializeDatabaseAsync(this IServiceProvider services, CancellationToken ct = default)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<JigDbContext>();
        await db.Database.EnsureCreatedAsync(ct);
    }
}
