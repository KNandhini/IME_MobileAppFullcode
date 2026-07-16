using ClosedXML.Excel;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly IPaymentRepository _paymentRepository;
    private readonly IConfiguration _configuration;
    private readonly EmailService _emailService;
    private readonly EmailTemplateService _emailTemplateService;

    public PaymentController(IPaymentRepository paymentRepository, IConfiguration configuration, EmailService emailService, EmailTemplateService emailTemplateService)
    {
        _paymentRepository    = paymentRepository;
        _configuration        = configuration;
        _emailService         = emailService;
        _emailTemplateService = emailTemplateService;
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

            // Use email from DB result; fall back to what the client sent
            var recipientEmail = !string.IsNullOrEmpty(email) ? email : request.MemberEmail;
            var recipientName  = !string.IsNullOrEmpty(fullName) ? fullName : "Member";

            if (!string.IsNullOrEmpty(recipientEmail))
            {
                // Fire-and-forget: don't block the response waiting for SMTP
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var body = _emailTemplateService.RegistrationSuccess(
                            fullName:             recipientName,
                            email:                recipientEmail,
                            plainPassword:        request.PlainPassword,
                            amount:               request.Amount,
                            transactionReference: request.TransactionReference,
                            paymentDate:          DateTime.Now);

                        await _emailService.SendEmailAsync(
                            recipientEmail,
                            "Welcome to IME – Registration Successful!",
                            body);
                    }
                    catch (Exception emailEx)
                    {
                        Console.WriteLine($"Email failed: {emailEx.Message}");
                    }
                });
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
    // Existing JSON endpoint — keep this if you still want an in-app preview table.
    [HttpGet("report")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<PaymentReportRowDTO>>>> GetPaymentReport(
        [FromQuery] int clubId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        try
        {
            if (clubId <= 0)
                return BadRequest(new ApiResponse<List<PaymentReportRowDTO>> { Success = false, Message = "Invalid ClubId" });

            if (endDate < startDate)
                return BadRequest(new ApiResponse<List<PaymentReportRowDTO>> { Success = false, Message = "End date must be on or after start date" });

            var rows = await _paymentRepository.GetPaymentReportByClubAsync(clubId, startDate, endDate);

            return Ok(new ApiResponse<List<PaymentReportRowDTO>> { Success = true, Data = rows });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<PaymentReportRowDTO>> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // NEW — builds the .xlsx server-side and returns it as a downloadable file.
    [HttpGet("report/excel")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DownloadPaymentReportExcel(
        [FromQuery] int clubId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        if (clubId <= 0)
            return BadRequest("Invalid ClubId");

        if (endDate < startDate)
            return BadRequest("End date must be on or after start date");

        try
        {
            var rows = await _paymentRepository.GetPaymentReportByClubAsync(clubId, startDate, endDate);

            using var workbook = new XLWorkbook();
            var sheet = workbook.Worksheets.Add("Payment Report");

            // ── Title (merged header row) ──
            sheet.Range("A1:F1").Merge();
            sheet.Cell("A1").Value = "IME Membership Payment Report";
            sheet.Cell("A1").Style.Font.Bold = true;
            sheet.Cell("A1").Style.Font.FontSize = 14;
            sheet.Cell("A1").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            sheet.Row(1).Height = 24;

            sheet.Range("A2:F2").Merge();
            sheet.Cell("A2").Value = $"{startDate:dd MMM yyyy} – {endDate:dd MMM yyyy}";
            sheet.Cell("A2").Style.Font.Italic = true;
            sheet.Cell("A2").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // ── Column headers ──
            var headers = new[] { "S.No", "Name", "Joining Date", "Payment Amount", "Payment ID", "Payment Date" };
            for (int i = 0; i < headers.Length; i++)
            {
                var cell = sheet.Cell(4, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Font.FontColor = XLColor.White;
                cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1E3A5F");
                cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            }

            // ── Data rows ──
            int row = 5;
            decimal total = 0;
            foreach (var r in rows)
            {
                sheet.Cell(row, 1).Value = r.SNo;
                sheet.Cell(row, 2).Value = r.Name;
                sheet.Cell(row, 3).Value = r.JoiningDate?.ToString("dd-MMM-yyyy") ?? "";
                sheet.Cell(row, 4).Value = r.PaymentAmount;
                sheet.Cell(row, 4).Style.NumberFormat.Format = "#,##0.00";
                sheet.Cell(row, 5).Value = r.PaymentId;
                sheet.Cell(row, 6).Value = r.PaymentDate.ToString("dd-MMM-yyyy");

                for (int c = 1; c <= 6; c++)
                    sheet.Cell(row, c).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;

                total += r.PaymentAmount;
                row++;
            }

            // ── Total row ──
            row++; // blank spacer row
            sheet.Cell(row, 3).Value = "Total Amount";
            sheet.Cell(row, 3).Style.Font.Bold = true;
            sheet.Cell(row, 4).Value = total;
            sheet.Cell(row, 4).Style.Font.Bold = true;
            sheet.Cell(row, 4).Style.NumberFormat.Format = "#,##0.00";
            sheet.Cell(row, 4).Style.Border.TopBorder = XLBorderStyleValues.Thin;
            sheet.Cell(row, 3).Style.Border.TopBorder = XLBorderStyleValues.Thin;

            sheet.Columns().AdjustToContents();
            sheet.SheetView.FreezeRows(4);

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            var fileName = $"IME_PaymentReport_{startDate:yyyyMM}_{endDate:yyyyMM}.xlsx";
            return File(
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName
            );
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }
}
