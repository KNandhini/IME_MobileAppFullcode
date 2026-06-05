using System.Text.RegularExpressions;

namespace IME.Infrastructure.Services;

/// <summary>
/// Static registry of known municipal-body URLs.
/// Source: ErodeDistrict_MunicipalBodies.csv (project root).
/// Edit the CSV first, then mirror changes here.
/// AI is only called when the corp name is NOT found in this registry,
/// OR when every URL in this registry returns an error.
/// </summary>
internal static class MunicipalUrlRegistry
{
    // ── URL map ───────────────────────────────────────────────────────────────
    // Key  : slug produced by BuildSlug(corpName)  e.g. "bhavani", "gobichettipalayam"
    // Value: ordered URLs — most authoritative first; Wikipedia last as guaranteed fallback
    private static readonly Dictionary<string, string[]> _urls =
        new(StringComparer.OrdinalIgnoreCase)
        {
            // ── Erode District ───────────────────────────────────────────────
            // Source: ErodeDistrict_MunicipalBodies.csv
            ["erode"] = [
                "https://www.erodecorporation.tn.gov.in/",
                "http://www.tnurbantree.tn.gov.in/erode/",
                "http://www.tnurbantree.tn.gov.in/erode/general-administration/",
                "https://en.wikipedia.org/wiki/Erode_Municipal_Corporation",
            ],
            ["bhavani"] = [
                "http://www.tnurbantree.tn.gov.in/bhavani/",
                "http://www.tnurbantree.tn.gov.in/bhavani/general-administration/",
                "https://en.wikipedia.org/wiki/Bhavani,_Tamil_Nadu",
            ],
            ["gobichettipalayam"] = [
                "http://www.tnurbantree.tn.gov.in/gobichettipalayam/",
                "http://www.tnurbantree.tn.gov.in/gobichettipalayam/general-administration/",
                "https://en.wikipedia.org/wiki/Gobichettipalayam",
            ],
            ["gobi"] = [
                "http://www.tnurbantree.tn.gov.in/gobichettipalayam/",
                "http://www.tnurbantree.tn.gov.in/gobichettipalayam/general-administration/",
                "https://en.wikipedia.org/wiki/Gobichettipalayam",
            ],
            ["sathyamangalam"] = [
                "http://www.tnurbantree.tn.gov.in/sathyamangalam/",
                "http://www.tnurbantree.tn.gov.in/sathyamangalam/general-administration/",
                "https://en.wikipedia.org/wiki/Sathyamangalam",
            ],
            ["perundurai"] = [
                "http://www.tnurbantree.tn.gov.in/perundurai/",
                "http://www.tnurbantree.tn.gov.in/perundurai/general-administration/",
                "https://en.wikipedia.org/wiki/Perundurai",
            ],
            ["anthiyur"] = [
                "http://www.tnurbantree.tn.gov.in/anthiyur/",
                "http://www.tnurbantree.tn.gov.in/anthiyur/general-administration/",
                "https://en.wikipedia.org/wiki/Anthiyur",
            ],
            ["nambiyur"] = [
                "http://www.tnurbantree.tn.gov.in/nambiyur/",
                "http://www.tnurbantree.tn.gov.in/nambiyur/general-administration/",
            ],
            ["kodumudi"] = [
                "http://www.tnurbantree.tn.gov.in/kodumudi/",
                "http://www.tnurbantree.tn.gov.in/kodumudi/general-administration/",
                "https://en.wikipedia.org/wiki/Kodumudi",
            ],
            ["kavindapadi"] = [
                "http://www.tnurbantree.tn.gov.in/kavindapadi/",
                "http://www.tnurbantree.tn.gov.in/kavindapadi/general-administration/",
            ],
            ["thindal"] = [
                "http://www.tnurbantree.tn.gov.in/thindal/",
                "http://www.tnurbantree.tn.gov.in/thindal/general-administration/",
            ],
            ["veerappanchatram"] = [
                "http://www.tnurbantree.tn.gov.in/veerappanchatram/",
                "http://www.tnurbantree.tn.gov.in/veerappanchatram/general-administration/",
            ],
            ["sivagiri"] = [
                "http://www.tnurbantree.tn.gov.in/sivagiri/",
                "http://www.tnurbantree.tn.gov.in/sivagiri/general-administration/",
            ],
            ["modakkurichi"] = [
                "http://www.tnurbantree.tn.gov.in/modakkurichi/",
                "http://www.tnurbantree.tn.gov.in/modakkurichi/general-administration/",
                "https://en.wikipedia.org/wiki/Modakkurichi",
            ],
            ["vellakoil"] = [
                "http://www.tnurbantree.tn.gov.in/vellakoil/",
                "http://www.tnurbantree.tn.gov.in/vellakoil/general-administration/",
            ],
            ["thalavadi"] = [
                "http://www.tnurbantree.tn.gov.in/thalavadi/",
                "http://www.tnurbantree.tn.gov.in/thalavadi/general-administration/",
            ],
            ["bhavanisagar"] = [
                "http://www.tnurbantree.tn.gov.in/bhavanisagar/",
                "http://www.tnurbantree.tn.gov.in/bhavanisagar/general-administration/",
            ],

            // ── Salem District ───────────────────────────────────────────────
            ["salem"] = [
                "https://www.salemcorporation.gov.in/",
                "https://www.salemcorporation.gov.in/office-head-quarters.php",
                "http://www.tnurbantree.tn.gov.in/salem/general-administration/",
                "https://en.wikipedia.org/wiki/Salem_City_Municipal_Corporation",
            ],
            ["sankari"] = [
                "http://www.tnurbantree.tn.gov.in/sankari/",
                "http://www.tnurbantree.tn.gov.in/sankari/general-administration/",
                "https://en.wikipedia.org/wiki/Sankari",
            ],
            ["mettur"] = [
                "http://www.tnurbantree.tn.gov.in/mettur/",
                "http://www.tnurbantree.tn.gov.in/mettur/general-administration/",
                "https://en.wikipedia.org/wiki/Mettur",
            ],
            ["omalur"] = [
                "http://www.tnurbantree.tn.gov.in/omalur/",
                "http://www.tnurbantree.tn.gov.in/omalur/general-administration/",
                "https://en.wikipedia.org/wiki/Omalur",
            ],
            ["edappadi"] = [
                "http://www.tnurbantree.tn.gov.in/idappadi/",
                "http://www.tnurbantree.tn.gov.in/idappadi/general-administration/",
                "https://en.wikipedia.org/wiki/Edappadi",
            ],
            ["idappadi"] = [
                "http://www.tnurbantree.tn.gov.in/idappadi/",
                "http://www.tnurbantree.tn.gov.in/idappadi/general-administration/",
                "https://en.wikipedia.org/wiki/Edappadi",
            ],
            ["gangavalli"] = [
                "http://www.tnurbantree.tn.gov.in/gangavalli/",
                "http://www.tnurbantree.tn.gov.in/gangavalli/general-administration/",
            ],
            ["yercaud"] = [
                "http://www.tnurbantree.tn.gov.in/yercaud/",
                "http://www.tnurbantree.tn.gov.in/yercaud/general-administration/",
                "https://en.wikipedia.org/wiki/Yercaud",
            ],
            ["attur"] = [
                "http://www.tnurbantree.tn.gov.in/attur/",
                "http://www.tnurbantree.tn.gov.in/attur/general-administration/",
                "https://en.wikipedia.org/wiki/Attur",
            ],
            ["sankagiri"] = [
                "http://www.tnurbantree.tn.gov.in/sankagiri/",
                "http://www.tnurbantree.tn.gov.in/sankagiri/general-administration/",
                "https://en.wikipedia.org/wiki/Sankagiri",
            ],
            ["rasipuram"] = [
                "http://www.tnurbantree.tn.gov.in/rasipuram/",
                "http://www.tnurbantree.tn.gov.in/rasipuram/general-administration/",
                "https://en.wikipedia.org/wiki/Rasipuram",
            ],
            ["edappadi"] = [
                "http://www.tnurbantree.tn.gov.in/idappadi/",
                "http://www.tnurbantree.tn.gov.in/idappadi/general-administration/",
                "https://en.wikipedia.org/wiki/Edappadi",
            ],
            ["gangavalli"] = [
                "http://www.tnurbantree.tn.gov.in/gangavalli/",
                "http://www.tnurbantree.tn.gov.in/gangavalli/general-administration/",
            ],
            ["tiruchengode"] = [
                "http://www.tnurbantree.tn.gov.in/tiruchengode/",
                "http://www.tnurbantree.tn.gov.in/tiruchengode/general-administration/",
                "https://en.wikipedia.org/wiki/Tiruchengode",
            ],
            ["namakkal"] = [
                "http://www.tnurbantree.tn.gov.in/namakkal/",
                "http://www.tnurbantree.tn.gov.in/namakkal/general-administration/",
                "https://en.wikipedia.org/wiki/Namakkal",
            ],
            ["namakkal"] = [
                "http://www.tnurbantree.tn.gov.in/namakkal/",
                "http://www.tnurbantree.tn.gov.in/namakkal/general-administration/",
                "https://en.wikipedia.org/wiki/Namakkal",
            ],

            // ── Coimbatore District ──────────────────────────────────────────
            ["coimbatore"] = [
                "https://www.coimbatorecorporation.gov.in/",
                "http://www.tnurbantree.tn.gov.in/coimbatore/general-administration/",
                "https://en.wikipedia.org/wiki/Coimbatore_City_Municipal_Corporation",
            ],
            ["tirupur"] = [
                "https://www.tirupurcorporation.gov.in/",
                "http://www.tnurbantree.tn.gov.in/tirupur/general-administration/",
                "https://en.wikipedia.org/wiki/Tirupur",
            ],
            ["pollachi"] = [
                "http://www.tnurbantree.tn.gov.in/pollachi/",
                "http://www.tnurbantree.tn.gov.in/pollachi/general-administration/",
                "https://en.wikipedia.org/wiki/Pollachi",
            ],

            // ── Chennai / Major corporations ──────────────────────────────────
            ["chennai"] = [
                "https://www.chennaicorporation.gov.in/",
                "https://en.wikipedia.org/wiki/Greater_Chennai_Corporation",
            ],
            ["madurai"] = [
                "https://www.maduraicorporation.gov.in/",
                "http://www.tnurbantree.tn.gov.in/madurai/general-administration/",
                "https://en.wikipedia.org/wiki/Madurai_City_Municipal_Corporation",
            ],
            ["trichy"] = [
                "https://www.corporationoftrichy.in/",
                "http://www.tnurbantree.tn.gov.in/trichy/general-administration/",
                "https://en.wikipedia.org/wiki/Tiruchirappalli_City_Municipal_Corporation",
            ],
            ["tiruchirappalli"] = [
                "https://www.corporationoftrichy.in/",
                "http://www.tnurbantree.tn.gov.in/trichy/general-administration/",
                "https://en.wikipedia.org/wiki/Tiruchirappalli_City_Municipal_Corporation",
            ],
        };

    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Returns the registered URL list for the given corp-name slug,
    /// or an empty array if the corp is not yet in the registry.
    /// Add unknown corps to the CSV first, then add the entry here.
    /// </summary>
    public static string[] GetUrls(string slug) =>
        _urls.TryGetValue(slug, out var urls) ? urls : [];

    /// <summary>
    /// Same slug algorithm used by WebScraperService.BuildSlug.
    /// Strips type words (corporation, municipality, panchayat …) so that
    /// "Bhavani Municipality" and "Bhavani" both map to "bhavani".
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
