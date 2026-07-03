using FastEndpoints;

namespace Jig.Api.Users;

/// <summary>users.get — GET /users/{id}. Returns one user or 404.</summary>
public sealed class GetUserEndpoint : Endpoint<GetUserRequest, UserResponse>
{
    public override void Configure()
    {
        Get("/users/{id}");
        AllowAnonymous();
    }

    public override Task HandleAsync(GetUserRequest req, CancellationToken ct)
        => throw new NotImplementedException("Phase 2: implement users.get via TDD.");
}
