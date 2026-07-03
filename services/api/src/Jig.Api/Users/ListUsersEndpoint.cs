using FastEndpoints;

namespace Jig.Api.Users;

/// <summary>users.list — GET /users. Returns every user.</summary>
public sealed class ListUsersEndpoint : EndpointWithoutRequest<IEnumerable<UserResponse>>
{
    public override void Configure()
    {
        Get("/users");
        AllowAnonymous();
    }

    public override Task HandleAsync(CancellationToken ct)
        => throw new NotImplementedException("Phase 2: implement users.list via TDD.");
}
