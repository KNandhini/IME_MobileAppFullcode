using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IME.Core.DTOs
{
    public class RaiseFundPaymentDto
    {
        // ── Request fields (app sends these) ─────────────────────────
        public int MemberId { get; set; }
        public int FundId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMode { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;

        // ── Response fields (API fills these, null on request) ────────
        public int? Id { get; set; }
        public decimal? TargetAmount { get; set; }
        public decimal? CollectedAmount { get; set; }
        public decimal? BalanceAmount { get; set; }
        public DateTime? PaymentDate { get; set; }
    }
}
