using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IME.Core.Models
{
    public class JobPosting
    {
        public int JobPostingId { get; set; }
        public int ClubId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
       
        public string Location { get; set; } = string.Empty;
        public string EmploymentType { get; set; } = string.Empty;   // Full Time / Contract / Part Time / Internship
        public string? WorkingHours { get; set; }
        public string WorkMode { get; set; } = string.Empty;          // Remote / Hybrid / Office
        public string? AboutRole { get; set; }
        public string? RequiredSkillsExperience { get; set; }
        public string ContactInfo { get; set; } = string.Empty;
        public DateTime VacancyClosingDate { get; set; }
        public string? SalaryPackage { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public string? ModifiedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? Website { get; set; }
    }
}
