// LawBotService.cs
// Place in: IME.Infrastructure/Services/LawBotService.cs

using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using UglyToad.PdfPig;

namespace IME.Infrastructure.Services;

public class LawBotService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<LawBotService> _logger;

    private static string? _cachedPdfText;
    private static readonly SemaphoreSlim _pdfLock = new(1, 1);

    private const string SystemPrompt = @"
You are IME Law Assistant, an expert on the Constitution (Seventy-Fourth Amendment) Act, 1992 of India.
RULES:
- Answer ONLY using the law text provided in the CONTEXT section.
- If the answer is not in the context, say: 'This is not covered in the 74th Amendment Act text provided.'
- Be concise and accurate. Always cite the article number (e.g., Article 243-T).
- Use numbered lists for multi-part answers.
- Keep answers under 400 words unless genuinely needed.
";

    public LawBotService(
        IHttpClientFactory httpFactory,
        IConfiguration config,
        ILogger<LawBotService> logger)
    {
        _httpFactory = httpFactory;
        _config = config;
        _logger = logger;
    }

    public async Task<string> AskAsync(string question)
    {
        var pdfText = await GetPdfTextAsync();

        var userContent =
            $"CONTEXT (74th Constitutional Amendment Act, 1992):\n\n{pdfText}\n\n" +
            $"QUESTION:\n{question}";

        var payload = new
        {
            model = "gpt-4o-mini",
            messages = new[]
            {
                new { role = "system", content = SystemPrompt },
                new { role = "user",   content = userContent  }
            },
            temperature = 0.2,
            max_tokens = 600
        };

        var apiKey = _config["OpenAI:ApiKey"]
            ?? throw new InvalidOperationException("OpenAI:ApiKey is not configured in appsettings.json.");

        var http = _httpFactory.CreateClient();
        http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        var response = await http.PostAsync(
            "https://api.openai.com/v1/chat/completions",
            new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json")
        );

        var body = await response.Content.ReadAsStringAsync();
        _logger.LogInformation("OpenAI raw response: {Body}", body);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("OpenAI error {Status}: {Body}", response.StatusCode, body);
            throw new Exception($"OpenAI API error {(int)response.StatusCode}: {body}");
        }

        using var json = JsonDocument.Parse(body);

        var answer = json.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        return answer ?? "Sorry, I could not generate an answer. Please try again.";
    }

    private async Task<string> GetPdfTextAsync()
    {
        if (_cachedPdfText != null) return _cachedPdfText;

        await _pdfLock.WaitAsync();
        try
        {
            if (_cachedPdfText != null) return _cachedPdfText;

            // ── Look for docs/74amend.pdf next to the running .exe ──────────
            var pdfPath = Path.Combine(AppContext.BaseDirectory, "docs", "74amend.pdf");

            // Fallback: current working directory (covers some IIS / publish scenarios)
            if (!File.Exists(pdfPath))
                pdfPath = Path.Combine(Directory.GetCurrentDirectory(), "docs", "74amend.pdf");

            _logger.LogInformation("Resolved PDF path: {Path}", pdfPath);

            if (!File.Exists(pdfPath))
                throw new FileNotFoundException(
                    $"74amend.pdf not found.\n" +
                    $"Expected at: {pdfPath}\n" +
                    $"Place the file in the 'docs' folder next to your API .exe, " +
                    $"e.g. bin/Debug/net8.0/docs/74amend.pdf");

            var sb = new StringBuilder();
            using (var doc = PdfDocument.Open(pdfPath))
                foreach (var page in doc.GetPages())
                    sb.AppendLine(page.Text);

            _cachedPdfText = sb.ToString();
            _logger.LogInformation("PDF cached — {N} characters.", _cachedPdfText.Length);
            return _cachedPdfText;
        }
        finally
        {
            _pdfLock.Release();
        }
    }
}