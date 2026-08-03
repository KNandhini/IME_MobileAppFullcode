using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IME.Core.DTOs
{
     /// <summary>Used in list view (GET /api/jobpostings?clubId=x)</summary>
    public class JobPostingDTOs
    {
        public int JobPostingId { get; set; }
        public int ClubId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string ContactInfo { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string EmploymentType { get; set; } = string.Empty;
        public string? WorkingHours { get; set; }
        public string WorkMode { get; set; } = string.Empty;
        public string? SalaryPackage { get; set; }
        public DateTime VacancyClosingDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public string? AttachmentPath { get; set; }   // first attachment URL for list card preview
        public string? Website { get; set; }
        public string? AboutRole { get; set; }
        public string? RequiredSkillsExperience { get; set; }
    }

    /// <summary>Used in detail view (GET /api/jobpostings/{id})</summary>
    public class JobPostingDetailDTO
    {
        public int JobPostingId { get; set; }
        public int ClubId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string EmploymentType { get; set; } = string.Empty;
        public string? WorkingHours { get; set; }
        public string WorkMode { get; set; } = string.Empty;
        public string? AboutRole { get; set; }
        public string? RequiredSkillsExperience { get; set; }
        public string ContactInfo { get; set; } = string.Empty;
        public DateTime VacancyClosingDate { get; set; }
        public string? SalaryPackage { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public string? ModifiedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string? AttachmentPath { get; set; }   // first attachment URL (convenience alias)
        public List<AttachmentDTO> Attachments { get; set; } = [];
        public string? Website { get; set; }
    }

    // AttachmentDTO is already defined in your project (used by Achievements).
    // If it isn't yet, add it here:
    // public class AttachmentDTO
    // {
    //     public int AttachmentId { get; set; }
    //     public string? FileName { get; set; }
    //     public string? FilePath { get; set; }
    //     public DateTime UploadedDate { get; set; }
    // }
}
