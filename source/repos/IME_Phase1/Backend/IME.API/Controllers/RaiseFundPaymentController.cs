

using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace IME.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RaiseFundPaymentController : ControllerBase
    {
        private readonly IRaiseFundPayment _raiseFundPaymentRepository;

        public RaiseFundPaymentController(IRaiseFundPayment raiseFundPaymentRepository)
        {
            _raiseFundPaymentRepository = raiseFundPaymentRepository;
        }

        [HttpPost("donate")]
        public async Task<ActionResult<ApiResponse<RaiseFundPaymentDto>>> Donate(
            [FromBody] RaiseFundPaymentDto request)
        {
            try
            { // DTO → Entity  (same as your Member pattern)
                var payment = new RaiseFundPayment
                {
                    MemberId = request.MemberId,
                    FundId = request.FundId,
                    Amount = request.Amount,
                    PaymentMode = request.PaymentMode,
                    TransactionId = request.TransactionId,
                    PaymentStatus = request.PaymentStatus,
                };


                var result = await _raiseFundPaymentRepository.InsertDonationAsync(payment);

                if (result != null)
                {
                    return Ok(new ApiResponse<RaiseFundPaymentDto>
                    {
                        Success = true,
                        Message = "Payment recorded successfully",
                        Data = result
                    });
                }

                return Ok(new ApiResponse<RaiseFundPaymentDto>
                {
                    Success = false,
                    Message = "Failed to record payment"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<RaiseFundPaymentDto>
                {
                    Success = false,
                    Message = $"Error: {ex.Message}"
                });
            }
        }
    }
}
