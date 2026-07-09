using System.Text.Json;

namespace IME.API.Middleware;

public sealed class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Unhandled exception. Endpoint: {Endpoint}. Route: {Route}. Method: {Method}. StatusCode: {StatusCode}",
                context.GetEndpoint()?.DisplayName,
                context.Request.Path.Value,
                context.Request.Method,
                StatusCodes.Status500InternalServerError);

            if (!context.Response.HasStarted)
            {
                context.Response.Clear();
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/json";

                var response = new
                {
                    message = "Something went wrong. Please try again later.",
                    statusCode = StatusCodes.Status500InternalServerError,
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(response));
            }
        }
    }
}
