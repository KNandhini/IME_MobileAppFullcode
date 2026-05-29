using HtmlAgilityPack;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using System.Text.RegularExpressions;

namespace IME.Infrastructure.Services;

public class WebScraperService : IWebScraperService
{
    private readonly IHttpClientFactory _httpClientFactory;

    // State-specific URL builders: state key (normalized) → function(corpSlug) → URL
    private static readonly Dictionary<string, Func<string, string>> StateUrlBuilders =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["tamilnadu"]          = slug => $"https://www.tnurbantree.tn.gov.in/{slug}/",
            ["andhrapradesh"]      = slug => $"https://cdma.ap.gov.in/municipality-profile/?name={slug}",
            ["telangana"]          = slug => $"https://cdma.ap.gov.in/municipality-profile/?name={slug}",
            ["karnataka"]          = slug => slug.Contains("bengaluru") || slug.Contains("bangalore")
                                            ? "https://bbmp.gov.in/en/about-bbmp"
                                            : $"https://www.karnataka.gov.in/page/Municipal+Bodies/{slug}",
            ["kerala"]             = slug => $"https://lsgkerala.gov.in/en/local-governments/municipalities/{slug}",
            ["maharashtra"]        = slug => slug.Contains("mumbai")
                                            ? "https://portal.mcgm.gov.in/irj/portal/anonymous"
                                            : $"https://www.{slug}mahanagar.gov.in/",
            ["gujarat"]            = slug => slug.Contains("ahmedabad")
                                            ? "https://ahmedabadcity.gov.in/portal/jsp/Static_page/amc_overview.jsp"
                                            : $"https://www.{slug}mc.gov.in/",
            ["rajasthan"]          = slug => $"https://rajurban.rajasthan.gov.in/content/raj/udh/rajurban/en/{slug}.html",
            ["madhyapradesh"]      = slug => $"https://mpurban.gov.in/site/ulb-details/{slug}",
            ["uttarpradesh"]       = slug => slug.Contains("lucknow")
                                            ? "https://lmc.up.nic.in/"
                                            : $"https://nagar-nigam.nic.in/en-us/{slug}",
            ["westbengal"]         = slug => slug.Contains("kolkata")
                                            ? "https://www.kmcgov.in/KMCPortal/jsp/KMCPortalHome.jsp"
                                            : $"https://www.wbdma.gov.in/munic/{slug}",
            ["delhi"]              = _ => "https://mcdonline.nic.in/",
            ["punjab"]             = slug => $"https://puda.gov.in/uls/{slug}",
            ["haryana"]            = slug => $"https://ulbharyana.gov.in/ulb/{slug}",
            ["odisha"]             = slug => $"https://urbanodisha.gov.in/ulb/{slug}",
            ["chhattisgarh"]       = slug => $"https://cgurban.gov.in/ulb/{slug}",
            ["jharkhand"]          = slug => $"https://jkusdma.jharkhand.gov.in/ulb/{slug}",
            ["assam"]              = slug => $"https://asudc.nic.in/ulb/{slug}",
            ["himachalpradesh"]    = slug => $"https://himachal.nic.in/en-IN/municipal-corporation/{slug}.html",
            ["uttarakhand"]        = slug => $"https://udd.uk.gov.in/pages/display/59-list-of-ulbs",
            ["goa"]                = _ => "https://www.mapusa-municipality.com/",
            ["manipur"]            = _ => "https://imphalwestdc.nic.in/",
            ["tripura"]            = _ => "https://agartala.gov.in/",
            ["meghalaya"]          = _ => "https://shillongmc.gov.in/",
        };

    public WebScraperService(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public async Task<CorpScrapeDTO> ScrapeCorpPageAsync(string corpName, string stateName)
    {
        var slug     = BuildSlug(corpName);
        var stateKey = Normalize(stateName);
        var baseUrl  = BuildUrl(stateKey, slug);
        var client   = _httpClientFactory.CreateClient("scraper");

        // For Tamil Nadu, also scrape the General Administration sub-page
        // which contains Commissioner, City Engineer, Health Officer names
        var urlsToTry = stateKey == "tamilnadu"
            ? new[]
              {
                  $"https://www.tnurbantree.tn.gov.in/{slug}/general-administration/",
                  $"https://www.tnurbantree.tn.gov.in/{slug}/",
              }
            : new[] { baseUrl };

        var combined = new System.Text.StringBuilder();
        string? primaryError = null;

        foreach (var url in urlsToTry)
        {
            try
            {
                var response = await client.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    primaryError ??= $"HTTP {(int)response.StatusCode} from {url}";
                    continue;
                }

                var html = await response.Content.ReadAsStringAsync();
                var text = ExtractText(html);
                if (!string.IsNullOrWhiteSpace(text))
                {
                    if (combined.Length > 0) combined.AppendLine("\n---");
                    combined.AppendLine($"[Source: {url}]");
                    combined.Append(text);
                }
            }
            catch (Exception ex)
            {
                primaryError ??= ex.Message;
            }
        }

        var pageText = combined.ToString().Trim();
        if (string.IsNullOrWhiteSpace(pageText))
            return Fail(corpName, stateName, baseUrl, primaryError ?? "All pages returned empty content");

        // Cap total at 12 000 chars
        if (pageText.Length > 12_000) pageText = pageText[..12_000];

        return new CorpScrapeDTO
        {
            CorpName  = corpName,
            StateName = stateName,
            SourceUrl = baseUrl,
            PageText  = pageText,
            Success   = true
        };
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static string BuildSlug(string corpName)
    {
        var s = corpName.ToLower();
        s = Regex.Replace(s,
            @"\b(city|municipal|corporation|municipality|town|panchayat|nagar|parishad|urban|council|greater)\b",
            " ");
        s = Regex.Replace(s, @"[^a-z\s]", " ");
        s = Regex.Replace(s, @"\s+", " ").Trim();
        // e.g. "erode" or "navi mumbai" → "navi-mumbai"
        return s.Replace(" ", "-").Trim('-');
    }

    private static string Normalize(string s) =>
        Regex.Replace((s ?? "").ToLower(), @"[^a-z]", "");

    private static string BuildUrl(string stateKey, string slug)
    {
        if (StateUrlBuilders.TryGetValue(stateKey, out var builder))
            return builder(slug);

        // Generic fallback: Tamil Nadu tree (works for TN corps not explicitly mapped)
        return $"https://www.tnurbantree.tn.gov.in/{slug}/";
    }

    private static string ExtractText(string html)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        // Remove non-content nodes
        foreach (var node in doc.DocumentNode
            .Descendants()
            .Where(n => n.Name is "script" or "style" or "nav" or "footer" or "head")
            .ToList())
            node.Remove();

        // Extract table data as structured text
        var sb = new System.Text.StringBuilder();
        foreach (var table in doc.DocumentNode.SelectNodes("//table") ?? Enumerable.Empty<HtmlNode>())
        {
            foreach (var row in table.SelectNodes(".//tr") ?? Enumerable.Empty<HtmlNode>())
            {
                var cells = row.SelectNodes(".//td|.//th");
                if (cells == null) continue;
                sb.AppendLine(string.Join(" | ", cells.Select(c => {
                    var t = c.InnerText.Trim();
                    t = Regex.Replace(t, @"&#?\w+;", " ");
                    return Regex.Replace(t, @"\s+", " ").Trim();
                })));
            }
            sb.AppendLine();
        }

        // Append remaining body text
        var bodyText = doc.DocumentNode.InnerText;
        bodyText = Regex.Replace(bodyText, @"&#?\w+;", " ");   // named + numeric entities
        bodyText = Regex.Replace(bodyText, @"\s+", " ").Trim();
        sb.Append(bodyText);

        return sb.ToString().Trim();
    }

    private static CorpScrapeDTO Fail(string corp, string state, string url, string error) =>
        new() { CorpName = corp, StateName = state, SourceUrl = url, Success = false, Error = error };
}
