using IME.Core.DTOs;
namespace IME.Core.Interfaces;
public interface IPaymentRepository
{
    // CHANGED: now scoped to a specific membership category (RoleId).
    // RoleId convention: 1 = Serving/Retired Engineers, 2 = Engineering Students, 3 = Organisations/Others
    Task<MembershipFeeDTO?> GetCurrentFeeAsync(int roleId);

    // NEW: returns the active fee for all 3 categories in one call.
    // Use this on MembershipBenefitsScreen so displayed prices come from the DB.
    Task<List<MembershipFeeDTO>> GetAllCurrentFeesAsync();

    Task<MembershipFeeDTO?> GetLatestFeeAsync();

    // CHANGED: now requires RoleId so each category has its own fee history.
    Task<(int feeId, string message)> SetFeeAsync(int roleId, decimal amount, DateTime effectiveFrom, int createdBy);

    Task<int> CreatePaymentAsync(int memberId, int feeId, decimal amount, string paymentMode, string transactionRef, string status);
    Task<bool> UpdateMemberStatusAsync(int memberId, string status);
    Task<List<PaymentHistoryDTO>> GetPaymentHistoryAsync(int memberId);
    Task<List<PaymentAllDTO>> GetAllPaymentsAsync(int pageNumber, int pageSize);
    Task<(bool success, string email, string fullName, string error)> CompleteRegistrationPaymentAsync(
        int memberId, int userId, int feeId, decimal amount, string paymentMode, string transactionRef);
    Task<List<PaymentReportRowDTO>> GetPaymentReportByClubAsync(int clubId, DateTime startDate, DateTime endDate);
    Task<List<MemberMembershipPaymentRowDTO>> GetMemberMembershipPaymentHistoryAsync(int memberId);
    Task<List<MemberFundraisePaymentRowDTO>> GetMemberFundraisePaymentHistoryAsync(int memberId);
}