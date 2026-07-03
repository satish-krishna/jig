using Jig.Application;

namespace Jig.Api.Users;

/// <summary>users.save — POST /users. Creates (null Id) or updates a user.</summary>
public sealed class SaveUserEndpoint : ResultEndpoint<SaveUserRequest, UserResponse>
{
    private readonly UserService _users;

    public SaveUserEndpoint(UserService users) => _users = users;

    public override void Configure()
    {
        Post("/users");
        AllowAnonymous();
    }

    public override async Task HandleAsync(SaveUserRequest req, CancellationToken ct)
        => await SendResultAsync(await _users.SaveAsync(req.Id, req.Name, req.Email, ct), u => u.ToResponse(), ct);
}
