using System.Security.Claims;
using CreditUnion.Api.Security;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;

namespace CreditUnion.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder routes)
    {
        // A route group gives related endpoints one shared URL prefix.
        var group = routes.MapGroup("/api/auth");

        // A SPA cannot read the HttpOnly antiforgery cookie, so it gets the
        // matching request token here and sends it back in the configured header.
        group.MapGet("/csrf", (HttpContext context, IAntiforgery antiforgery) =>
        {
            var tokens = antiforgery.GetAndStoreTokens(context);
            return Results.Ok(new { requestToken = tokens.RequestToken });
        });

        group.MapGet("/me", async (
            ClaimsPrincipal principal,
            UserManager<IdentityUser<Guid>> users) =>
        {
            var user = await users.GetUserAsync(principal);
            return Results.Ok(new AuthStatus(user is not null, user?.Email));
        });

        group.MapPost("/register", async (
                RegisterRequest request,
                UserManager<IdentityUser<Guid>> users,
                SignInManager<IdentityUser<Guid>> signInManager) =>
            {
                if (string.IsNullOrWhiteSpace(request.Email) ||
                    request.Email.Length > 254 ||
                    string.IsNullOrWhiteSpace(request.Password) ||
                    request.Password.Length > 128)
                {
                    return Results.ValidationProblem(new Dictionary<string, string[]>
                    {
                        ["credentials"] = ["Enter a valid email address and a password of at most 128 characters."]
                    });
                }

                var email = request.Email.Trim();
                var user = new IdentityUser<Guid>
                {
                    Id = Guid.NewGuid(),
                    UserName = email,
                    Email = email
                };

                var result = await users.CreateAsync(user, request.Password);
                if (!result.Succeeded)
                {
                    // Identity checks password strength and unique email. Keep
                    // duplicate-account errors generic to reduce email discovery.
                    var errors = result.Errors
                        .Where(error => !error.Code.StartsWith("Duplicate", StringComparison.Ordinal))
                        .Select(error => error.Description)
                        .ToArray();

                    if (errors.Length == 0)
                    {
                        return Results.BadRequest(new { message = "An account could not be created with those details." });
                    }

                    return Results.ValidationProblem(new Dictionary<string, string[]>
                    {
                        ["credentials"] = errors
                    });
                }

                // This sample has no email verification workflow. A real member
                // institution must verify identity and membership before access.
                await signInManager.SignInAsync(user, isPersistent: false);
                return Results.Ok(new AuthStatus(true, user.Email));
            })
            .AddEndpointFilter<AntiforgeryEndpointFilter>();

        group.MapPost("/login", async (
                LoginRequest request,
                SignInManager<IdentityUser<Guid>> signInManager) =>
            {
                if (string.IsNullOrWhiteSpace(request.Email) ||
                    request.Email.Length > 254 ||
                    string.IsNullOrWhiteSpace(request.Password) ||
                    request.Password.Length > 128)
                {
                    return Results.Json(
                        new { message = "Email or password is incorrect." },
                        statusCode: StatusCodes.Status401Unauthorized);
                }

                var result = await signInManager.PasswordSignInAsync(
                    request.Email.Trim(),
                    request.Password,
                    isPersistent: false,
                    lockoutOnFailure: true);

                if (!result.Succeeded)
                {
                    return Results.Json(
                        new { message = "Email or password is incorrect, or sign-in is temporarily unavailable." },
                        statusCode: StatusCodes.Status401Unauthorized);
                }

                return Results.Ok(new AuthStatus(true, request.Email.Trim()));
            })
            .AddEndpointFilter<AntiforgeryEndpointFilter>();

        group.MapPost("/logout", async (SignInManager<IdentityUser<Guid>> signInManager) =>
            {
                await signInManager.SignOutAsync();
                return Results.Ok(new AuthStatus(false, null));
            })
            .RequireAuthorization()
            .AddEndpointFilter<AntiforgeryEndpointFilter>();

        return routes;
    }
}

public sealed record RegisterRequest(string Email, string Password);
public sealed record LoginRequest(string Email, string Password);
public sealed record AuthStatus(bool IsAuthenticated, string? Email);
