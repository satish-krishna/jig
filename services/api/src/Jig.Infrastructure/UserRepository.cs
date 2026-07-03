using Jig.Application;
using Jig.Domain;
using Microsoft.EntityFrameworkCore;

namespace Jig.Infrastructure;

/// <summary>EF Core implementation of the user persistence port.</summary>
/// <capability>api.user-repository</capability>
/// <intent>The only place that touches EF Core for users; the application never sees a DbContext.</intent>
/// <reuse>Registered for IUserRepository by AddInfrastructure; do not new it up directly.</reuse>
public sealed class UserRepository : IUserRepository
{
    private readonly JigDbContext _db;

    public UserRepository(JigDbContext db) => _db = db;

    public async Task<IReadOnlyList<User>> GetAllAsync(CancellationToken ct)
        => await _db.Users.AsNoTracking().OrderBy(u => u.Name).ToListAsync(ct);

    public Task<User?> GetByIdAsync(Guid id, CancellationToken ct)
        => _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<User?> GetByEmailAsync(string email, CancellationToken ct)
        => _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == email, ct);

    public async Task<User> UpsertAsync(User user, CancellationToken ct)
    {
        var existing = await _db.Users.FirstOrDefaultAsync(u => u.Id == user.Id, ct);
        if (existing is null)
        {
            _db.Users.Add(user);
        }
        else
        {
            existing.Name = user.Name;
            existing.Email = user.Email;
        }

        await _db.SaveChangesAsync(ct);
        return existing ?? user;
    }
}
