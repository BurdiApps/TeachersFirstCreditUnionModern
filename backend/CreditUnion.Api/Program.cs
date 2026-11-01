using CreditUnion.Api.Data;
using CreditUnion.Api.Endpoints;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

// The builder collects configuration and registers services before the app starts.
var builder = WebApplication.CreateBuilder(args);

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

var connectionString = builder.Configuration.GetConnectionString("TeachersFirst");
var cookieSameSiteSetting = builder.Configuration["Auth:CookieSameSite"] ?? "Lax";
if (!Enum.TryParse<SameSiteMode>(cookieSameSiteSetting, ignoreCase: true, out var cookieSameSite))
{
    throw new InvalidOperationException(
        $"Auth:CookieSameSite must be a valid SameSiteMode, not '{cookieSameSiteSetting}'.");
}

var cookieSecurePolicy = builder.Environment.IsDevelopment()
    ? CookieSecurePolicy.SameAsRequest
    : CookieSecurePolicy.Always;

// Cookie authentication keeps the login ticket HttpOnly, so browser JavaScript
// cannot read it. SameSite and HTTPS add protections for cross-site requests.
builder.Services
    .AddAuthentication(IdentityConstants.ApplicationScheme)
    .AddCookie(IdentityConstants.ApplicationScheme, options =>
    {
        options.Cookie.Name = "TeachersFirst.Member";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = cookieSameSite;
        options.Cookie.SecurePolicy = cookieSecurePolicy;
        options.ExpireTimeSpan = TimeSpan.FromHours(1);
        options.SlidingExpiration = true;

        // Browser APIs should receive status codes instead of HTML login redirects.
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = "TeachersFirst.Antiforgery";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = cookieSecurePolicy;
});

if (!string.IsNullOrWhiteSpace(connectionString))
{
    builder.Services.AddDbContext<TeachersFirstDbContext>(options =>
        options.UseSqlServer(connectionString));

    // Identity's built-in password hasher stores a salted, versioned hash.
    // Never store or compare raw passwords in application code.
    builder.Services.AddIdentityCore<IdentityUser<Guid>>(options =>
        {
            options.User.RequireUniqueEmail = true;
            options.Password.RequiredLength = 12;
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = false;
            options.Lockout.AllowedForNewUsers = true;
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        })
        .AddEntityFrameworkStores<TeachersFirstDbContext>()
        .AddSignInManager();
}

var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

if (!string.IsNullOrWhiteSpace(connectionString))
{
    app.MapAuthEndpoints();
    app.MapAccountEndpoints();
}
else
{
    // Keep health and the public demo assistant available when SQL is not set up,
    // but report a useful error instead of failing later during dependency injection.
    app.MapGet("/api/auth/csrf", (HttpContext context, IAntiforgery antiforgery) =>
    {
        var tokens = antiforgery.GetAndStoreTokens(context);
        return Results.Ok(new { requestToken = tokens.RequestToken });
    });

    var authUnavailable = app.MapGroup("/api/auth");
    authUnavailable.MapGet("/me", () => DatabaseUnavailable());
    authUnavailable.MapPost("/register", () => DatabaseUnavailable());
    authUnavailable.MapPost("/login", () => DatabaseUnavailable());
    authUnavailable.MapPost("/logout", () => DatabaseUnavailable());

    app.MapGet("/api/accounts", () =>
        DatabaseUnavailable("Configure the TeachersFirst SQL Server connection string to use account data."));

    app.MapGet("/api/accounts/{id:guid}/transactions", (Guid id) =>
        DatabaseUnavailable("Configure the TeachersFirst SQL Server connection string to use transaction data."));
}

app.MapPost("/api/assistant", (AssistantRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Message))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["message"] = ["Enter a question to get started."]
        });
    }

    return Results.Ok(new AssistantResponse(GetAssistantReply(request.Message)));
});

app.Run();

static IResult DatabaseUnavailable(string detail = "Configure the TeachersFirst SQL Server connection string to use member services.")
{
    return Results.Problem(detail, statusCode: StatusCodes.Status503ServiceUnavailable);
}

static string GetAssistantReply(string message)
{
    var normalized = message.ToLowerInvariant();
    if (normalized.Contains("balance", StringComparison.Ordinal) ||
        normalized.Contains("account", StringComparison.Ordinal))
    {
        return "Sign in to see the fictional accounts linked to your demo login. This project does not connect to a real credit union or real money.";
    }

    if (normalized.Contains("routing", StringComparison.Ordinal) ||
        normalized.Contains("direct deposit", StringComparison.Ordinal))
    {
        return "For this demo, please use the secure contact options on the real credit union website to confirm routing details. I can’t provide or verify account numbers here.";
    }

    if (normalized.Contains("save", StringComparison.Ordinal) ||
        normalized.Contains("savings", StringComparison.Ordinal) ||
        normalized.Contains("summer", StringComparison.Ordinal))
    {
        return "Our sample Summer Savings account can help you set a goal and build toward it at your own pace. Current rates and eligibility would need to be confirmed with a team member.";
    }

    if (normalized.Contains("loan", StringComparison.Ordinal) ||
        normalized.Contains("borrow", StringComparison.Ordinal))
    {
        return "We offer educator-focused borrowing options in this concept. Visit the Borrow section to compare sample options, then connect with a team member for current terms.";
    }

    if (normalized.Contains("hour", StringComparison.Ordinal) ||
        normalized.Contains("contact", StringComparison.Ordinal) ||
        normalized.Contains("person", StringComparison.Ordinal))
    {
        return "Our friendly team is here to help. Call (800) 555-0142, Monday–Friday, 8:00 am–5:00 pm. This is fictional contact information for the prototype.";
    }

    return "I can help with checking and savings, educator borrowing, membership, or getting in touch with our team. What would you like to explore?";
}

public sealed record AssistantRequest(string Message);
public sealed record AssistantResponse(string Reply);
