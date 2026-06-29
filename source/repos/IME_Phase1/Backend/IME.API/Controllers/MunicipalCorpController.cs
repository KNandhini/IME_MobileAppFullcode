using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class MunicipalCorpController : ControllerBase
{
    private readonly IMunicipalCorpRepository _repo;
    private readonly IWebScraperService _scraper;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public MunicipalCorpController(
        IMunicipalCorpRepository repo,
        IWebScraperService scraper,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _repo               = repo;
        _scraper            = scraper;
        _httpClientFactory  = httpClientFactory;
        _configuration      = configuration;
    }

    // GET /api/MunicipalCorp/test-url?url=https://www.tnurbantree.tn.gov.in/erode/
    // Diagnostic: checks whether a URL is reachable from this server.
    // Returns status code, content length, elapsed ms, and first 500 chars of content.
    [HttpGet("test-url")]
    public async Task<ActionResult> TestUrl([FromQuery] string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return BadRequest(new { error = "url query param is required" });

        var client = _httpClientFactory.CreateClient("scraper");
        var sw = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            using var response = await client.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);
            var body    = await response.Content.ReadAsStringAsync();
            sw.Stop();
            return Ok(new
            {
                url,
                statusCode    = (int)response.StatusCode,
                isSuccess     = response.IsSuccessStatusCode,
                elapsedMs     = sw.ElapsedMilliseconds,
                contentLength = body.Length,
                contentPreview = body.Length > 500 ? body[..500] : body,
            });
        }
        catch (Exception ex)
        {
            sw.Stop();
            return Ok(new
            {
                url,
                error      = ex.Message,
                errorType  = ex.GetType().Name,
                elapsedMs  = sw.ElapsedMilliseconds,
            });
        }
    }

    // GET /api/MunicipalCorp/scrape/Erode?state=Tamil%20Nadu
    [HttpGet("scrape/{corpName}")]
    public async Task<ActionResult<ApiResponse<CorpScrapeDTO>>> ScrapeCorpPage(
        string corpName, [FromQuery] string state = "Tamil Nadu")
    {
        try
        {
            var result = await _scraper.ScrapeCorpPageAsync(
                Uri.UnescapeDataString(corpName), state);

            return Ok(new ApiResponse<CorpScrapeDTO>
            {
                Success = result.Success,
                Message = result.Success ? "Scraped successfully" : result.Error,
                Data    = result
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<CorpScrapeDTO>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    [HttpGet("districts/{stateId:int}")]
    public async Task<ActionResult<ApiResponse<List<DistrictDTO>>>> GetDistricts(int stateId)
    {
        try
        {
            var data = await _repo.GetDistrictsAsync(stateId);
            return Ok(new ApiResponse<List<DistrictDTO>> { Success = true, Data = data });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<DistrictDTO>> { Success = false, Message = ex.Message });
        }
    }

    [HttpGet("corps/district/{districtId:int}")]
    public async Task<ActionResult<ApiResponse<List<MunicipalCorpDTO>>>> GetCorpsByDistrict(int districtId)
    {
        try
        {
            var data = await _repo.GetMunicipalCorpsAsync(districtId);
            return Ok(new ApiResponse<List<MunicipalCorpDTO>> { Success = true, Data = data });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<MunicipalCorpDTO>> { Success = false, Message = ex.Message });
        }
    }

    [HttpGet("corps/state/{stateId:int}")]
    public async Task<ActionResult<ApiResponse<List<MunicipalCorpDTO>>>> GetCorpsByState(int stateId)
    {
        try
        {
            var data = await _repo.GetMunicipalCorpsByStateAsync(stateId);
            return Ok(new ApiResponse<List<MunicipalCorpDTO>> { Success = true, Data = data });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<MunicipalCorpDTO>> { Success = false, Message = ex.Message });
        }
    }

    [HttpGet("corps/{corpId:int}")]
    public async Task<ActionResult<ApiResponse<MunicipalCorpDTO>>> GetCorpById(int corpId)
    {
        try
        {
            var data = await _repo.GetMunicipalCorpByIdAsync(corpId);
            if (data == null)
                return NotFound(new ApiResponse<MunicipalCorpDTO> { Success = false, Message = "Corporation not found" });

            return Ok(new ApiResponse<MunicipalCorpDTO> { Success = true, Data = data });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<MunicipalCorpDTO> { Success = false, Message = ex.Message });
        }
    }

    // POST /api/MunicipalCorp/ai-detail
    // Proxies an OpenAI chat call server-side for CorpDetailsScreen tab data
    [HttpPost("ai-detail")]
    public async Task<ActionResult> GetAIDetail([FromBody] AiDetailRequest request)
    {
        var apiKey = _configuration["OpenAI:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            return StatusCode(500, new { success = false, message = "OpenAI not configured on server" });

        var payload = System.Text.Json.JsonSerializer.Serialize(new
        {
            model       = "gpt-4o-mini",
            response_format = new { type = "json_object" },
            messages    = new[]
            {
                new { role = "system", content = request.SystemPrompt },
                new { role = "user",   content = request.UserPrompt   }
            },
            temperature = 0,
            max_tokens  = 3000
        });

        var httpClient = _httpClientFactory.CreateClient();
        httpClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

        using var requestContent = new StringContent(payload, System.Text.Encoding.UTF8, "application/json");
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(55));
        using var httpResponse = await httpClient.PostAsync(
            "https://api.openai.com/v1/chat/completions", requestContent, cts.Token);

        if (!httpResponse.IsSuccessStatusCode)
            return StatusCode((int)httpResponse.StatusCode,
                new { success = false, message = $"OpenAI error {(int)httpResponse.StatusCode}" });

        var responseText = await httpResponse.Content.ReadAsStringAsync();

        using var doc = System.Text.Json.JsonDocument.Parse(responseText);
        var aiContent = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? "{}";

        return Ok(new { success = true, data = aiContent });
    }

    // GET /api/MunicipalCorp/ai-corps?district=Erode&state=Tamil%20Nadu
    // Calls OpenAI server-side so the mobile device does not need direct access to api.openai.com
    [HttpGet("ai-corps")]
    public async Task<ActionResult> GetAICorps(
        [FromQuery] string district, [FromQuery] string state = "Tamil Nadu")
    {
        if (string.IsNullOrWhiteSpace(district))
            return BadRequest(new { success = false, message = "district is required" });

        var apiKey = _configuration["OpenAI:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            return StatusCode(500, new { success = false, message = "OpenAI not configured on server" });

        var prompt =
            $"List all municipal bodies in {district} district, {state}, India. " +
            "Return JSON exactly: {\"corporations\":[{\"name\":\"string\",\"type\":\"string\",\"ward_count\":0,\"population\":0}]} " +
            "where type is one of: Municipal Corporation, Municipality, Town Panchayat, Nagar Panchayat. " +
            "Use null for unknown ward_count or population.";

        var payload = System.Text.Json.JsonSerializer.Serialize(new
        {
            model           = "gpt-4o-mini",
            response_format = new { type = "json_object" },
            messages        = new[]
            {
                new { role = "system", content = "You are an expert on Institute of municipal governance. Always respond with valid JSON only." },
                new { role = "user",   content = prompt }
            },
            temperature = 0,
            max_tokens  = 4000
        });

        var httpClient = _httpClientFactory.CreateClient();
        httpClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

        using var requestContent = new StringContent(payload, System.Text.Encoding.UTF8, "application/json");
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
        using var httpResponse = await httpClient.PostAsync(
            "https://api.openai.com/v1/chat/completions", requestContent, cts.Token);

        if (!httpResponse.IsSuccessStatusCode)
            return StatusCode((int)httpResponse.StatusCode,
                new { success = false, message = $"OpenAI error {(int)httpResponse.StatusCode}" });

        var responseText = await httpResponse.Content.ReadAsStringAsync();

        string corpsJson;
        using (var doc = System.Text.Json.JsonDocument.Parse(responseText))
        {
            var aiContent = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "{}";

            using var aiDoc = System.Text.Json.JsonDocument.Parse(aiContent);
            corpsJson = aiDoc.RootElement.TryGetProperty("corporations", out var arr)
                ? arr.GetRawText()
                : "[]";
        }

        return Content($"{{\"success\":true,\"data\":{corpsJson}}}", "application/json");
    }
}
