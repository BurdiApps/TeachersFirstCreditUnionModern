using CreditUnion.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CreditUnion.Api.Data;

// One EF Core context owns both Identity's login tables and our banking tables.
// Keeping them together lets a member ID be a real database foreign key.
public sealed class TeachersFirstDbContext(DbContextOptions<TeachersFirstDbContext> options)
    : IdentityDbContext<IdentityUser<Guid>, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Transaction> Transactions => Set<Transaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Identity configures its own tables first; our entity rules are added after.
        base.OnModelCreating(modelBuilder);

        // Identity checks for duplicate email addresses in code too; a unique
        // index closes the race where two registrations arrive at once.
        modelBuilder.Entity<IdentityUser<Guid>>()
            .HasIndex(user => user.NormalizedEmail)
            .IsUnique()
            .HasDatabaseName("EmailIndex");

        modelBuilder.Entity<Account>(entity =>
        {
            entity.ToTable("Accounts");
            entity.HasKey(account => account.Id);
            entity.Property(account => account.Name).HasMaxLength(80).IsRequired();
            entity.Property(account => account.MaskedNumber).HasMaxLength(24).IsRequired();
            entity.Property(account => account.AccountType).HasMaxLength(40).IsRequired();
            entity.Property(account => account.Balance).HasPrecision(18, 2);
            entity.Property(account => account.AvailableBalance).HasPrecision(18, 2);
            entity.Property(account => account.AnnualPercentageYield).HasPrecision(5, 3);
            entity.HasOne<IdentityUser<Guid>>()
                .WithMany()
                .HasForeignKey(account => account.MemberId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.ToTable("Transactions");
            entity.HasKey(transaction => transaction.Id);
            entity.Property(transaction => transaction.Description).HasMaxLength(120).IsRequired();
            entity.Property(transaction => transaction.Category).HasMaxLength(50).IsRequired();
            entity.Property(transaction => transaction.Amount).HasPrecision(18, 2);
            entity.HasIndex(transaction => new { transaction.AccountId, transaction.PostedAtUtc });
            entity.HasOne(transaction => transaction.Account)
                .WithMany(account => account.Transactions)
                .HasForeignKey(transaction => transaction.AccountId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
