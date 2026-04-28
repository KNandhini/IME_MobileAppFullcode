namespace IME.Core.DTOs;

public class DistrictDTO
{
    public int DistrictId { get; set; }
    public string DistrictName { get; set; } = string.Empty;
    public int StateId { get; set; }
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
