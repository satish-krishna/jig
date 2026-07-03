using FastEndpoints;

namespace Jig.Api.Users;

/// <summary>users.save — POST /users. Creates (null Id) or updates a user.</summary>
public sealed class SaveUserEndpoint : Endpoint<SaveUserRequest, UserResponse>
{
    public override void Configure()
    {
        Post("/users");
        AllowAnonymous();
    }

    public override Task HandleAsync(SaveUserRequest req, CancellationToken ct)
        => throw new NotImplementedException("Phase 2: implement users.save via TDD.");
}
