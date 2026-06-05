using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace IME.Infrastructure.Services;

/// <summary>
/// Reads LocalBodies_URLs.csv at startup and builds an in-memory URL map.
/// Any local body found in the CSV is served from the file — no AI call needed.
/// Add new rows to the CSV and restart the API to pick them up.
/// </summary>
public class CsvUrlRegistryService
{
    // slug (e.g. "sankagiri") → ordered URL list to try during scraping
    private readonly Dictionary<string, string[]> _map;
    private readonly ILogger<CsvUrlRegistryService> _log;
    private readonly string _csvPath;
    private readonly object _fileLock = new();

    public CsvUrlRegistryService(
        IConfiguration config,
        ILogger<CsvUrlRegistryService> log)
    {
        _log = log;
        var relative = config["LocalBodiesUrlFile"] ?? "Data/LocalBodies_URLs.csv";
        _csvPath = Path.IsPathRooted(relative)
            ? relative
            : Path.Combine(Directory.GetCurrentDirectory(), relative);

        _map = LoadFromCsv(_csvPath);
        _log.LogInformation("CsvUrlRegistry: loaded {Count} entries from {Path}", _map.Count, _csvPath);
    }

    /// <summary>
    /// Returns the URL list for the given corp name, or an empty array if not in the file.
    /// </summary>
    public string[] GetUrls(string corpName)
    {
        var slug = BuildSlug(corpName);
        return _map.TryGetValue(slug, out var urls) ? urls : [];
    }

