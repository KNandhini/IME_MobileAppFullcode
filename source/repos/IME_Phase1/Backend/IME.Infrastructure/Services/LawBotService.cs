// LawBotService.cs
// Place in: IME.Infrastructure/Services/LawBotService.cs
//
// Supports multiple law documents. Instead of trying to guess which single
// document a question belongs to (keyword/LLM routing), it now sends the
// full text of EVERY registered document to OpenAI on every question, each
// clearly labeled under its own "### DOCUMENT:" header, and lets the model
// itself find the relevant part(s). This avoids false negatives where a
// valid question (e.g. "reservation of seats for women", "books to
// maintain") didn't happen to match a curated keyword list and was
// incorrectly reported as "not covered".
//
// This is safe and cheap at the current scale (2 documents, ~20 pages
// total). If you later add many more / much larger documents, revisit this
// with a proper retrieval approach (e.g. embeddings-based chunk search)
// instead of sending everything on every request.

using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using UglyToad.PdfPig;

namespace IME.Infrastructure.Services;

/// <summary>
/// Describes one law document the bot can answer from.
/// Add an entry here for each new PDF you drop into the docs folder.
/// </summary>
public class LawDocument
{
    public string Key { get; init; } = "";          // short unique id, e.g. "74amend"
    public string DisplayName { get; init; } = "";   // shown to the model / in citations / in the UI
    public string FileName { get; init; } = "";      // file name inside the docs folder

    // No longer used for routing (routing was removed — see AskAsync), but
    // left in place in case you want to reintroduce keyword-based routing
    // later, e.g. if you add many more / much larger documents.
    public string[] Keywords { get; init; } = [];

    // Shown as tappable quick-questions in the UI for this document.
    public string[] SampleQuestions { get; init; } = [];
}

public class LawBotService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<LawBotService> _logger;

    // ── Register every document the bot knows about here ───────────────
    private static readonly List<LawDocument> Documents = new()
    {
        new LawDocument
        {
            Key = "74amend",
            DisplayName = "The Constitution (Seventy-Fourth Amendment) Act, 1992",
            FileName = "74amend.pdf",
            Keywords = new[]
            {
                "74th amendment", "74 amendment", "nagar panchayat",
                "ward committee", "twelfth schedule", "243", "state finance commission",
                "metropolitan planning committee", "district planning committee"
            },
            SampleQuestions = new[]
            {
                "What is the 74th Amendment?",
                "What are the 3 types of municipalities?",
                "What is the 12th Schedule?",
                "Reservation of seats for women?",
                "What is Ward Committee?",
                "Duration of municipalities?",
                "What is State Finance Commission?",
                "Metropolitan Planning Committee?",
            }
        },
        new LawDocument
        {
            Key = "iuei_bylaw",
            DisplayName = "Bylaws of Institution of Urban Engineers, India (IUEI)",
            FileName = "Bye_law-IUEI.pdf",
            Keywords = new[]
            {
                "iuei", "bylaw", "bye law", "institution of urban engineers",
                "membership fee", "admission fee", "admision fee", "governing council",
                "executive committee", "gc", "ngc", "agm", "egm", "quorum",
                "societies registration act", "removal of members", "remove member",
                "special resolution", "treasurer", "secretary general", "dissolution"
            },
            SampleQuestions = new[]
            {
                "What is the admission fee for members?",
                "Who can vote in the General Body?",
                "How is a member removed?",
                "What is the quorum for AGM?",
                "Powers of the President?",
                "How does dissolution of the society work?",
                "What is the term of office for EC and GC?",
                "How are surplus funds shared between state and national body?",
            }
        },
        // Add new documents here — the UI's sample questions pick them up
        // automatically, and AskAsync will include them in every request.
    };

    // key -> cached extracted text
    private static readonly Dictionary<string, string> _cachedTexts = new();
    private static readonly SemaphoreSlim _cacheLock = new(1, 1);

    private const string SystemPromptTemplate = @"
You are IME Law Assistant, an expert on the following legal document(s):

    {0}

RULES:
- Answer ONLY using the law text provided in the CONTEXT section below.
- Multiple documents may be provided, each under its own '### DOCUMENT:' header.
  Search ALL of them for the answer — do not assume the answer is only in the
  first one. Use whichever document actually contains the relevant text.
- If the answer is not in the context, say: 'This is not covered in the documents provided.'
- Be concise and accurate. Always cite the specific article/section number,
  and state which document it came from.
