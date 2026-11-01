namespace CreditUnion.Api.Models;

// One account belongs to exactly one Identity user. The API uses MemberId
// to keep one member's records separate from every other member's records.
public sealed class Account
{
    public Guid Id { get; set; }
    public Guid MemberId { get; set; }
    public required string Name { get; set; }
    public required string MaskedNumber { get; set; }
    public required string AccountType { get; set; }
    public decimal Balance { get; set; }
    public decimal AvailableBalance { get; set; }
    public decimal? AnnualPercentageYield { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
