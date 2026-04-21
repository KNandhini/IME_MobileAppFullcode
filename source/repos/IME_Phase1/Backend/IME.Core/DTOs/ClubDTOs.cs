namespace IME.Core.DTOs;

public class ClubDTO
{
    public int ClubId { get; set; }
    public string ClubName { get; set; } = string.Empty;
    public string? ClubCode { get; set; }
    public string? Description { get; set; }

    public int? CountryId { get; set; }
    public string? CountryName { get; set; }
    public int? StateId { get; set; }
    public string? StateName { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? Pincode { get; set; }

    public string? ContactPersonName { get; set; }
    public string? ContactNumber { get; set; }
    public string? AlternateNumber { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }

    public string? ClubType { get; set; }
    public DateTime? EstablishedDate { get; set; }
    public int TotalMembers { get; set; }
    public string? AdminMemberIds { get; set; }
    public string? AdminMemberNames { get; set; }
    public string? RegistrationNumber { get; set; }
    public string? LogoPath { get; set; }

    public bool IsActive { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDate { get; set; }
}

public class CreateClubDTO
{
    public string ClubName { get; set; } = string.Empty;
    public string? ClubCode { get; set; }
    public string? Description { get; set; }

    public int? CountryId { get; set; }
    public int? StateId { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? Pincode { get; set; }

    public string? ContactPersonName { get; set; }
    public string? ContactNumber { get; set; }
    public string? AlternateNumber { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }

    public string? ClubType { get; set; }
    public DateTime? EstablishedDate { get; set; }
    public int TotalMembers { get; set; }
    public string? AdminMemberIds { get; set; }
    public string? AdminMemberNames { get; set; }
    public string? RegistrationNumber { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateClubDTO : CreateClubDTO { }

public class CountryDTO
{
    public int CountryId { get; set; }
    public string CountryName { get; set; } = string.Empty;
}

public class StateDTO
{
    public int StateId { get; set; }
    public string StateName { get; set; } = string.Empty;
    public int CountryId { get; set; }
}