- Use numbered lists for multi-part answers.
- Keep answers under 400 words unless genuinely needed.
";

    private static readonly TimeSpan OpenAiTimeout = TimeSpan.FromSeconds(30);

    public LawBotService(
        IHttpClientFactory httpFactory,
        IConfiguration config,
        ILogger<LawBotService> logger)
    {
        _httpFactory = httpFactory;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Returns the registered documents (key, display name, sample questions)
    /// so the controller can expose them to the UI without hardcoding them
    /// on the frontend.
    /// </summary>
    public IReadOnlyList<LawDocument> GetDocuments() => Documents;

    public async Task<string> AskAsync(string question)
    {
        // Always search every registered document rather than trying to
        // pre-guess which one is relevant. Keyword/LLM-title routing was
        // causing false negatives on real user phrasing (e.g. "reservation
        // of seats for women", "books to maintain") that didn't happen to
        // match a curated keyword list. At this scale (2 short documents)
        // there's no meaningful cost to just letting the model search both.
        var relevantDocs = Documents;

        if (relevantDocs.Count == 0)
        {
            return "No law documents are currently registered on the server.";
        }

        var contextBuilder = new StringBuilder();
        foreach (var doc in relevantDocs)
        {
            var text = await GetDocumentTextAsync(doc);

            if (text.Trim().Length < 200)
            {
                _logger.LogWarning(
                    "{Key} has only {N} extracted characters — likely a scanned PDF with no text layer. " +
                    "Answers for this document may be unreliable until it is OCR'd.",
                    doc.Key, text.Trim().Length);
            }

            contextBuilder.AppendLine($"### DOCUMENT: {doc.DisplayName}");
            contextBuilder.AppendLine(text);
            contextBuilder.AppendLine();
        }

        var docListForPrompt = string.Join(" and ", relevantDocs.Select(d => d.DisplayName));
        var systemPrompt = string.Format(SystemPromptTemplate, docListForPrompt);

        var userContent = $"CONTEXT:\n\n{contextBuilder}\n\nQUESTION:\n{question}";

        return await CallOpenAiAsync(systemPrompt, userContent, maxTokens: 600, temperature: 0.2);
    }

    private async Task<string> GetDocumentTextAsync(LawDocument doc)
    {
        if (_cachedTexts.TryGetValue(doc.Key, out var cached))
            return cached;

        await _cacheLock.WaitAsync();
        try
        {
            if (_cachedTexts.TryGetValue(doc.Key, out cached))
                return cached;

            // ── Look for docs/<FileName> next to the running .exe ──────────
            var pdfPath = Path.Combine(AppContext.BaseDirectory, "docs", doc.FileName);

            // Fallback: current working directory (covers some IIS / publish scenarios)
            if (!File.Exists(pdfPath))
                pdfPath = Path.Combine(Directory.GetCurrentDirectory(), "docs", doc.FileName);

            _logger.LogInformation("Resolved PDF path for {Key}: {Path}", doc.Key, pdfPath);

            if (!File.Exists(pdfPath))
                throw new FileNotFoundException(
                    $"{doc.FileName} not found.\n" +
                    $"Expected at: {pdfPath}\n" +
                    $"Place the file in the 'docs' folder next to your API .exe, " +
                    $"e.g. bin/Debug/net8.0/docs/{doc.FileName}");

            var sb = new StringBuilder();
            using (var pdf = PdfDocument.Open(pdfPath))
                foreach (var page in pdf.GetPages())
                    sb.AppendLine(page.Text);

            var text = sb.ToString();
            _cachedTexts[doc.Key] = text;

            _logger.LogInformation("Cached {Key} — {N} characters.", doc.Key, text.Length);
            if (text.Trim().Length < 200)
            {
                _logger.LogWarning(
                    "{Key} extracted suspiciously little text ({N} chars) — this PDF is likely " +
                    "a scanned image with no text layer. Run it through OCR before it will answer well.",
                    doc.Key, text.Trim().Length);
            }

            return text;
        }
        finally
        {
            _cacheLock.Release();
        }
    }

    private async Task<string> CallOpenAiAsync(string systemPrompt, string userContent, int maxTokens, double temperature)
    {
        var payload = new
        {
            model = "gpt-4o-mini",
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user",   content = userContent  }
            },
            temperature,
            max_tokens = maxTokens
        };

        var apiKey = _config["OpenAI:ApiKey"]
            ?? throw new InvalidOperationException("OpenAI:ApiKey is not configured in appsettings.json.");

        var http = _httpFactory.CreateClient();
        http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        using var cts = new CancellationTokenSource(OpenAiTimeout);

        HttpResponseMessage response;
        try
        {
            response = await http.PostAsync(
                "https://api.openai.com/v1/chat/completions",
                new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json"),
                cts.Token);
        }
        catch (TaskCanceledException) when (cts.IsCancellationRequested)
        {
            _logger.LogError("OpenAI call timed out after {Seconds}s.", OpenAiTimeout.TotalSeconds);
            throw new TimeoutException(
                $"The AI request took longer than {OpenAiTimeout.TotalSeconds:0}s and was cancelled. " +
                "This usually happens with very large documents — try a more specific question.");
        }

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

        return answer?.Trim() ?? "Sorry, I could not generate an answer. Please try again.";
    }
}