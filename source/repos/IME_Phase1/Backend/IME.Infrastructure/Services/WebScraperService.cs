using HtmlAgilityPack;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace IME.Infrastructure.Services;

public class WebScraperService : IWebScraperService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IAIUrlResolverService _aiUrlResolver;

    // Caches successful scrape results for 1 hour.
    // Prevents commissioner / deputy commissioner names from changing on every refresh
    // (root cause: different pages succeed/fail each request, yielding different extractions).
    private static readonly ConcurrentDictionary<string, (CorpScrapeDTO dto, DateTime cachedAt)> _resultCache =
        new(StringComparer.OrdinalIgnoreCase);
    private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(1);

    public WebScraperService(IHttpClientFactory httpClientFactory, IAIUrlResolverService aiUrlResolver)
    {
        _httpClientFactory = httpClientFactory;
        _aiUrlResolver     = aiUrlResolver;
    }

    public async Task<CorpScrapeDTO> ScrapeCorpPageAsync(string corpName, string stateName)
    {
        var cacheKey = $"{corpName.Trim().ToLowerInvariant()}|{stateName.Trim().ToLowerInvariant()}";

        if (_resultCache.TryGetValue(cacheKey, out var cached) &&
            DateTime.UtcNow - cached.cachedAt < CacheTtl)
            return cached.dto;

        var client   = _httpClientFactory.CreateClient("scraper");
        var stateKey = Normalize(stateName);
        var slug     = BuildSlug(corpName);
        var wikiName = corpName.Replace(' ', '_');

        // ── Step 1: Registry (Excel / CSV) URLs — no AI call, no cost ────────
        var registryUrls = _aiUrlResolver.GetRegistryUrls(corpName, stateName);
        if (registryUrls.Length > 0)
        {
            var (regDto, regOk) = await TryScrapeUrlsAsync(client, corpName, stateName, registryUrls);
            if (regOk)
            {
                _resultCache[cacheKey] = (regDto, DateTime.UtcNow);
                return regDto;
            }
            // All registry URLs returned empty content — fall through to AI
        }

        // ── Step 2: AI URL resolver — only when not in registry or registry failed ──
        var aiUrls = await _aiUrlResolver.ResolveUrlsAsync(corpName, stateName);

        // Minimal fallback when AI returns nothing (missing API key / network issue)
        if (aiUrls.Length == 0)
        {
            aiUrls = stateKey == "tamilnadu"
                ? [$"http://www.tnurbantree.tn.gov.in/{slug}/general-administration/",
                   $"http://www.tnurbantree.tn.gov.in/{slug}/",
                   $"https://en.wikipedia.org/wiki/{wikiName}"]
                : [$"https://en.wikipedia.org/wiki/{wikiName}"];
        }

        var (aiDto, _) = await TryScrapeUrlsAsync(client, corpName, stateName, aiUrls);
        _resultCache[cacheKey] = (aiDto, DateTime.UtcNow);
        return aiDto;
    }

    // Fetches all candidate URLs in parallel, extracts text and officers, and
    // returns a CorpScrapeDTO plus a boolean indicating whether any content was found.
    private async Task<(CorpScrapeDTO dto, bool success)> TryScrapeUrlsAsync(
        HttpClient client, string corpName, string stateName, string[] candidateUrls)
    {
        var urlsToTry = candidateUrls.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();

        // tnurbantree is slow (~43 s) — long budget, timeout swallowed silently.
        // All other URLs get a 15 s budget.
        using var mainCts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        using var tnCts   = new CancellationTokenSource(TimeSpan.FromSeconds(50));

        var tasks = urlsToTry.Select(url =>
        {
            bool isTn = url.Contains("tnurbantree", StringComparison.OrdinalIgnoreCase);
            return FetchPageAsync(client, url, isTn ? tnCts.Token : mainCts.Token, silentOnTimeout: isTn);
        }).ToArray();

        var results = await Task.WhenAll(tasks);

        var combined        = new System.Text.StringBuilder();
        var urlResults      = new List<UrlScrapeResult>();
        string? firstSuccessUrl = null;
        string? primaryError    = null;

        for (
            int i = 0; i < results.Length; i++)
        {
            var (text, error) = results[i];
            if (text != null)
            {
                urlResults.Add(new UrlScrapeResult { Url = urlsToTry[i], Success = true, PageText = text });
                firstSuccessUrl ??= urlsToTry[i];
                if (combined.Length > 0) combined.AppendLine("\n---");
                combined.AppendLine($"[Source: {urlsToTry[i]}]");
                combined.Append(text);
            }
            else
            {
                urlResults.Add(new UrlScrapeResult { Url = urlsToTry[i], Success = false, Error = error });
                primaryError ??= error;
            }
        }

        var pageText = combined.ToString().Trim();
        if (string.IsNullOrWhiteSpace(pageText))
            return (new CorpScrapeDTO
            {
                CorpName   = corpName,
                StateName  = stateName,
                SourceUrl  = urlsToTry.FirstOrDefault() ?? "",
                Success    = false,
                Error      = primaryError ?? "All pages returned empty content",
                UrlResults = urlResults
            }, false);

        if (pageText.Length > 20_000) pageText = pageText[..20_000];

        var officers = ExtractOfficersFromKeyBlock(pageText);
        if (officers.Count == 0)
            officers = ExtractOfficersFromWikipedia(pageText);

        // Keep only the first occurrence per designation — prevents duplicates when
        // two sources disagree on the same role name
        officers = officers
            .GroupBy(o => o.Designation.Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(g => g.First())
            .ToList();

        return (new CorpScrapeDTO
        {
            CorpName   = corpName,
            StateName  = stateName,
            SourceUrl  = firstSuccessUrl ?? urlsToTry.FirstOrDefault() ?? "",
            PageText   = pageText,
            Success    = true,
            UrlResults = urlResults,
            Officers   = officers
        }, true);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static async Task<(string? text, string? error)> FetchPageAsync(
        HttpClient client, string url, CancellationToken ct, bool silentOnTimeout = false)
    {
        try
        {
            var response = await client.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode)
                return (null, silentOnTimeout ? null : $"HTTP {(int)response.StatusCode} from {url}");

            var html = await response.Content.ReadAsStringAsync(ct);
            var text = ExtractText(html);

            if (!string.IsNullOrWhiteSpace(text) && url.Contains("wikipedia.org"))
                text = PrependWikipediaKeyInfo(text);
            else if (!string.IsNullOrWhiteSpace(text))
                text = PrependTnurbantreeKeyOfficers(text);

            return string.IsNullOrWhiteSpace(text)
                ? (null, silentOnTimeout ? null : $"Empty content from {url}")
                : (text, null);
        }
        catch (OperationCanceledException)
        {
            return (null, silentOnTimeout ? null : $"Timeout: {url}");
        }
        catch (Exception ex)
        {
            return (null, silentOnTimeout ? null : ex.Message);
        }
    }

    private static string PrependTnurbantreeKeyOfficers(string text)
    {
        var officerLines = new List<string>();
        foreach (var line in text.Split('\n'))
        {
            var parts = line.Split(" | ");
            string namePart, rolePart;

            // Format 1: S.No | Name | Designation  (tnurbantree style)
            if (parts.Length >= 3 && int.TryParse(parts[0].Trim(), out _))
            {
                namePart = parts[1].Trim();
                rolePart = parts[2].Trim();
            }
            // Format 2: Name | Designation  (official corp sites with no serial column)
            else if (parts.Length >= 2)
            {
                namePart = parts[0].Trim();
                rolePart = parts[1].Trim();
                var lowerRole = rolePart.ToLower();
                if (!_officerRoleKeywords.Any(k => lowerRole.Contains(k))) continue;
            }
            else continue;

            if (string.IsNullOrWhiteSpace(namePart) || namePart.Length > 80) continue;
            if (string.IsNullOrWhiteSpace(rolePart) || rolePart.Length > 80) continue;

            officerLines.Add($"{rolePart}: {namePart}");
        }

        if (officerLines.Count == 0) return text;

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("KEY OFFICERS (from official website):");
        foreach (var ol in officerLines) sb.AppendLine(ol);
        sb.AppendLine();
        sb.Append(text);
        return sb.ToString();
    }

    private static string PrependWikipediaKeyInfo(string text)
    {
        var keyLines = new List<string>();
        foreach (var line in text.Split('\n'))
        {
            var idx = line.IndexOf(" | ", StringComparison.Ordinal);
            if (idx <= 0) continue;
            var role  = line[..idx].Trim();
            var value = line[(idx + 3)..].Trim();
            if (string.IsNullOrWhiteSpace(value)) continue;
            if (value.StartsWith("---"))          continue;
            if (value.Length > 100)               continue;
            if (value.Contains(" | "))            continue;
            keyLines.Add($"{role}: {value}");
        }

        var sb = new System.Text.StringBuilder();
        if (keyLines.Count > 0)
        {
            sb.AppendLine("KEY INFORMATION (extracted from infobox):");
            foreach (var kl in keyLines.Take(30)) sb.AppendLine(kl);
            sb.AppendLine();
        }

        var articleStart = text.IndexOf("Jump to content", StringComparison.OrdinalIgnoreCase);
        var body = articleStart >= 0 ? text[articleStart..] : text;
        sb.Append(body.Length > 3_000 ? body[..3_000] : body);
        return sb.ToString();
    }

    private static string BuildSlug(string corpName)
    {
        var s = corpName.ToLower();
        s = Regex.Replace(s,
            @"\b(city|municipal|corporation|municipality|town|panchayat|nagar|parishad|urban|council|greater)\b",
            " ");
        s = Regex.Replace(s, @"[^a-z\s]", " ");
        s = Regex.Replace(s, @"\s+", " ").Trim();
        return s.Replace(" ", "-").Trim('-');
    }

    private static string Normalize(string s) =>
        Regex.Replace((s ?? "").ToLower(), @"[^a-z]", "");

    private static readonly string[] _noiseElements =
        ["script", "style", "nav", "footer", "head", "header", "aside",
         "form", "noscript", "iframe", "button", "input", "select", "textarea"];

    private static string ExtractText(string html)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        foreach (var node in doc.DocumentNode
            .Descendants()
            .Where(n => _noiseElements.Contains(n.Name))
            .ToList())
            node.Remove();

        var sb = new System.Text.StringBuilder();

        var tables = doc.DocumentNode.SelectNodes("//table")?.ToList() ?? new List<HtmlNode>();
        foreach (var table in tables)
        {
            foreach (var row in table.SelectNodes(".//tr") ?? Enumerable.Empty<HtmlNode>())
            {
                var cells = row.SelectNodes(".//td|.//th");
                if (cells == null) continue;
                var rowText = string.Join(" | ", cells.Select(c =>
                    Regex.Replace(HtmlEntity.DeEntitize(c.InnerText).Trim(), @"\s+", " ").Trim()));
                if (!string.IsNullOrWhiteSpace(rowText)) sb.AppendLine(rowText);
            }
            sb.AppendLine();
            table.Remove();
        }

        var bodyText = HtmlEntity.DeEntitize(doc.DocumentNode.InnerText);
        bodyText = Regex.Replace(bodyText, @"\s+", " ").Trim();
        sb.Append(bodyText);
        return sb.ToString().Trim();
    }

    private static List<OfficerRecord> ExtractOfficersFromKeyBlock(string pageText)
    {
        var officers = new List<OfficerRecord>();
        bool inBlock = false;
        foreach (var line in pageText.Split('\n'))
        {
            var trimmed = line.Trim();
            if (trimmed.StartsWith("KEY OFFICERS (from official website)", StringComparison.OrdinalIgnoreCase))
            {
                inBlock = true;
                continue;
            }
            if (string.IsNullOrWhiteSpace(trimmed)) { inBlock = false; continue; }
            if (!inBlock) continue;

            var colonIdx = trimmed.IndexOf(':');
            if (colonIdx <= 0) continue;

            var designation = trimmed[..colonIdx].Trim();
            var name        = trimmed[(colonIdx + 1)..].Trim();
            if (!string.IsNullOrWhiteSpace(designation) && !string.IsNullOrWhiteSpace(name))
                officers.Add(new OfficerRecord { Name = name, Designation = designation });
        }
        return officers;
    }

    private static readonly HashSet<string> _officerRoleKeywords = new(StringComparer.OrdinalIgnoreCase)
    {
        "commissioner", "mayor", "chairman", "engineer", "officer",
        "administrator", "president", "director", "secretary", "councillor",
        "assistant", "office", "superintendent", "health", "revenue",
        "inspector", "supervisor", "manager", "auditor", "planner"
    };

    private static List<OfficerRecord> ExtractOfficersFromWikipedia(string pageText)
    {
        var officers = new List<OfficerRecord>();
        bool inBlock = false;
        foreach (var line in pageText.Split('\n'))
        {
            var trimmed = line.Trim();
            if (trimmed.StartsWith("KEY INFORMATION (extracted from infobox)", StringComparison.OrdinalIgnoreCase))
            {
                inBlock = true;
                continue;
            }
            if (!inBlock) continue;
            if (string.IsNullOrWhiteSpace(trimmed)) break;

            var colonIdx = trimmed.IndexOf(':');
            if (colonIdx <= 0) continue;

            var role  = trimmed[..colonIdx].Trim();
            var value = trimmed[(colonIdx + 1)..].Trim();

            if (string.IsNullOrWhiteSpace(value)) continue;
            if (value.Length > 80)               continue;
            if (value.StartsWith("---"))          continue;
            if (value.Contains(" | "))            continue;

            var lowerRole = role.ToLower();
            if (!_officerRoleKeywords.Any(k => lowerRole.Contains(k))) continue;

            officers.Add(new OfficerRecord { Name = value, Designation = role });
        }
        return officers;
    }
}
