namespace IME.Core.DTOs;

public class OfficerRecord
{
    public string Name { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
}

public class UrlScrapeResult
{
    public string Url { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? PageText { get; set; }
    public string? Error { get; set; }
}

public class CorpScrapeDTO
{
    public string CorpName { get; set; } = string.Empty;
    public string StateName { get; set; } = string.Empty;
    public string SourceUrl { get; set; } = string.Empty;
    // Combined text from all successful URLs — sent to OpenAI
    public string? PageText { get; set; }
    public bool Success { get; set; }
    public string? Error { get; set; }
    // Individual result per URL — lets the frontend bind each URL's data separately
    public List<UrlScrapeResult> UrlResults { get; set; } = new();
    // Structured officers extracted from tnurbantree table (Name + Designation only)
    public List<OfficerRecord> Officers { get; set; } = new();
}

public class DistrictDTO
{
    public int DistrictId { get; set; }
    public string DistrictName { get; set; } = string.Empty;
    public int StateId { get; set; }
}

public class AiDetailRequest
{
    public string SystemPrompt { get; set; } = string.Empty;
    public string UserPrompt   { get; set; } = string.Empty;
}

public class LocalBodyDTO
{
    public int LocalBodyId { get; set; }
    public string LocalBodyName { get; set; } = string.Empty;
    public string LocalBodyType { get; set; } = string.Empty;  // Municipal Corporation | Municipality | Town Panchayat | Village Panchayat
    public int? DistrictId { get; set; }
    public string DistrictName { get; set; } = string.Empty;
    public string StateName { get; set; } = string.Empty;
    public string? Pincode { get; set; }
    public string? Address { get; set; }
    public string? ContactNumber { get; set; }
    public string? Email { get; set; }
    public string? OfficialWebsiteUrl { get; set; }
    public string? TnurbantreeUrl { get; set; }
    public string? ChairpersonName { get; set; }     // Mayor / Chairman / President
    public string? CommissionerName { get; set; }    // Commissioner / Executive Officer
    public int? WardCount { get; set; }
    public string? Population { get; set; }
    public int? EstablishedYear { get; set; }
    public string? AboutDescription { get; set; }
    public bool IsActive { get; set; }
}

public class MunicipalCorpDTO
{
    public int CorpId { get; set; }
    public string CorpName { get; set; } = string.Empty;
    public string? CorpCode { get; set; }
    public int DistrictId { get; set; }
    public string DistrictName { get; set; } = string.Empty;
    public int StateId { get; set; }
    public string StateName { get; set; } = string.Empty;
    public int CountryId { get; set; }
    public string CountryName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? ContactNumber { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public int? EstablishedYear { get; set; }
    public int? WardCount { get; set; }
    public string? MayorName { get; set; }
    public string? Population { get; set; }
    public string? Area { get; set; }
    public bool IsActive { get; set; }
}
