using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using System.Data.SqlClient;
using IME.Infrastructure.Data;
using IME.Infrastructure.Services;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly DatabaseContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly EmailService _emailService;

    public PaymentController(DatabaseContext dbContext, IConfiguration configuration, EmailService emailService)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _emailService = emailService;
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

    [HttpGet("latest-fee")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<object>>> GetLatestFee()
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateCommand(
                "SELECT TOP 1 FeeId, Amount, EffectiveFrom, IsActive FROM MembershipFee WHERE IsActive = 1 ORDER BY EffectiveFrom DESC",
                connection);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Data = new
                    {
                        FeeId = reader.GetInt32(reader.GetOrdinal("FeeId")),
                        Amount = reader.GetDecimal(reader.GetOrdinal("Amount")),
                        EffectiveFrom = reader.GetDateTime(reader.GetOrdinal("EffectiveFrom")),
                        IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                    }
                });
            }

            return Ok(new ApiResponse<object> { Success = false, Message = "No fee currently set. Please contact admin." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
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

    [HttpPost("register-payment")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<object>>> RegisterPayment([FromBody] RegistrationPaymentDTO request)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();

            // Get current active fee
            int feeId = 0;
            using (var feeCmd = _dbContext.CreateStoredProcCommand("sp_GetCurrentMembershipFee", connection))
            using (var feeReader = await feeCmd.ExecuteReaderAsync())
            {
                if (await feeReader.ReadAsync())
                    feeId = Convert.ToInt32(feeReader.GetValue(feeReader.GetOrdinal("FeeId")));
            }

            if (feeId == 0)
            {
                return Ok(new ApiResponse<object> { Success = false, Message = "No active membership fee found" });
            }

            // Record payment
            using var payCmd = _dbContext.CreateStoredProcCommand("sp_CreateMembershipPayment", connection);
            payCmd.Parameters.AddWithValue("@MemberId", request.MemberId);
            payCmd.Parameters.AddWithValue("@FeeId", feeId);
            payCmd.Parameters.AddWithValue("@Amount", request.Amount);
            payCmd.Parameters.AddWithValue("@PaymentMode", request.PaymentMode);
            payCmd.Parameters.AddWithValue("@TransactionReference", request.TransactionReference);
            payCmd.Parameters.AddWithValue("@Status", "Success");
            await payCmd.ExecuteScalarAsync();

            // Activate member
            using var statusCmd = new SqlCommand(
                "UPDATE Members SET MembershipStatus = 'Active' WHERE MemberId = @MemberId", connection);
            statusCmd.Parameters.AddWithValue("@MemberId", request.MemberId);
            await statusCmd.ExecuteNonQueryAsync();

            // Activate user account
            using var userCmd = new SqlCommand(
                "UPDATE Users SET IsActive = 1 WHERE UserId = @UserId", connection);
            userCmd.Parameters.AddWithValue("@UserId", request.UserId);
            await userCmd.ExecuteNonQueryAsync();

            // Get member email and name
            string memberEmail = string.Empty;
            string memberName = string.Empty;
            using var emailCmd = new SqlCommand(
                @"SELECT u.Email, m.FullName FROM Users u
                  JOIN Members m ON m.UserId = u.UserId
                  WHERE u.UserId = @UserId", connection);
            emailCmd.Parameters.AddWithValue("@UserId", request.UserId);
            using (var emailReader = await emailCmd.ExecuteReaderAsync())
            {
                if (await emailReader.ReadAsync())
                {
                    memberEmail = emailReader.GetString(0);
                    memberName = emailReader.GetString(1);
                }
            }

            // Send welcome email
            if (!string.IsNullOrEmpty(memberEmail))
            {
                try
                {
                    var subject = "Welcome to IME – Registration Successful!";
                    var body = $@"
                        <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;'>
                          <div style='background:#1E3A5F;padding:24px;text-align:center;'>
                            <h2 style='color:#D4A017;margin:0;'>Welcome to IME</h2>
                          </div>
                          <div style='padding:24px;background:#f9f9f9;'>
                            <p>Dear <strong>{memberName}</strong>,</p>
                            <p>Your membership registration is complete and your payment of <strong>₹{request.Amount}</strong> has been received.</p>
                            <p>Your account is now active. You can login to the IME app with your registered email and password.</p>
                            <p style='color:#555;font-size:13px;'>Transaction Reference: {request.TransactionReference}</p>
                            <p>Thank you for joining IME!</p>
                          </div>
                          <div style='background:#1E3A5F;padding:12px;text-align:center;'>
                            <p style='color:rgba(255,255,255,0.7);font-size:12px;margin:0;'>IME Membership Portal</p>
                          </div>
                        </div>";
                    await _emailService.SendEmailAsync(memberEmail, subject, body);
                }
                catch (Exception emailEx)
                {
                    Console.WriteLine($"Email failed: {emailEx.Message}");
                }
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Registration complete! Your account is now active.",
                Data = new { MemberId = request.MemberId }
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
