using System.Net;
using System.Net.Http.Json;
using Shouldly;
using Jig.Api.Users;

namespace Jig.Api.Tests;

public class UsersEndpointTests : IClassFixture<ApiFixture>
{
    private readonly HttpClient _client;

    public UsersEndpointTests(ApiFixture app) => _client = app.Client;

    private static object NewUser(string name = "Dana") =>
        new { name, email = $"{name.ToLowerInvariant()}-{Guid.NewGuid():N}@example.io" };

    [Fact]
    public async Task list_returns_200()
    {
        var res = await _client.GetAsync("/users");
        res.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task save_then_get_roundtrips_the_user()
    {
        var post = await _client.PostAsJsonAsync("/users", NewUser("Ada"));
        post.StatusCode.ShouldBe(HttpStatusCode.OK);
        var created = await post.Content.ReadFromJsonAsync<UserResponse>();
        created!.Id.ShouldNotBe(Guid.Empty);

        var get = await _client.GetAsync($"/users/{created.Id}");
        get.StatusCode.ShouldBe(HttpStatusCode.OK);
        var fetched = await get.Content.ReadFromJsonAsync<UserResponse>();
        fetched!.Email.ShouldBe(created.Email);
    }

    [Fact]
    public async Task save_with_invalid_body_returns_400()
    {
        var res = await _client.PostAsJsonAsync("/users", new { name = "", email = "not-an-email" });
        res.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task get_unknown_id_returns_404()
    {
        var res = await _client.GetAsync($"/users/{Guid.NewGuid()}");
        res.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task save_duplicate_email_returns_409()
    {
        var email = $"dup-{Guid.NewGuid():N}@example.io";
        (await _client.PostAsJsonAsync("/users", new { name = "First", email })).EnsureSuccessStatusCode();

        var res = await _client.PostAsJsonAsync("/users", new { name = "Second", email });
        res.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }
}
