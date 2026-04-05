namespace IME.Core.DTOs;

public class MemberProfileDTO
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
    public string? DesignationName { get; set; }
    public string? ProfilePhotoPath { get; set; }
    public string MembershipStatus { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
}

public class UpdateMemberProfileDTO
{
    public string FullName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string ContactNumber { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public int Age { get; set; }
    public string Place { get; set; } = string.Empty;
    public int DesignationId { get; set; }
    public string? ProfilePhotoPath { get; set; }
}

public class PaymentHistoryDTO
{
    public int PaymentId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? PaymentMode { get; set; }
    public string? TransactionReference { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
}
