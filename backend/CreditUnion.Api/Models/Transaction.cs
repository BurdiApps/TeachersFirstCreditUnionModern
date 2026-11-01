namespace CreditUnion.Api.Models;

// A posted transaction belongs to one account; its foreign key is used by EF
// Core to load transactions for an account without copying account details.
public sealed class Transaction
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }
    public required string Description { get; set; }
    public required string Category { get; set; }
    public decimal Amount { get; set; }
    public DateTime PostedAtUtc { get; set; }
    public Account Account { get; set; } = null!;
}
