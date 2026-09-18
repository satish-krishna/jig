using System.Net;
using Shouldly;

namespace Jig.Api.Tests;

/// <summary>Pins the contract every other endpoint test class depends on: the API test
/// host is shared across test classes, and taking the fixture from a second class is
/// safe. This class exists to BE that second class. The slice generator emits one
/// endpoint test class per slice, so an app with two slices is the ordinary case, and
/// the fixture used to fail exactly there — a teardown that assumed per-instance setup
/// threw a NullReferenceException, and a teardown that disposed the shared connection
/// would have emptied the database mid-run for whichever class finished second.</summary>
public class ApiFixtureSharingTests : IClassFixture<ApiFixture>
{
    private readonly HttpClient _client;

    public ApiFixtureSharingTests(ApiFixture app) => _client = app.Client;

    [Fact]
    public async Task the_shared_host_still_serves_a_second_test_class()
    {
        var res = await _client.GetAsync("/users", TestContext.Current.CancellationToken);
        res.StatusCode.ShouldBe(HttpStatusCode.OK);
    }
}
