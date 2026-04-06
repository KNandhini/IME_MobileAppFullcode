using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using System.Data.SqlClient;
using IME.Infrastructure.Data;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly DatabaseContext _dbContext;
    private readonly IConfiguration _configuration;

    public PaymentController(DatabaseContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _configuration = configuration;
    }

    [HttpPost("create-order")]
    public async Task<ActionResult<ApiResponse<object>>> CreateOrder([FromBody] PaymentOrderDTO request)
    {
        try
        {
            // Get current membership fee
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetCurrentMembershipFee", connection);

            decimal feeAmount = 0;
            int feeId = 0;

            using (var reader = await command.ExecuteReaderAsync())
            {
                if (await reader.ReadAsync())
                {
                    feeId = reader.GetInt32(reader.GetOrdinal("FeeId"));
                    feeAmount = reader.GetDecimal(reader.GetOrdinal("Amount"));
                }
            }

            if (feeId == 0)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = false,
                    Message = "No active membership fee found"
                });
            }

            // In production, integrate with Razorpay here
            // For now, return mock order details
            var orderId = $"order_{DateTime.Now.Ticks}";

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Order created successfully",
                Data = new
                {
                    OrderId = orderId,
                    Amount = feeAmount,
                    FeeId = feeId,
                    Currency = "INR",
                    KeyId = _configuration["Razorpay:KeyId"] ?? "rzp_test_key"
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPost("verify-payment")]
    public async Task<ActionResult<ApiResponse<object>>> VerifyPayment([FromBody] PaymentVerificationDTO request)
    {
        try
        {
            // In production, verify Razorpay signature here
            // For now, accept the payment

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_CreateMembershipPayment", connection);

            command.Parameters.AddWithValue("@MemberId", request.MemberId);
            command.Parameters.AddWithValue("@FeeId", request.FeeId);
            command.Parameters.AddWithValue("@Amount", request.Amount);
            command.Parameters.AddWithValue("@PaymentMode", "Razorpay");
            command.Parameters.AddWithValue("@TransactionReference", request.RazorpayPaymentId);
            command.Parameters.AddWithValue("@Status", "Success");

            var paymentId = await command.ExecuteScalarAsync();

            // Update member status to Active
            using var updateCommand = _dbContext.CreateStoredProcCommand("sp_UpdateMemberStatus", connection);
            updateCommand.Parameters.AddWithValue("@MemberId", request.MemberId);
            updateCommand.Parameters.AddWithValue("@Status", "Active");
            await updateCommand.ExecuteNonQueryAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Payment verified successfully",
                Data = new { PaymentId = paymentId }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPost("generate-qr")]
    public async Task<ActionResult<ApiResponse<object>>> GenerateQRCode([FromBody] QRPaymentDTO request)
    {
        try
        {
            // Get current membership fee
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetCurrentMembershipFee", connection);

            decimal feeAmount = 0;
            int feeId = 0;

            using (var reader = await command.ExecuteReaderAsync())
            {
                if (await reader.ReadAsync())
                {
                    feeId = reader.GetInt32(reader.GetOrdinal("FeeId"));
                    feeAmount = reader.GetDecimal(reader.GetOrdinal("Amount"));
                }
            }

            if (feeId == 0)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = false,
                    Message = "No active membership fee found"
                });
            }

            // In production, generate actual QR code with UPI string
            // For now, return sample QR data
            string upiString = $"upi://pay?pa=ime@upi&pn=IME&am={feeAmount}&cu=INR&tn=Membership-{request.MemberId}";

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "QR code generated",
                Data = new
                {
                    FeeId = feeId,
                    Amount = feeAmount,
                    UpiString = upiString,
                    UpiId = "ime@upi",
                    Reference = $"IME_{request.MemberId}_{DateTime.Now.Ticks}"
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPost("confirm-qr-payment")]
    public async Task<ActionResult<ApiResponse<object>>> ConfirmQRPayment([FromBody] QRPaymentConfirmDTO request)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_CreateMembershipPayment", connection);

            command.Parameters.AddWithValue("@MemberId", request.MemberId);
            command.Parameters.AddWithValue("@FeeId", request.FeeId);
            command.Parameters.AddWithValue("@Amount", request.Amount);
            command.Parameters.AddWithValue("@PaymentMode", "UPI/QR");
            command.Parameters.AddWithValue("@TransactionReference", request.TransactionReference);
            command.Parameters.AddWithValue("@Status", "Pending Verification");

            var paymentId = await command.ExecuteScalarAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Payment submitted for verification",
                Data = new { PaymentId = paymentId }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpGet("history/{memberId}")]
    public async Task<ActionResult<ApiResponse<List<PaymentHistoryDTO>>>> GetPaymentHistory(int memberId)
    {
        try
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
                    PaymentId = reader.GetInt32(reader.GetOrdinal("PaymentId")),
                    Amount = reader.GetDecimal(reader.GetOrdinal("Amount")),
                    PaymentDate = reader.GetDateTime(reader.GetOrdinal("PaymentDate")),
                    PaymentMode = reader.IsDBNull(reader.GetOrdinal("PaymentMode")) ? null : reader.GetString(reader.GetOrdinal("PaymentMode")),
                    TransactionReference = reader.IsDBNull(reader.GetOrdinal("TransactionReference")) ? null : reader.GetString(reader.GetOrdinal("TransactionReference")),
                    Status = reader.GetString(reader.GetOrdinal("Status")),
                    EffectiveFrom = reader.IsDBNull(reader.GetOrdinal("EffectiveFrom")) ? null : reader.GetDateTime(reader.GetOrdinal("EffectiveFrom")),
                    EffectiveTo = reader.IsDBNull(reader.GetOrdinal("EffectiveTo")) ? null : reader.GetDateTime(reader.GetOrdinal("EffectiveTo"))
                });
            }

            return Ok(new ApiResponse<List<PaymentHistoryDTO>>
            {
                Success = true,
                Data = payments
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<PaymentHistoryDTO>>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetAllPayments(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var payments = new List<object>();

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetAllPayments", connection);

            command.Parameters.AddWithValue("@PageNumber", pageNumber);
            command.Parameters.AddWithValue("@PageSize", pageSize);

            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                payments.Add(new
                {
                    PaymentId = reader.GetInt32(reader.GetOrdinal("PaymentId")),
                    MemberName = reader.GetString(reader.GetOrdinal("MemberName")),
                    DesignationName = reader.IsDBNull(reader.GetOrdinal("DesignationName")) ? null : reader.GetString(reader.GetOrdinal("DesignationName")),
                    Amount = reader.GetDecimal(reader.GetOrdinal("Amount")),
                    PaymentDate = reader.GetDateTime(reader.GetOrdinal("PaymentDate")),
                    PaymentMode = reader.IsDBNull(reader.GetOrdinal("PaymentMode")) ? null : reader.GetString(reader.GetOrdinal("PaymentMode")),
                    TransactionReference = reader.IsDBNull(reader.GetOrdinal("TransactionReference")) ? null : reader.GetString(reader.GetOrdinal("TransactionReference")),
                    Status = reader.GetString(reader.GetOrdinal("Status"))
                });
            }

            return Ok(new ApiResponse<List<object>>
            {
                Success = true,
                Data = payments
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<object>>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpGet("current-fee")]
    public async Task<ActionResult<ApiResponse<object>>> GetCurrentFee()
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetCurrentMembershipFee", connection);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var fee = new
                {
                    FeeId = reader.GetInt32(reader.GetOrdinal("FeeId")),
                    Amount = reader.GetDecimal(reader.GetOrdinal("Amount")),
                    EffectiveFrom = reader.GetDateTime(reader.GetOrdinal("EffectiveFrom")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                };

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Data = fee
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = false,
                Message = "No active fee found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPost("set-fee")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> SetMembershipFee([FromBody] SetFeeDTO request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_CreateMembershipFee", connection);

            command.Parameters.AddWithValue("@Amount", request.Amount);
            command.Parameters.AddWithValue("@EffectiveFrom", request.EffectiveFrom);
            command.Parameters.AddWithValue("@CreatedBy", userId);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var feeId = Convert.ToInt32(reader.GetValue(reader.GetOrdinal("FeeId")));
                var message = reader.GetString(reader.GetOrdinal("Message"));

                return Ok(new ApiResponse<object>
                {
                    Success = feeId > 0,
                    Message = message,
                    Data = new { FeeId = feeId }
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = false,
                Message = "Failed to set fee"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }
}
