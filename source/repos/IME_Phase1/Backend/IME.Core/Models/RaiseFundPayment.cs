using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IME.Core.Models
{
    public class RaiseFundPayment
    {
        public int MemberId { get; set; }
        public int FundId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMode { get; set; }
        public string TransactionId { get; set; }
        public string PaymentStatus { get; set; }

        // Response fields filled after SP
        public int? Id { get; set; }
        public decimal? TargetAmount { get; set; }
        public decimal? CollectedAmount { get; set; }
        public decimal? BalanceAmount { get; set; }
        public DateTime? PaymentDate { get; set; }
    }
}