    /// <summary>
    /// Called after AI resolves URLs for a corp that was NOT in the CSV.
    /// Classifies the AI URLs, updates the in-memory map, and appends a new row
    /// to the CSV file so the next request is served from the file — no AI needed.
    /// </summary>
    public void SaveUrls(string corpName, string districtName, string[] aiUrls)
    {
        var slug = BuildSlug(corpName);

        // Don't overwrite — entry may have been added by another request
        if (_map.ContainsKey(slug)) return;

        // ── Classify URLs from AI ──────────────────────────────────────────────
        // Official site: not tnurbantree, not wikipedia
        var official = aiUrls.FirstOrDefault(u =>
            IsUrl(u) &&
            !u.Contains("tnurbantree",  StringComparison.OrdinalIgnoreCase) &&
            !u.Contains("wikipedia.org", StringComparison.OrdinalIgnoreCase)) ?? "";

        // TN Urban Tree base URL (strip /general-administration/ if present)
        var tnBase = aiUrls
            .Where(u => u.Contains("tnurbantree", StringComparison.OrdinalIgnoreCase))
            .Select(u =>
            {
                var clean = Regex.Replace(u, @"/general-administration/?$", "", RegexOptions.IgnoreCase);
                return clean.TrimEnd('/') + "/";
            })
            .FirstOrDefault() ?? "";

        var wiki = aiUrls.FirstOrDefault(u =>
            u.Contains("wikipedia.org", StringComparison.OrdinalIgnoreCase)) ?? "";

        // ── Build in-memory URL list ───────────────────────────────────────────
        var urlList = new List<string>();
        if (IsUrl(official)) urlList.Add(official);
        if (IsUrl(tnBase))
        {
            urlList.Add(tnBase);
            urlList.Add(tnBase.TrimEnd('/') + "/general-administration/");
        }
        if (IsUrl(wiki)) urlList.Add(wiki);

        if (urlList.Count == 0) return;

        var deduped = urlList.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        _map[slug] = deduped;   // update in-memory map first

        // ── Append row to CSV file ─────────────────────────────────────────────
        lock (_fileLock)
        {
            try
            {
                // Format: Name,District,State,OfficialWebsite,TnurbantreeUrl,WikipediaUrl
                var line = $"\n{corpName},{districtName},Tamil Nadu,{official},{tnBase},{wiki}";
                File.AppendAllText(_csvPath, line, Encoding.UTF8);
                _log.LogInformation(
                    "CsvUrlRegistry: auto-saved AI URLs for '{CorpName}' → {CsvPath}", corpName, _csvPath);
            }
            catch (Exception ex)
            {
                _log.LogWarning(ex,
                    "CsvUrlRegistry: could not append to CSV for '{CorpName}' — in-memory map updated only", corpName);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────

    private Dictionary<string, string[]> LoadFromCsv(string path)
    {
        var map = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);

        if (!File.Exists(path))
        {
            _log.LogWarning("CsvUrlRegistry: file not found at {Path}. No URLs loaded from CSV.", path);
            return map;
        }

        string[] lines;
        try { lines = File.ReadAllLines(path, Encoding.UTF8); }
        catch (Exception ex)
        {
            _log.LogError(ex, "CsvUrlRegistry: failed to read {Path}", path);
            return map;
        }

        if (lines.Length < 2) return map;

        // ── Parse header row ─────────────────────────────────────────────────
        var headers = SplitLine(lines[0]);
        int nameIdx     = IndexOf(headers, "Name");
        int officialIdx = IndexOf(headers, "OfficialWebsite");
        int tnIdx       = IndexOf(headers, "TnurbantreeUrl");
        int wikiIdx     = IndexOf(headers, "WikipediaUrl");

        if (nameIdx < 0)
        {
            _log.LogWarning("CsvUrlRegistry: 'Name' column not found in header. Check {Path}", path);
            return map;
        }

        // ── Parse data rows ───────────────────────────────────────────────────
        int loaded = 0;
        for (int i = 1; i < lines.Length; i++)
        {
            var line = lines[i];
            if (string.IsNullOrWhiteSpace(line)) continue;

            // Skip comment lines
            var trimmed = line.TrimStart();
            if (trimmed.StartsWith("#")) continue;

            var cols = SplitLine(line);
            if (nameIdx >= cols.Length) continue;

            var name = cols[nameIdx].Trim();
            if (string.IsNullOrWhiteSpace(name)) continue;

            var slug = BuildSlug(name);
            var urls = new List<string>();

            // 1. Official website (.gov.in) — highest priority
            var official = Col(cols, officialIdx);
            if (IsUrl(official)) urls.Add(official!);

            // 2. TN Urban Tree main page + automatic /general-administration/ sub-page
            var tn = Col(cols, tnIdx);
            if (IsUrl(tn))
            {
                var tnBase = tn!.TrimEnd('/') + "/";
                urls.Add(tnBase);
                urls.Add(tnBase.TrimEnd('/') + "/general-administration/");
            }

            // 3. Wikipedia — reliable fallback
            var wiki = Col(cols, wikiIdx);
            if (IsUrl(wiki)) urls.Add(wiki!);

            if (urls.Count == 0) continue;

            var deduped = urls
                .Where(IsUrl)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            map[slug] = deduped;
            loaded++;
        }

        _log.LogInformation("CsvUrlRegistry: parsed {Loaded} valid rows from {Total} data lines", loaded, lines.Length - 1);
        return map;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static string? Col(string[] cols, int idx) =>
        idx >= 0 && idx < cols.Length ? cols[idx].Trim() : null;

    private static bool IsUrl(string? s) =>
        !string.IsNullOrWhiteSpace(s) &&
        s.StartsWith("http", StringComparison.OrdinalIgnoreCase);

    private static int IndexOf(string[] headers, string name) =>
        Array.FindIndex(headers, h => h.Trim().Equals(name, StringComparison.OrdinalIgnoreCase));

    /// <summary>
    /// Splits one CSV line, honouring double-quoted fields.
    /// </summary>
    private static string[] SplitLine(string line)
    {
        var result  = new List<string>();
        var current = new StringBuilder();
        bool inQuote = false;

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                // Escaped quote inside a quoted field: "" → "
                if (inQuote && i + 1 < line.Length && line[i + 1] == '"')
                { current.Append('"'); i++; }
                else inQuote = !inQuote;
            }
            else if (c == ',' && !inQuote)
            { result.Add(current.ToString()); current.Clear(); }
            else current.Append(c);
        }
        result.Add(current.ToString());
        return result.ToArray();
    }

    /// <summary>
    /// Converts a corp name to the slug key used in the map.
    /// "Bhavani Municipality" → "bhavani"
    /// "Erode Municipal Corporation" → "erode"
    /// Must stay in sync with WebScraperService.BuildSlug.
    /// </summary>
    public static string BuildSlug(string corpName)
    {
        var s = corpName.ToLowerInvariant();
        s = Regex.Replace(s,
            @"\b(city|municipal|corporation|municipality|town|panchayat|nagar|parishad|urban|council|greater)\b",
            " ");
        s = Regex.Replace(s, @"[^a-z\s]", " ");
        s = Regex.Replace(s, @"\s+", " ").Trim();
        return s.Replace(" ", "-").Trim('-');
    }
}
