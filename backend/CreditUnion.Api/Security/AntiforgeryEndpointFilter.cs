using Microsoft.AspNetCore.Antiforgery;

namespace CreditUnion.Api.Security;

// Cookie authentication is sent automatically by browsers. This filter makes
// state-changing API routes also require a token from the trusted frontend.
public sealed class AntiforgeryEndpointFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var antiforgery = context.HttpContext.RequestServices.GetRequiredService<IAntiforgery>();
        try
        {
            await antiforgery.ValidateRequestAsync(context.HttpContext);
        }
        catch (AntiforgeryValidationException)
        {
            return Results.Problem(
                "The security token is missing or expired. Refresh the page and try again.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        return await next(context);
    }
}
