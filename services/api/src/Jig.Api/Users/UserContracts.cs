namespace Jig.Api.Users;

/// <summary>The user shape returned on the wire. This is the DTO OpenAPI describes and
/// the frontend generates its TypeScript type from, so HTTP and IPC cannot disagree about it.</summary>
public sealed class UserResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
}

/// <summary>Route request for users.get.</summary>
public sealed class GetUserRequest
{
    public Guid Id { get; set; }
}

/// <summary>Body request for users.save. A null Id means create; a set Id means update.</summary>
public sealed class SaveUserRequest
{
    public Guid? Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
}
