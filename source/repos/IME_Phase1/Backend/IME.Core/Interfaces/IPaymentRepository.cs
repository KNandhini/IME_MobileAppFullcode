using IME.Core.DTOs;

namespace IME.Core.Interfaces;

public interface IPaymentRepository
{
    Task<MembershipFeeDTO?> GetCurrentFeeAsync();
    Task<MembershipFeeDTO?> GetLatestFeeAsync();
    Task<(int feeId, string message)> SetFeeAsync(decimal amount, DateTime effectiveFrom, int createdBy);
    Task<int> CreatePaymentAsync(int memberId, int feeId, decimal amount, string paymentMode, string transactionRef, string status);
    Task<bool> UpdateMemberStatusAsync(int memberId, string status);
    Task<List<PaymentHistoryDTO>> GetPaymentHistoryAsync(int memberId);
    Task<List<PaymentAllDTO>> GetAllPaymentsAsync(int pageNumber, int pageSize);
    Task<(bool success, string email, string fullName, string error)> CompleteRegistrationPaymentAsync(
        int memberId, int userId, int feeId, decimal amount, string paymentMode, string transactionRef);
}
