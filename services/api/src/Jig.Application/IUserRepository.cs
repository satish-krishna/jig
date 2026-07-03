using Jig.Domain;

namespace Jig.Application;

/// <summary>Persistence port for users. The application depends on this abstraction;
/// Infrastructure supplies the EF Core implementation.</summary>
/// <capability>api.user-repository-port</capability>
/// <intent>The use-case layer owns the persistence contract it needs, not the database.</intent>
/// <reuse>Depend on IUserRepository from application services; implement it in Infrastructure only.</reuse>
public interface IUserRepository
{
    Task<IReadOnlyList<User>> GetAllAsync(CancellationToken ct);
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct);
    Task<User> UpsertAsync(User user, CancellationToken ct);
}
