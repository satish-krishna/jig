using Jig.Domain;
using Microsoft.EntityFrameworkCore;

namespace Jig.Infrastructure;

/// <summary>EF Core context for the Jig database. Holds the User set and its schema.</summary>
public sealed class JigDbContext : DbContext
{
    public JigDbContext(DbContextOptions<JigDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(user =>
        {
            user.HasKey(u => u.Id);
            user.Property(u => u.Name).IsRequired();
            user.Property(u => u.Email).IsRequired();
            user.HasIndex(u => u.Email).IsUnique();
        });
    }
}
