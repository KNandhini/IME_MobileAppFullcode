using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Infrastructure.Services;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly IPaymentRepository _paymentRepository;
    private readonly IConfiguration _configuration;
    private readonly EmailService _emailService;

    public PaymentController(IPaymentRepository paymentRepository, IConfiguration configuration, EmailService emailService)
    {
        _paymentRepository = paymentRepository;
        _configuration     = configuration;
        _emailService      = emailService;
    }

    [HttpPost("create-order")]
    public async Task<ActionResult<ApiResponse<object>>> CreateOrder([FromBody] PaymentOrderDTO request)
    {
        try
        {
            var fee = await _paymentRepository.GetCurrentFeeAsync();
            if (fee == null)
                return Ok(new ApiResponse<object> { Success = false, Message = "No active membership fee found" });

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Order created successfully",
                Data = new
                {
                    OrderId  = $"order_{DateTime.Now.Ticks}",
                    Amount   = fee.Amount,
                    FeeId    = fee.FeeId,
                    Currency = "INR",
                    KeyId    = _configuration["Razorpay:KeyId"] ?? "rzp_test_key"
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpPost("verify-payment")]
    public async Task<ActionResult<ApiResponse<object>>> VerifyPayment([FromBody] PaymentVerificationDTO request)
    {
        try
        {
            var paymentId = await _paymentRepository.CreatePaymentAsync(
                request.MemberId, request.FeeId, request.Amount, "Razorpay", request.RazorpayPaymentId, "Success");

            await _paymentRepository.UpdateMemberStatusAsync(request.MemberId, "Active");

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Payment verified successfully",
                Data    = new { PaymentId = paymentId }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpPost("generate-qr")]
    public async Task<ActionResult<ApiResponse<object>>> GenerateQRCode([FromBody] QRPaymentDTO request)
    {
        try
        {
            var fee = await _paymentRepository.GetCurrentFeeAsync();
            if (fee == null)
                return Ok(new ApiResponse<object> { Success = false, Message = "No active membership fee found" });

            string upiString = $"upi://pay?pa=ime@upi&pn=IME&am={fee.Amount}&cu=INR&tn=Membership-{request.MemberId}";

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "QR code generated",
                Data = new
                {
                    FeeId     = fee.FeeId,
                    Amount    = fee.Amount,
                    UpiString = upiString,
                    UpiId     = "ime@upi",
                    Reference = $"IME_{request.MemberId}_{DateTime.Now.Ticks}"
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpPost("confirm-qr-payment")]
    public async Task<ActionResult<ApiResponse<object>>> ConfirmQRPayment([FromBody] QRPaymentConfirmDTO request)
    {
        try
        {
            var paymentId = await _paymentRepository.CreatePaymentAsync(
                request.MemberId, request.FeeId, request.Amount, "UPI/QR", request.TransactionReference, "Pending Verification");

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Payment submitted for verification",
                Data    = new { PaymentId = paymentId }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpGet("history/{memberId}")]
    public async Task<ActionResult<ApiResponse<List<PaymentHistoryDTO>>>> GetPaymentHistory(int memberId)
    {
        try
        {
            var payments = await _paymentRepository.GetPaymentHistoryAsync(memberId);
            return Ok(new ApiResponse<List<PaymentHistoryDTO>> { Success = true, Data = payments });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<PaymentHistoryDTO>> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<PaymentAllDTO>>>> GetAllPayments(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var payments = await _paymentRepository.GetAllPaymentsAsync(pageNumber, pageSize);
            return Ok(new ApiResponse<List<PaymentAllDTO>> { Success = true, Data = payments });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<PaymentAllDTO>> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpGet("latest-fee")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<MembershipFeeDTO>>> GetLatestFee()
    {
        try
        {
            var fee = await _paymentRepository.GetLatestFeeAsync();
            if (fee != null)
                return Ok(new ApiResponse<MembershipFeeDTO> { Success = true, Data = fee });

            return Ok(new ApiResponse<MembershipFeeDTO> { Success = false, Message = "No fee currently set. Please contact admin." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<MembershipFeeDTO> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpGet("current-fee")]
    public async Task<ActionResult<ApiResponse<MembershipFeeDTO>>> GetCurrentFee()
    {
        try
        {
            var fee = await _paymentRepository.GetCurrentFeeAsync();
            if (fee != null)
                return Ok(new ApiResponse<MembershipFeeDTO> { Success = true, Data = fee });

            return Ok(new ApiResponse<MembershipFeeDTO> { Success = false, Message = "No active fee found" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<MembershipFeeDTO> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpPost("set-fee")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> SetMembershipFee([FromBody] SetFeeDTO request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var (feeId, message) = await _paymentRepository.SetFeeAsync(request.Amount, request.EffectiveFrom, userId);

            return Ok(new ApiResponse<object>
            {
                Success = feeId > 0,
                Message = message,
                Data    = new { FeeId = feeId }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpPost("register-payment")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<object>>> RegisterPayment([FromBody] RegistrationPaymentDTO request)
    {
        try
        {
            var fee = await _paymentRepository.GetLatestFeeAsync();
            if (fee == null)
                return Ok(new ApiResponse<object> { Success = false, Message = "No active membership fee found" });

            var (success, email, fullName, error) = await _paymentRepository.CompleteRegistrationPaymentAsync(
                request.MemberId, request.UserId, fee.FeeId,
                request.Amount, request.PaymentMode, request.TransactionReference);

            if (!success)
                return Ok(new ApiResponse<object> { Success = false, Message = error });

            if (!string.IsNullOrEmpty(email))
            {
                try
                {
                    await _emailService.SendEmailAsync(email,
                        "Welcome to IME – Registration Successful!",
                        $@"<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;'>
                          <div style='background:#1E3A5F;padding:24px;text-align:center;'>
                            <h2 style='color:#D4A017;margin:0;'>Welcome to IME</h2>
                          </div>
                          <div style='padding:24px;background:#f9f9f9;'>
                            <p>Dear <strong>{fullName}</strong>,</p>
                            <p>Your membership registration is complete and your payment of <strong>₹{request.Amount}</strong> has been received.</p>
                            <p>Your account is now active. You can login to the IME app with your registered email and password.</p>
                            <p style='color:#555;font-size:13px;'>Transaction Reference: {request.TransactionReference}</p>
                            <p>Thank you for joining IME!</p>
                          </div>
                          <div style='background:#1E3A5F;padding:12px;text-align:center;'>
                            <p style='color:rgba(255,255,255,0.7);font-size:12px;margin:0;'>IME Membership Portal</p>
                          </div>
                        </div>");
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
                Data    = new { MemberId = request.MemberId }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }
}
