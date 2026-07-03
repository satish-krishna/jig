using FastEndpoints;
using Jig.Application;

namespace Jig.Api.Users;

/// <summary>users.list — GET /users. Returns every user.</summary>
public sealed class ListUsersEndpoint : EndpointWithoutRequest<IEnumerable<UserResponse>>
{
    private readonly UserService _users;

    public ListUsersEndpoint(UserService users) => _users = users;

    public override void Configure()
    {
        Get("/users");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await _users.ListAsync(ct);
        await Send.OkAsync(result.Value!.Select(u => u.ToResponse()), ct);
    }
}
