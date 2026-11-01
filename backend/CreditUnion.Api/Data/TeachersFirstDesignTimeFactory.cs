using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CreditUnion.Api.Data;

// EF's command-line migration tool creates the context outside normal app startup.
// This factory supplies SQL Server settings for migration generation without opening
// a database connection or requiring a developer's real password.
public sealed class TeachersFirstDesignTimeFactory : IDesignTimeDbContextFactory<TeachersFirstDbContext>
{
    public TeachersFirstDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__TeachersFirst")
            ?? "Server=localhost;Database=TeachersFirst;User Id=design;Password=design-only-placeholder;TrustServerCertificate=True;";

        var options = new DbContextOptionsBuilder<TeachersFirstDbContext>()
            .UseSqlServer(connectionString)
            .Options;

        return new TeachersFirstDbContext(options);
    }
}
