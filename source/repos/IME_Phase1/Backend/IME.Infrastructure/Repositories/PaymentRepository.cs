using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Infrastructure.Data;

namespace IME.Infrastructure.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly DatabaseContext _dbContext;

    public PaymentRepository(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<MembershipFeeDTO?> GetCurrentFeeAsync()
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetCurrentMembershipFee", connection);
        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return new MembershipFeeDTO
            {
                FeeId        = reader.GetInt32(reader.GetOrdinal("FeeId")),
                Amount       = reader.GetDecimal(reader.GetOrdinal("Amount")),
                EffectiveFrom = reader.GetDateTime(reader.GetOrdinal("EffectiveFrom")),
                IsActive     = reader.GetBoolean(reader.GetOrdinal("IsActive"))
            };
        }
        return null;
    }

    public async Task<MembershipFeeDTO?> GetLatestFeeAsync()
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetLatestMembershipFee", connection);
        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return new MembershipFeeDTO
            {
                FeeId        = reader.GetInt32(reader.GetOrdinal("FeeId")),
                Amount       = reader.GetDecimal(reader.GetOrdinal("Amount")),
                EffectiveFrom = reader.GetDateTime(reader.GetOrdinal("EffectiveFrom")),
                IsActive     = reader.GetBoolean(reader.GetOrdinal("IsActive"))
            };
        }
        return null;
    }

    public async Task<(int feeId, string message)> SetFeeAsync(decimal amount, DateTime effectiveFrom, int createdBy)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_CreateMembershipFee", connection);

        command.Parameters.AddWithValue("@Amount", amount);
        command.Parameters.AddWithValue("@EffectiveFrom", effectiveFrom);
        command.Parameters.AddWithValue("@CreatedBy", createdBy);

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return (
                Convert.ToInt32(reader.GetValue(reader.GetOrdinal("FeeId"))),
                reader.GetString(reader.GetOrdinal("Message"))
            );
        }
        return (0, "Failed to set fee");
    }

    public async Task<int> CreatePaymentAsync(int memberId, int feeId, decimal amount, string paymentMode, string transactionRef, string status)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_CreateMembershipPayment", connection);

        command.Parameters.AddWithValue("@MemberId", memberId);
        command.Parameters.AddWithValue("@FeeId", feeId);
        command.Parameters.AddWithValue("@Amount", amount);
        command.Parameters.AddWithValue("@PaymentMode", paymentMode);
        command.Parameters.AddWithValue("@TransactionReference", transactionRef);
        command.Parameters.AddWithValue("@Status", status);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result ?? 0);
    }

    public async Task<bool> UpdateMemberStatusAsync(int memberId, string status)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_UpdateMemberStatus", connection);

        command.Parameters.AddWithValue("@MemberId", memberId);
        command.Parameters.AddWithValue("@Status", status);

        var rows = await command.ExecuteNonQueryAsync();
        return rows > 0;
    }

    public async Task<List<PaymentHistoryDTO>> GetPaymentHistoryAsync(int memberId)
    {
        var payments = new List<PaymentHistoryDTO>();

        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetMemberPaymentHistory", connection);
        command.Parameters.AddWithValue("@MemberId", memberId);

        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            payments.Add(new PaymentHistoryDTO
            {
                PaymentId            = reader.GetInt32(reader.GetOrdinal("PaymentId")),
                Amount               = reader.GetDecimal(reader.GetOrdinal("Amount")),
                PaymentDate          = reader.GetDateTime(reader.GetOrdinal("PaymentDate")),
                PaymentMode          = reader.IsDBNull(reader.GetOrdinal("PaymentMode")) ? null : reader.GetString(reader.GetOrdinal("PaymentMode")),
                TransactionReference = reader.IsDBNull(reader.GetOrdinal("TransactionReference")) ? null : reader.GetString(reader.GetOrdinal("TransactionReference")),
                Status               = reader.GetString(reader.GetOrdinal("Status")),
                EffectiveFrom        = reader.IsDBNull(reader.GetOrdinal("EffectiveFrom")) ? null : reader.GetDateTime(reader.GetOrdinal("EffectiveFrom")),
                EffectiveTo          = reader.IsDBNull(reader.GetOrdinal("EffectiveTo")) ? null : reader.GetDateTime(reader.GetOrdinal("EffectiveTo"))
            });
        }
        return payments;
    }

    public async Task<List<PaymentAllDTO>> GetAllPaymentsAsync(int pageNumber, int pageSize)
    {
        var payments = new List<PaymentAllDTO>();

        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetAllPayments", connection);
        command.Parameters.AddWithValue("@PageNumber", pageNumber);
        command.Parameters.AddWithValue("@PageSize", pageSize);

        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            payments.Add(new PaymentAllDTO
            {
                PaymentId            = reader.GetInt32(reader.GetOrdinal("PaymentId")),
                MemberName           = reader.GetString(reader.GetOrdinal("MemberName")),
                DesignationName      = reader.IsDBNull(reader.GetOrdinal("DesignationName")) ? null : reader.GetString(reader.GetOrdinal("DesignationName")),
                Amount               = reader.GetDecimal(reader.GetOrdinal("Amount")),
                PaymentDate          = reader.GetDateTime(reader.GetOrdinal("PaymentDate")),
                PaymentMode          = reader.IsDBNull(reader.GetOrdinal("PaymentMode")) ? null : reader.GetString(reader.GetOrdinal("PaymentMode")),
                TransactionReference = reader.IsDBNull(reader.GetOrdinal("TransactionReference")) ? null : reader.GetString(reader.GetOrdinal("TransactionReference")),
                Status               = reader.GetString(reader.GetOrdinal("Status"))
            });
        }
        return payments;
    }

    public async Task<(bool success, string email, string fullName, string error)> CompleteRegistrationPaymentAsync(
        int memberId, int userId, int feeId, decimal amount, string paymentMode, string transactionRef)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_CompleteRegistrationPayment", connection);

        command.Parameters.AddWithValue("@MemberId", memberId);
        command.Parameters.AddWithValue("@UserId", userId);
        command.Parameters.AddWithValue("@FeeId", feeId);
        command.Parameters.AddWithValue("@Amount", amount);
        command.Parameters.AddWithValue("@PaymentMode", paymentMode);
        command.Parameters.AddWithValue("@TransactionReference", transactionRef);

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            var email     = reader.IsDBNull(reader.GetOrdinal("Email"))     ? string.Empty : reader.GetString(reader.GetOrdinal("Email"));
            var fullName  = reader.IsDBNull(reader.GetOrdinal("FullName"))  ? string.Empty : reader.GetString(reader.GetOrdinal("FullName"));
            var error     = reader.IsDBNull(reader.GetOrdinal("ErrorMessage")) ? string.Empty : reader.GetString(reader.GetOrdinal("ErrorMessage"));
            return (!string.IsNullOrEmpty(email), email, fullName, error);
        }
        return (false, string.Empty, string.Empty, "No result returned");
    }
}
