using Microsoft.AspNetCore.Mvc;

namespace IME.API.Controllers;

[ApiController]
[Route("api/log-error")]
public class LogErrorController : ControllerBase
{
    private readonly ILogger<LogErrorController> _logger;

    public LogErrorController(ILogger<LogErrorController> logger)
    {
        _logger = logger;
    }

    [HttpPost]
    public IActionResult LogFrontendError([FromBody] FrontendErrorLogRequest request)
    {
        _logger.LogError(
            "Frontend error at {Timestamp}. Url: {Url}. Endpoint: {Endpoint}. Method: {Method}. Status: {Status}. Source: {Source}. Message: {Message}. Stack: {Stack}",
            request.Timestamp,
            request.Url,
            request.Endpoint,
            request.Method,
            request.Status,
            request.Source,
            request.Message,
            request.Stack);

        return Accepted();
    }
}

public sealed class FrontendErrorLogRequest
{
    public string? Message { get; set; }
    public string? Stack { get; set; }
    public int? Status { get; set; }
    public string? Url { get; set; }
    public string? Method { get; set; }
    public string? Endpoint { get; set; }
    public string? Source { get; set; }
    public DateTimeOffset? Timestamp { get; set; }
}
