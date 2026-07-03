using FastEndpoints;
using Jig.Domain;

namespace Jig.Api;

/// <summary>Base endpoint that turns a Result envelope into a transport response:
/// success sends the mapped body, failure maps the error kind to an HTTP status.</summary>
/// <capability>api.result-endpoint</capability>
/// <intent>One place maps Result to HTTP, so no endpoint invents its own status handling.</intent>
/// <reuse>Derive request/response endpoints from ResultEndpoint and call SendResultAsync.</reuse>
public abstract class ResultEndpoint<TRequest, TResponse> : Endpoint<TRequest, TResponse>
    where TRequest : notnull
{
    protected async Task SendResultAsync<T>(Result<T> result, Func<T, TResponse> map, CancellationToken ct)
    {
        if (result.IsSuccess)
        {
            await Send.OkAsync(map(result.Value!), ct);
            return;
        }

        var error = result.Error!;
        var status = error.Kind switch
        {
            ErrorKind.NotFound => 404,
            ErrorKind.Validation => 400,
            ErrorKind.Conflict => 409,
            _ => 500,
        };
        AddError(error.Message);
        await Send.ErrorsAsync(status, ct);
    }
}
