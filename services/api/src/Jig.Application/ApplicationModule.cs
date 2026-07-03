using Microsoft.Extensions.DependencyInjection;

namespace Jig.Application;

/// <summary>Composition root for the application use-cases.</summary>
/// <capability>api.application-module</capability>
/// <intent>One call registers the use-case services, so the host does not name each by hand.</intent>
/// <reuse>Call services.AddApplication() from the API composition root.</reuse>
public static class ApplicationModule
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<UserService>();
        return services;
    }
}
