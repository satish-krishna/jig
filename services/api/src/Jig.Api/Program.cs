using FastEndpoints;
using FastEndpoints.Swagger;
using Jig.Application;
using Jig.Infrastructure;

var bld = WebApplication.CreateBuilder(args);
bld.Services
    .AddApplication()
    .AddInfrastructure(bld.Configuration.GetConnectionString("Default") ?? "Data Source=jig.db")
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

await app.Services.InitializeDatabaseAsync();

app.UseFastEndpoints()
   .UseSwaggerGen();
app.Run();

// Exposed so the FastEndpoints test host (WebApplicationFactory<Program>) can boot the app.
public partial class Program;
