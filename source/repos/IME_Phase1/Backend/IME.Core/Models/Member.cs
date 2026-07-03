namespace IME.Core.Models;
public class Member
{
    public int MemberId { get; set; }
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? ContactNumber { get; set; }
    public string? Gender { get; set; }
    public int? Age { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Place { get; set; }
    public int? DesignationId { get; set; }
    public string? ProfilePhotoPath { get; set; }
   public byte[]? ProfilePhoto { get; set; }
    public string MembershipStatus { get; set; } = "Pending";
    public string? Reason { get; set; }   // optional (only for Reject)
    public DateTime? CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public int? CountryId { get; set; }
    public string? CountryName { get; set; }
    public int? StateId { get; set; }
    public string? StateName { get; set; }
    public string? ClubId { get; set; }
    public string? ClubName { get; set; }
    public DateTime? GraceExpiryDate { get; set; }  // NEW
    public string? ProfilePhotoBase64 { get; set; }

  
    public string? Occupation { get; set; }           // Employed / Self Employed / Unemployed
    public string? OccupationDetails { get; set; }    // free-text, only relevant when Employed/Self Employed
    public string? Qualification { get; set; }        // free-text educational qualification

    // NEW — 1 = Admin, 2 = Member. Defaults to 2 so the existing member
    // signup flow keeps working without sending this field at all.
    public int RoleId { get; set; } = 2;
}
public class MemberPhoto
{
    public int MemberId { get; set; }
    public string? ProfilePhotoPath { get; set; }
    public string? ProfilePhotoBase64 { get; set; }

}