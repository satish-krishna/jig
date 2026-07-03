using Jig.Domain;

namespace Jig.Application;

/// <summary>The user use-cases: list, get, and save. Returns Result envelopes so
/// expected failures (not-found, duplicate email) travel as data, not exceptions.</summary>
/// <capability>api.user-service</capability>
/// <intent>One cohesive place for the user use-case logic, independent of transport and database.</intent>
/// <reuse>Inject UserService into endpoints; it speaks IUserRepository, never EF Core directly.</reuse>
public sealed class UserService
{
    private readonly IUserRepository _repo;

    public UserService(IUserRepository repo) => _repo = repo;

    public async Task<Result<IReadOnlyList<User>>> ListAsync(CancellationToken ct)
        => Result<IReadOnlyList<User>>.Success(await _repo.GetAllAsync(ct));

    public async Task<Result<User>> GetAsync(Guid id, CancellationToken ct)
    {
        var user = await _repo.GetByIdAsync(id, ct);
        return user is null ? Error.NotFound($"User {id} was not found.") : user;
    }

    public async Task<Result<User>> SaveAsync(Guid? id, string name, string email, CancellationToken ct)
    {
        var byEmail = await _repo.GetByEmailAsync(email, ct);
        if (byEmail is not null && byEmail.Id != id)
            return Error.Conflict($"Email {email} is already in use.");

        User user;
        if (id is Guid existingId)
        {
            var current = await _repo.GetByIdAsync(existingId, ct);
            if (current is null)
                return Error.NotFound($"User {existingId} was not found.");
            current.Name = name;
            current.Email = email;
            user = current;
        }
        else
        {
            user = new User { Id = Guid.NewGuid(), Name = name, Email = email };
        }

        return await _repo.UpsertAsync(user, ct);
    }
}
