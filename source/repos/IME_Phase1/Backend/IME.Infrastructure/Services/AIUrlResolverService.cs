using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using IME.Core.Interfaces;
using Microsoft.Extensions.Configuration;

namespace IME.Infrastructure.Services;

public class AIUrlResolverService : IAIUrlResolverService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;
    private readonly CsvUrlRegistryService _csvRegistry;

    // Per-process cache: avoids repeated AI calls for the same municipality
    private static readonly ConcurrentDictionary<string, string[]> _cache =
        new(StringComparer.OrdinalIgnoreCase);

    private const string SystemPrompt =
        "You are a URL research assistant for Indian local government websites. " +
        "Return ONLY a valid JSON array of real, existing URLs. " +
        "No explanations, no markdown, no code fences — just the JSON array.";

    public AIUrlResolverService(
        IHttpClientFactory httpFactory,
        IConfiguration config,
        CsvUrlRegistryService csvRegistry)
    {
        _httpFactory  = httpFactory;
        _config       = config;
        _csvRegistry  = csvRegistry;
    }

    /// <summary>
    /// Returns URLs from the CSV file first (user-managed Excel).
    /// Falls back to the hardcoded C# registry when the CSV has no entry.
    /// AI is never called from here — it is only called from ResolveUrlsAsync.
    /// </summary>
    public string[] GetRegistryUrls(string corpName, string stateName)
    {
        // 1. CSV file — single source of truth the user manages
        var csvUrls = _csvRegistry.GetUrls(corpName);
        if (csvUrls.Length > 0) return csvUrls;

        // 2. Hardcoded C# fallback (safety net when CSV is missing an entry)
        var slug = MunicipalUrlRegistry.BuildSlug(corpName);
        return MunicipalUrlRegistry.GetUrls(slug);
    }

    public async Task<string[]> ResolveUrlsAsync(string corpName, string stateName)
    {
        var cacheKey = $"{corpName}|{stateName}";
        if (_cache.TryGetValue(cacheKey, out var cached)) return cached;

        var apiKey = _config["OpenAI:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey)) return Cache(cacheKey, []);

        var userPrompt = $"""
            Find the official URLs for the local government body "{corpName}" in {stateName}, India.
            Return a JSON array (max 5 items) containing only URLs that really exist:
            1. Official website (.gov.in preferred, e.g. https://www.salemcorporation.gov.in/)
            2. Officers / administration page on the official site (e.g. /officers.php or /office-head-quarters.php)
            3. Wikipedia article (en.wikipedia.org)
            4. tnurbantree.tn.gov.in page — for Tamil Nadu: http://www.tnurbantree.tn.gov.in/<slug>/
            5. tnurbantree.tn.gov.in general-administration page — http://www.tnurbantree.tn.gov.in/<slug>/general-administration/

            Reference examples for Tamil Nadu:
            - Salem Corporation  → ["https://www.salemcorporation.gov.in/","https://www.salemcorporation.gov.in/office-head-quarters.php","https://en.wikipedia.org/wiki/Salem_City_Municipal_Corporation","http://www.tnurbantree.tn.gov.in/salem/general-administration/"]
            - Mettur Municipality → ["http://www.tnurbantree.tn.gov.in/mettur/","http://www.tnurbantree.tn.gov.in/mettur/general-administration/","https://en.wikipedia.org/wiki/Mettur"]
            - Omalur Municipality → ["http://www.tnurbantree.tn.gov.in/omalur/","http://www.tnurbantree.tn.gov.in/omalur/general-administration/","https://en.wikipedia.org/wiki/Omalur"]
            - Sankari Municipality → ["http://www.tnurbantree.tn.gov.in/sankari/","http://www.tnurbantree.tn.gov.in/sankari/general-administration/","https://en.wikipedia.org/wiki/Sankari"]
            - Edappadi / Idappadi → ["http://www.tnurbantree.tn.gov.in/idappadi/","http://www.tnurbantree.tn.gov.in/idappadi/general-administration/","https://en.wikipedia.org/wiki/Edappadi"]

            Return ONLY the JSON array. Nothing else.
            """;

        var payload = new
        {
            model    = "gpt-4o-mini",
            messages = new[]
            {
                new { role = "system", content = SystemPrompt },
                new { role = "user",   content = userPrompt   }
            },
            temperature = 0.1,
            max_tokens  = 300
        };

        try
        {
            var http = _httpFactory.CreateClient();
            http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", apiKey);

            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(12));
            var response = await http.PostAsync(
                "https://api.openai.com/v1/chat/completions",
                new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"),
                cts.Token);

            if (!response.IsSuccessStatusCode)
                return Cache(cacheKey, []);

            var body = await response.Content.ReadAsStringAsync();
            using var json = JsonDocument.Parse(body);
            var content = json.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "";

            var urls = ParseUrlArray(content);

            // Auto-save AI-discovered URLs to the CSV so the next call skips AI entirely
            if (urls.Length > 0)
                _csvRegistry.SaveUrls(corpName, "", urls);

            return Cache(cacheKey, urls);
        }
        catch
        {
            return Cache(cacheKey, []);
        }
    }

    private static string[] Cache(string key, string[] urls)
    {
        _cache[key] = urls;
        return urls;
    }

    private static string[] ParseUrlArray(string content)
    {
        var trimmed = content.Trim();

        // Strip markdown code fences (```json ... ```)
        if (trimmed.StartsWith("```"))
        {
            var s = trimmed.IndexOf('[');
            var e = trimmed.LastIndexOf(']');
            if (s >= 0 && e > s) trimmed = trimmed[s..(e + 1)];
        }
        else
        {
            // Locate the JSON array even if there is surrounding text
            var s = trimmed.IndexOf('[');
            var e = trimmed.LastIndexOf(']');
            if (s >= 0 && e > s) trimmed = trimmed[s..(e + 1)];
        }

        try
        {
            using var arr = JsonDocument.Parse(trimmed);
            if (arr.RootElement.ValueKind != JsonValueKind.Array) return [];

            return arr.RootElement.EnumerateArray()
                .Select(el => el.GetString()?.Trim() ?? "")
                .Where(u => u.StartsWith("http", StringComparison.OrdinalIgnoreCase) && u.Length > 12)
                .Take(5)
                .ToArray();
        }
        catch
        {
            return [];
        }
    }
}
