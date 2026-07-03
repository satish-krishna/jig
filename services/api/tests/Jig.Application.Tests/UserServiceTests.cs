using FakeItEasy;
using Shouldly;
using Jig.Domain;

namespace Jig.Application.Tests;

public class UserServiceTests
{
    private readonly IUserRepository _repo = A.Fake<IUserRepository>();
    private UserService Sut() => new(_repo);

    [Fact]
    public async Task ListAsync_returns_all_users_as_success()
    {
        var users = new List<User> { new() { Id = Guid.NewGuid(), Name = "Ann", Email = "ann@x.io" } };
        A.CallTo(() => _repo.GetAllAsync(A<CancellationToken>._)).Returns(users);

        var result = await Sut().ListAsync(CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldBe(users);
    }

    [Fact]
    public async Task GetAsync_unknown_id_returns_NotFound()
    {
        A.CallTo(() => _repo.GetByIdAsync(A<Guid>._, A<CancellationToken>._)).Returns((User?)null);

        var result = await Sut().GetAsync(Guid.NewGuid(), CancellationToken.None);

        result.IsSuccess.ShouldBeFalse();
        result.Error!.Kind.ShouldBe(ErrorKind.NotFound);
    }

    [Fact]
    public async Task GetAsync_known_id_returns_user()
    {
        var user = new User { Id = Guid.NewGuid(), Name = "Bo", Email = "bo@x.io" };
        A.CallTo(() => _repo.GetByIdAsync(user.Id, A<CancellationToken>._)).Returns(user);

        var result = await Sut().GetAsync(user.Id, CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldBe(user);
    }

    [Fact]
    public async Task SaveAsync_new_user_creates_and_returns_it()
    {
        A.CallTo(() => _repo.GetByEmailAsync(A<string>._, A<CancellationToken>._)).Returns((User?)null);
        A.CallTo(() => _repo.UpsertAsync(A<User>._, A<CancellationToken>._))
            .ReturnsLazily((User u, CancellationToken _) => u);

        var result = await Sut().SaveAsync(null, "Cy", "cy@x.io", CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value!.Id.ShouldNotBe(Guid.Empty);
        result.Value.Name.ShouldBe("Cy");
        A.CallTo(() => _repo.UpsertAsync(A<User>.That.Matches(u => u.Email == "cy@x.io"), A<CancellationToken>._))
            .MustHaveHappenedOnceExactly();
    }

    [Fact]
    public async Task SaveAsync_duplicate_email_on_a_different_user_returns_Conflict()
    {
        var other = new User { Id = Guid.NewGuid(), Name = "Existing", Email = "dup@x.io" };
        A.CallTo(() => _repo.GetByEmailAsync("dup@x.io", A<CancellationToken>._)).Returns(other);

        var result = await Sut().SaveAsync(null, "New", "dup@x.io", CancellationToken.None);

        result.IsSuccess.ShouldBeFalse();
        result.Error!.Kind.ShouldBe(ErrorKind.Conflict);
        A.CallTo(() => _repo.UpsertAsync(A<User>._, A<CancellationToken>._)).MustNotHaveHappened();
    }

    [Fact]
    public async Task SaveAsync_update_of_unknown_id_returns_NotFound()
    {
        A.CallTo(() => _repo.GetByEmailAsync(A<string>._, A<CancellationToken>._)).Returns((User?)null);
        A.CallTo(() => _repo.GetByIdAsync(A<Guid>._, A<CancellationToken>._)).Returns((User?)null);

        var result = await Sut().SaveAsync(Guid.NewGuid(), "Ghost", "ghost@x.io", CancellationToken.None);

        result.IsSuccess.ShouldBeFalse();
        result.Error!.Kind.ShouldBe(ErrorKind.NotFound);
    }
}
