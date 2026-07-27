// IME.Core/DTOs/PaymentReportRowDTO.cs
namespace IME.Core.DTOs;

public class PaymentReportRowDTO
{
    public int SNo { get; set; }
    public int MemberId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? JoiningDate { get; set; }
    public decimal PaymentAmount { get; set; }
    public string PaymentId { get; set; }
    public DateTime PaymentDate { get; set; }
    public string ClubName { get; set; } = string.Empty;
}


public class MemberMembershipPaymentRowDTO
{
    public int SNo { get; set; }
    public string ClubName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? PaymentId { get; set; }
}

public class MemberFundraisePaymentRowDTO
{
    public int SNo { get; set; }
    public string FundName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? PaymentId { get; set; }
}