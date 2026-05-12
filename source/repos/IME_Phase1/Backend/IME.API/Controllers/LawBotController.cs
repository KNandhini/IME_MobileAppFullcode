// LawBotController.cs
// Place in: IME.API/Controllers/LawBotController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Infrastructure.Services;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
//[Authorize]
public class LawBotController : ControllerBase
{
    private readonly LawBotService _lawBot;
    private readonly ILogger<LawBotController> _logger;

    public LawBotController(LawBotService lawBot, ILogger<LawBotController> logger)
    {
        _lawBot = lawBot;
        _logger = logger;
    }

    [HttpPost("ask")]
    public async Task<ActionResult<LawBotResponseDTO>> Ask([FromBody] LawBotRequestDTO request)
    {
        if (string.IsNullOrWhiteSpace(request?.Question))
            return BadRequest(new LawBotResponseDTO
            {
                Success = false,
                Message = "Question cannot be empty."
            });

        try
        {
            var answer = await _lawBot.AskAsync(request.Question.Trim());
            return Ok(new LawBotResponseDTO { Success = true, Answer = answer });
        }
        catch (FileNotFoundException ex)
        {
            _logger.LogError(ex, "PDF file missing");
            return StatusCode(500, new LawBotResponseDTO
            {
                Success = false,
                Message = "Law book PDF not found on server. Please contact admin."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LawBot unexpected error");
            return StatusCode(500, new LawBotResponseDTO
            {
                Success = false,
                Message = $"Server error: {ex.Message}"  // shows real error in response for debugging
            });
        }
    }
}