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
        _paymentRepository = paymentRepository;
        _configuration = configuration;
        _emailService = emailService;
        _emailTemplateService = emailTemplateService;
    }

    // CHANGED: PaymentOrderDTO must now include a RoleId property
    // (1 = Serving/Retired, 2 = Students, 3 = Organisations) so the order
    // amount matches the category the user actually picked.
    [HttpPost("create-order")]
    public async Task<ActionResult<ApiResponse<object>>> CreateOrder([FromBody] PaymentOrderDTO request)
    {
        try
        {
            var fee = await _paymentRepository.GetCurrentFeeAsync(request.RoleId);
            if (fee == null)
                return Ok(new ApiResponse<object> { Success = false, Message = "No active membership fee found for this category" });

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Order created successfully",
                Data = new
                {
                    OrderId = $"order_{DateTime.Now.Ticks}",
                    Amount = fee.Amount,
                    FeeId = fee.FeeId,
                    Currency = "INR",
                    KeyId = _configuration["Razorpay:KeyId"] ?? "rzp_test_key"
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
                Data = new { PaymentId = paymentId }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // CHANGED: QRPaymentDTO must now include a RoleId property too.
    [HttpPost("generate-qr")]
    public async Task<ActionResult<ApiResponse<object>>> GenerateQRCode([FromBody] QRPaymentDTO request)
    {
        try
        {
            var fee = await _paymentRepository.GetCurrentFeeAsync(request.RoleId);
            if (fee == null)
                return Ok(new ApiResponse<object> { Success = false, Message = "No active membership fee found for this category" });

            string upiString = $"upi://pay?pa=ime@upi&pn=IME&am={fee.Amount}&cu=INR&tn=Membership-{request.MemberId}";

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "QR code generated",
                Data = new
                {
                    FeeId = fee.FeeId,
                    Amount = fee.Amount,
                    UpiString = upiString,
                    UpiId = "ime@upi",
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
                Data = new { PaymentId = paymentId }
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

    // CHANGED: now requires a roleId route parameter so the app gets the
    // fee for the specific category the user picked, not a single global fee.
    // Example: GET /api/payment/current-fee/2  → fee for Engineering Students
    [HttpGet("current-fee/{roleId}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<MembershipFeeDTO>>> GetCurrentFee(int roleId)
    {
        try
        {
            var fee = await _paymentRepository.GetCurrentFeeAsync(roleId);
            if (fee != null)
                return Ok(new ApiResponse<MembershipFeeDTO> { Success = true, Data = fee });

            return Ok(new ApiResponse<MembershipFeeDTO> { Success = false, Message = "No active fee found for this category" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<MembershipFeeDTO> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // NEW: returns the active fee for all 3 categories in one call.
    // Used by MembershipBenefitsScreen to show live DB-driven prices.
    [HttpGet("current-fees")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<MembershipFeeDTO>>>> GetAllCurrentFees()
    {
        try
        {
            var fees = await _paymentRepository.GetAllCurrentFeesAsync();
            return Ok(new ApiResponse<List<MembershipFeeDTO>> { Success = true, Data = fees });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<MembershipFeeDTO>> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // CHANGED: SetFeeDTO must now include a RoleId property — the admin app
    // sends which of the 3 categories this fee change applies to.
    [HttpPost("set-fee")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> SetMembershipFee([FromBody] SetFeeDTO request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            var (feeId, message) = await _paymentRepository.SetFeeAsync(request.RoleId, request.Amount, request.EffectiveFrom, userId);

            return Ok(new ApiResponse<object>
            {
                Success = feeId > 0,
                Message = message,
                Data = new { FeeId = feeId }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // CHANGED: RegistrationPaymentDTO must now include a RoleId property.
    // We no longer trust request.Amount from the client — the authoritative
    // amount is looked up server-side from the current fee for that RoleId.
    // This closes a tampering hole where a modified client could submit any
    // amount it wants.
    [HttpPost("register-payment")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<object>>> RegisterPayment([FromBody] RegistrationPaymentDTO request)
    {
        try
        {
            var fee = await _paymentRepository.GetCurrentFeeAsync(request.RoleId);
            if (fee == null)
                return Ok(new ApiResponse<object> { Success = false, Message = "No active membership fee found for this category" });

            var (success, email, fullName, error) = await _paymentRepository.CompleteRegistrationPaymentAsync(
                request.MemberId, request.UserId, fee.FeeId,
                fee.Amount, request.PaymentMode, request.TransactionReference);

            if (!success)
                return Ok(new ApiResponse<object> { Success = false, Message = error });

            // Use email from DB result; fall back to what the client sent
            var recipientEmail = !string.IsNullOrEmpty(email) ? email : request.MemberEmail;
            var recipientName = !string.IsNullOrEmpty(fullName) ? fullName : "Member";

            if (!string.IsNullOrEmpty(recipientEmail))
            {
                // Fire-and-forget: don't block the response waiting for SMTP
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var body = _emailTemplateService.RegistrationSuccess(
                            fullName: recipientName,
                            email: recipientEmail,
                            plainPassword: request.PlainPassword,
                            amount: fee.Amount,
                            transactionReference: request.TransactionReference,
                            paymentDate: DateTime.Now);

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
                Data = new { MemberId = request.MemberId }
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
    [FromQuery] int startMonth,
    [FromQuery] int startYear,
    [FromQuery] int endMonth,
    [FromQuery] int endYear)
    {
        try
        {
            if (clubId <= 0)
                return BadRequest(new ApiResponse<List<PaymentReportRowDTO>> { Success = false, Message = "Invalid ClubId" });

            if (startMonth < 1 || startMonth > 12 || endMonth < 1 || endMonth > 12)
                return BadRequest(new ApiResponse<List<PaymentReportRowDTO>> { Success = false, Message = "Month must be between 1 and 12" });

            var startDate = new DateTime(startYear, startMonth, 1);
            var endDate = new DateTime(endYear, endMonth, 1).AddMonths(1).AddDays(-1);

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
    //[Authorize(Roles = "Admin")]
    public async Task<IActionResult> DownloadPaymentReportExcel(
     [FromQuery] int clubId,
     [FromQuery] int startMonth,
     [FromQuery] int startYear,
     [FromQuery] int endMonth,
     [FromQuery] int endYear)
    {
        if (clubId <= 0)
            return BadRequest("Invalid ClubId");

        if (startMonth < 1 || startMonth > 12 || endMonth < 1 || endMonth > 12)
            return BadRequest("Month must be between 1 and 12");

        var startDate = new DateTime(startYear, startMonth, 1);
        var endDate = new DateTime(endYear, endMonth, 1).AddMonths(1).AddDays(-1); // last day of end month

        if (endDate < startDate)
            return BadRequest("End date must be on or after start date");

        try
        {
            var rows = await _paymentRepository.GetPaymentReportByClubAsync(clubId, startDate, endDate);
            var clubName = rows.FirstOrDefault()?.ClubName ?? "Unknown Club";

            using var workbook = new XLWorkbook();
            var sheet = workbook.Worksheets.Add("Payment Report");
            sheet.Range("A1:F1").Merge();
            sheet.Cell("A1").Value = "IME Membership Payment Report";
            sheet.Cell("A1").Style.Font.Bold = true;
            sheet.Cell("A1").Style.Font.FontSize = 14;
            sheet.Cell("A1").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            sheet.Row(1).Height = 24;
            sheet.Range("A2:F2").Merge();
            sheet.Cell("A2").Value = $"{clubName} ({startDate:MMM yyyy} – {endDate:MMM yyyy})";
            //sheet.Cell("A2").Style.Font.Italic = true;
            sheet.Cell("A2").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            var headers = new[] { "S.No", "Name", "Joining Date", "Payment ID", "Payment Date", "Payment Amount" };
            for (int i = 0; i < headers.Length; i++)
            {
                var cell = sheet.Cell(3, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Font.FontColor = XLColor.White;
                cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1E3A5F");
                cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            }

            int row = 4;
            decimal total = 0;
            foreach (var r in rows)
            {
                sheet.Cell(row, 1).Value = r.SNo;
                sheet.Cell(row, 1).Style.NumberFormat.Format = "0";
                sheet.Cell(row, 2).Value = r.Name;
                sheet.Cell(row, 3).Value = r.JoiningDate?.ToString("dd-MMM-yyyy") ?? "";
                sheet.Cell(row, 4).Value = r.PaymentId;
                sheet.Cell(row, 5).Value = r.PaymentDate.ToString("dd-MMM-yyyy");
                sheet.Cell(row, 6).Value = r.PaymentAmount;
                sheet.Cell(row, 6).Style.NumberFormat.Format = "#,##0.00";
                for (int c = 1; c <= 6; c++)
                    sheet.Cell(row, c).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                total += r.PaymentAmount;
                row++;
            }

            sheet.Cell(row, 5).Value = "Total Amount";
            sheet.Cell(row, 5).Style.Font.Bold = true;
            sheet.Cell(row, 6).Value = total;
            sheet.Cell(row, 6).Style.Font.Bold = true;
            sheet.Cell(row, 6).Style.NumberFormat.Format = "#,##0.00";
            sheet.Cell(row, 6).Style.Border.TopBorder = XLBorderStyleValues.Thin;
            sheet.Cell(row, 5).Style.Border.TopBorder = XLBorderStyleValues.Thin;

            sheet.Columns().AdjustToContents();
            sheet.Column(1).Width = Math.Max(sheet.Column(1).Width, 8);
            sheet.SheetView.FreezeRows(3);

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


    [HttpGet("member-history/{memberId}")]
    public async Task<ActionResult<ApiResponse<object>>> GetMemberPaymentHistory(int memberId)
    {
        try
        {
            var membership = await _paymentRepository.GetMemberMembershipPaymentHistoryAsync(memberId);
            var fundraise = await _paymentRepository.GetMemberFundraisePaymentHistoryAsync(memberId);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Data = new
                {
                    MembershipPayments = membership,
                    FundraisePayments = fundraise
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpGet("member-history/{memberId}/excel")]
    public async Task<IActionResult> DownloadMemberPaymentHistoryExcel(int memberId)
    {
        try
        {
            var membership = await _paymentRepository.GetMemberMembershipPaymentHistoryAsync(memberId);
            var fundraise = await _paymentRepository.GetMemberFundraisePaymentHistoryAsync(memberId);

            using var workbook = new XLWorkbook();

            // ── Sheet 1: Membership Payments ──
            var sheet1 = workbook.Worksheets.Add("Membership Payments");
            sheet1.Range("A1:E1").Merge();
            sheet1.Cell("A1").Value = "IME Membership Payment History";
            sheet1.Cell("A1").Style.Font.Bold = true;
            sheet1.Cell("A1").Style.Font.FontSize = 14;
            sheet1.Cell("A1").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            sheet1.Row(1).Height = 24;

            var headers1 = new[] { "S.No", "Club Name", "Payment Date", "Payment ID", "Amount" };
            for (int i = 0; i < headers1.Length; i++)
            {
                var cell = sheet1.Cell(2, i + 1);
                cell.Value = headers1[i];
                cell.Style.Font.Bold = true;
                cell.Style.Font.FontColor = XLColor.White;
                cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1E3A5F");
                cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            }

            int r1 = 3;
            decimal total1 = 0;
            foreach (var row in membership)
            {
                sheet1.Cell(r1, 1).Value = row.SNo;
                sheet1.Cell(r1, 1).Style.NumberFormat.Format = "0";   // add this line

                sheet1.Cell(r1, 2).Value = row.ClubName;
                sheet1.Cell(r1, 3).Value = row.PaymentDate.ToString("dd-MMM-yyyy");
                sheet1.Cell(r1, 4).Value = row.PaymentId;
                sheet1.Cell(r1, 5).Value = row.Amount;
                sheet1.Cell(r1, 5).Style.NumberFormat.Format = "#,##0.00";
                for (int c = 1; c <= 5; c++)
                    sheet1.Cell(r1, c).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                total1 += row.Amount;
                r1++;
            }
            sheet1.Cell(r1, 4).Value = "Total Amount";
            sheet1.Cell(r1, 4).Style.Font.Bold = true;
            sheet1.Cell(r1, 5).Value = total1;
            sheet1.Cell(r1, 5).Style.Font.Bold = true;
            sheet1.Cell(r1, 5).Style.NumberFormat.Format = "#,##0.00";
            sheet1.Columns().AdjustToContents();
            sheet1.Column(1).Width = Math.Max(sheet1.Column(1).Width, 8);   // S.No column floor
            sheet1.SheetView.FreezeRows(2);

            // ── Sheet 2: Fundraise Payments ──
            var sheet2 = workbook.Worksheets.Add("Fundraise Payments");
            sheet2.Range("A1:E1").Merge();
            sheet2.Cell("A1").Value = "IME Fundraise Payment History";
            sheet2.Cell("A1").Style.Font.Bold = true;
            sheet2.Cell("A1").Style.Font.FontSize = 14;
            sheet2.Cell("A1").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            sheet2.Row(1).Height = 24;

            var headers2 = new[] { "S.No", "Fund Name", "Payment Date", "Payment ID", "Amount" };
            for (int i = 0; i < headers2.Length; i++)
            {
                var cell = sheet2.Cell(2, i + 1);
                cell.Value = headers2[i];
                cell.Style.Font.Bold = true;
                cell.Style.Font.FontColor = XLColor.White;
                cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1E3A5F");
                cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            }

            int r2 = 3;
            decimal total2 = 0;
            foreach (var row in fundraise)
            {
                sheet2.Cell(r2, 1).Value = row.SNo;
                sheet2.Cell(r2, 1).Style.NumberFormat.Format = "0";
                sheet2.Cell(r2, 2).Value = row.FundName;
                sheet2.Cell(r2, 3).Value = row.PaymentDate.ToString("dd-MMM-yyyy");
                sheet2.Cell(r2, 4).Value = row.PaymentId;
                sheet2.Cell(r2, 5).Value = row.Amount;
                sheet2.Cell(r2, 5).Style.NumberFormat.Format = "#,##0.00";
                for (int c = 1; c <= 5; c++)
                    sheet2.Cell(r2, c).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                total2 += row.Amount;
                r2++;
            }
            sheet2.Cell(r2, 4).Value = "Total Amount";
            sheet2.Cell(r2, 4).Style.Font.Bold = true;
            sheet2.Cell(r2, 5).Value = total2;
            sheet2.Cell(r2, 5).Style.Font.Bold = true;
            sheet2.Cell(r2, 5).Style.NumberFormat.Format = "#,##0.00";
            sheet2.Columns().AdjustToContents();
            sheet2.Column(2).Width = Math.Max(sheet2.Column(2).Width, 8);   // same idea for Sheet 2's narrow columns if needed
            sheet2.SheetView.FreezeRows(2);

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();
            var fileName = $"IME_PaymentHistory_Member{memberId}_{DateTime.Now:yyyyMMdd}.xlsx";
            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }
}