using System.Security.Claims;
using CreditUnion.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace CreditUnion.Api.Endpoints;

public static class AccountEndpoints
{
    public static IEndpointRouteBuilder MapAccountEndpoints(this IEndpointRouteBuilder routes)
    {
        // Requiring authorization on the group protects both account endpoints.
        var group = routes.MapGroup("/api/accounts").RequireAuthorization();

        group.MapGet("", async (
            ClaimsPrincipal principal,
            TeachersFirstDbContext db,
            CancellationToken cancellationToken) =>
        {
            var memberId = GetMemberId(principal);
            if (memberId is null)
            {
                return Results.Unauthorized();
            }

            // Filter in SQL by the signed-in member before returning any account
            // data; a caller cannot choose another member's ID in the URL.
            var accounts = await db.Accounts
                .AsNoTracking()
                .Where(account => account.MemberId == memberId.Value)
                .OrderBy(account => account.Name)
                .Select(account => new AccountResponse(
                    account.Id,
                    account.Name,
                    account.MaskedNumber,
                    account.AccountType,
                    account.Balance,
                    account.AvailableBalance,
                    account.AnnualPercentageYield))
                .ToListAsync(cancellationToken);

            return Results.Ok(accounts);
        });

        group.MapGet("/{id:guid}/transactions", async (
            Guid id,
            ClaimsPrincipal principal,
            TeachersFirstDbContext db,
            CancellationToken cancellationToken) =>
        {
            var memberId = GetMemberId(principal);
            if (memberId is null)
            {
                return Results.Unauthorized();
            }

            // Checking both IDs in one query avoids revealing whether someone
            // else's account exists (the response is 404 either way).
            var accountExists = await db.Accounts.AnyAsync(
                account => account.Id == id && account.MemberId == memberId.Value,
                cancellationToken);
            if (!accountExists)
            {
                return Results.NotFound(new { message = "Account not found." });
            }

            var transactions = await db.Transactions
                .AsNoTracking()
                .Where(transaction => transaction.AccountId == id)
                .OrderByDescending(transaction => transaction.PostedAtUtc)
                .Select(transaction => new TransactionResponse(
                    transaction.Id,
                    transaction.Description,
                    transaction.Category,
                    transaction.Amount,
                    transaction.PostedAtUtc))
                .ToListAsync(cancellationToken);

            return Results.Ok(transactions);
        });

        return routes;
    }

    private static Guid? GetMemberId(ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var memberId) ? memberId : null;
    }
}

public sealed record AccountResponse(
    Guid Id,
    string Name,
    string MaskedNumber,
    string AccountType,
    decimal Balance,
    decimal AvailableBalance,
    decimal? AnnualPercentageYield);

public sealed record TransactionResponse(
    Guid Id,
    string Description,
    string Category,
    decimal Amount,
    DateTime PostedAtUtc);
