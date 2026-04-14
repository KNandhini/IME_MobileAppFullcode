using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IME.Infrastructure.Repositories
{
    public class RaiseFundPaymentRepository : IRaiseFundPayment
    {
    private readonly DatabaseContext _dbContext;

    public RaiseFundPaymentRepository(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<RaiseFundPaymentDto> InsertDonationAsync(RaiseFundPayment payment)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_InsertRaiseFundPayment", connection);

        command.Parameters.AddWithValue("@MemberId", payment.MemberId);
        command.Parameters.AddWithValue("@FundId", payment.FundId);
        command.Parameters.AddWithValue("@Amount", payment.Amount);
        command.Parameters.AddWithValue("@PaymentMode", payment.PaymentMode ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@TransactionId", payment.TransactionId ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@PaymentStatus", payment.PaymentStatus ?? (object)DBNull.Value);

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return new RaiseFundPaymentDto
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                MemberId = payment.MemberId,
                FundId = payment.FundId,
                Amount = payment.Amount,
                PaymentMode = payment.PaymentMode,
                TransactionId = payment.TransactionId,
                PaymentStatus = reader.GetString(reader.GetOrdinal("PaymentStatus")),
                PaymentDate = reader.GetDateTime(reader.GetOrdinal("PaymentDate")),
                TargetAmount = reader.GetDecimal(reader.GetOrdinal("TargetAmount")),
                CollectedAmount = reader.GetDecimal(reader.GetOrdinal("CollectedAmount")),
                BalanceAmount = reader.GetDecimal(reader.GetOrdinal("BalanceAmount")),
            };
        }

        return null;
    }
}
}
