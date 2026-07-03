using Jig.Domain;

namespace Jig.Api.Users;

/// <summary>Maps the User domain entity to its wire DTO. The one place that shape crossing happens.</summary>
internal static class UserMapping
{
    public static UserResponse ToResponse(this User user) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email,
    };
}
