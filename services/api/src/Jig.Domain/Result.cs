namespace Jig.Domain;

/// <summary>The kind of an expected failure, used to map a Result to a transport status.</summary>
public enum ErrorKind
{
    Validation,
    NotFound,
    Conflict,
    Unexpected,
}

/// <summary>A single expected failure: a stable code, a human message, and a kind.</summary>
public sealed record Error(string Code, string Message, ErrorKind Kind)
{
    public static Error Validation(string message, string code = "validation") => new(code, message, ErrorKind.Validation);
    public static Error NotFound(string message, string code = "not_found") => new(code, message, ErrorKind.NotFound);
    public static Error Conflict(string message, string code = "conflict") => new(code, message, ErrorKind.Conflict);
    public static Error Unexpected(string message, string code = "unexpected") => new(code, message, ErrorKind.Unexpected);
}

/// <summary>Uniform success/failure envelope returned by every handler.</summary>
/// <capability>api.result-envelope</capability>
/// <intent>Expected failures travel as data, not exceptions.</intent>
/// <reuse>Return Result&lt;T&gt; from handlers; do not throw for validation or not-found. Endpoints map it to a transport status.</reuse>
public readonly struct Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public Error? Error { get; }

    private Result(bool isSuccess, T? value, Error? error)
    {
        IsSuccess = isSuccess;
        Value = value;
        Error = error;
    }

    public static Result<T> Success(T value) => new(true, value, null);
    public static Result<T> Failure(Error error) => new(false, default, error);

    /// <summary>A value folds to success; an Error folds to failure. Keeps handler code terse.</summary>
    public static implicit operator Result<T>(T value) => Success(value);
    public static implicit operator Result<T>(Error error) => Failure(error);
}
