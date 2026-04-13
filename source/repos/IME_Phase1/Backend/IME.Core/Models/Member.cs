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
    public DateTime DateOfBirth { get; set; }
    public string? Place { get; set; }
    public int? DesignationId { get; set; }
    public string? ProfilePhotoPath { get; set; }
    public byte[]? ProfilePhoto { get; set; }
    public string MembershipStatus { get; set; } = "Pending";
    public string? Reason { get; set; }   // optional (only for Reject)
    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
}
