using FastEndpoints;
using FastEndpoints.Swagger;

var bld = WebApplication.CreateBuilder(args);
bld.Services
    .AddFastEndpoints()
    .SwaggerDocument(o =>
    {
        o.ShortSchemaNames = true;
        o.DocumentSettings = s =>
        {
            s.Title = "Jig API";
            s.Version = "v1";
        };
    });

var app = bld.Build();
app.UseFastEndpoints()
   .UseSwaggerGen();
app.Run();

// Exposed so the FastEndpoints test host (WebApplicationFactory<Program>) can boot the app.
public partial class Program;
