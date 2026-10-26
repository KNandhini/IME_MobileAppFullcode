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

    /// <summary>
    /// GET /api/lawbot/documents
    /// Returns the registered law documents and their sample questions,
    /// so the mobile app can render one quick-questions row per document
    /// without hardcoding the list on the frontend.
    /// </summary>
    [HttpGet("documents")]
    public ActionResult<List<LawBotDocumentDTO>> GetDocuments()
    {
        var docs = _lawBot.GetDocuments()
            .Select(d => new LawBotDocumentDTO
            {
                Key = d.Key,
                DisplayName = d.DisplayName,
                SampleQuestions = d.SampleQuestions.ToList(),
            })
            .ToList();

        return Ok(docs);
    }

    /// <summary>
    /// POST /api/lawbot/ask
    /// Routes the question to the relevant document(s) and returns an answer.
    /// </summary>
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
        catch (TimeoutException ex)
        {
            _logger.LogError(ex, "LawBot request timed out");
            return StatusCode(504, new LawBotResponseDTO
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LawBot unexpected error");
            return StatusCode(500, new LawBotResponseDTO
            {
                Success = false,
                Message = $"Server error: {ex.Message}"
            });
        }
    }
}