using Jig.Application;

namespace Jig.Api.Users;

/// <summary>users.get — GET /users/{id}. Returns one user or 404.</summary>
public sealed class GetUserEndpoint : ResultEndpoint<GetUserRequest, UserResponse>
{
    private readonly UserService _users;

    public GetUserEndpoint(UserService users) => _users = users;

    public override void Configure()
    {
        Get("/users/{id}");
        AllowAnonymous();
    }

    public override async Task HandleAsync(GetUserRequest req, CancellationToken ct)
        => await SendResultAsync(await _users.GetAsync(req.Id, ct), u => u.ToResponse(), ct);
}
