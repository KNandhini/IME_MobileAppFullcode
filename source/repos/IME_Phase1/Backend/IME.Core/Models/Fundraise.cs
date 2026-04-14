using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IME.Core.Models
{
    public class Fundraise
    {
        public int Id { get; set; }

        public string FullName { get; set; }
        public int? Age { get; set; }
        public string Gender { get; set; }
        public string Place { get; set; }
        public string Address { get; set; }
        public string? ContactNumber { get; set; }
        public string RelationToCommunity { get; set; }

        public string FundTitle { get; set; }
        public string FundCategory { get; set; }
        public string Description { get; set; }
        public decimal TargetAmount { get; set; }
        public decimal CollectedAmount { get; set; }
        public string UrgencyLevel { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public string? SupportingDocumentUrl { get; set; }
        public string? BeneficiaryPhotoUrl { get; set; }

        public string AccountHolderName { get; set; }
        public string BankAccountNumber { get; set; }
        public string IFSCCode { get; set; }
        public string? UPIId { get; set; }

        public string Status { get; set; }

        public string CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }

        public string? ModifiedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public decimal BalanceAmount { get; set; }
        public decimal MinimumAmount { get; set; }
    }
}

