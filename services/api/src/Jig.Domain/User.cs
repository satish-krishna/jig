namespace Jig.Domain;

/// <summary>A user. The one domain entity the reference slice exercises end to end.</summary>
public sealed class User
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
}
