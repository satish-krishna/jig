using FastEndpoints;
using FluentValidation;

namespace Jig.Api.Users;

/// <summary>Request-shape validation for users.save. Runs before the handler; a failure
/// returns 400 with the field errors. Business rules (uniqueness) live in UserService.</summary>
public sealed class SaveUserValidator : Validator<SaveUserRequest>
{
    public SaveUserValidator()
    {
        RuleFor(x => x.Name).NotEmpty();
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
    }
}
