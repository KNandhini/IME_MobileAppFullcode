using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IME.Core.DTOs
{
    public class FundraiseDto
    {
        public string FullName { get; set; } = string.Empty;
        public int? Age { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string Place { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? ContactNumber { get; set; }
        public string RelationToCommunity { get; set; } = string.Empty;

        public string FundTitle { get; set; } = string.Empty;
        public string FundCategory { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal TargetAmount { get; set; }
        public decimal CollectedAmount { get; set; }
        public string UrgencyLevel { get; set; } = string.Empty;

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public string? SupportingDocumentUrl { get; set; }
        public string? BeneficiaryPhotoUrl { get; set; }

        public string AccountHolderName { get; set; } = string.Empty;
        public string BankAccountNumber { get; set; } = string.Empty;
        public string IFSCCode { get; set; } = string.Empty;
        public string UPIId { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;
        public string CreatedBy { get; set; } = string.Empty;
        public int Id { get; set; }
        public decimal BalanceAmount { get; set; }
        public decimal MinimumAmount { get; set; }
        public string? ModifiedBy { get; set; }
    }
}
