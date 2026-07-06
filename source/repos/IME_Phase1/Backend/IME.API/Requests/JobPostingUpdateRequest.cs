namespace IME.API.Requests;

public class JobPostingUpdateRequest
{
    public string JobTitle { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string EmploymentType { get; set; } = string.Empty;
    public string? WorkingHours { get; set; }
    public string WorkMode { get; set; } = string.Empty;
    public string? AboutRole { get; set; }
    public string? RequiredSkillsExperience { get; set; }
    public string ContactInfo { get; set; } = string.Empty;
    public string? VacancyClosingDate { get; set; }
    public string? SalaryPackage { get; set; }
    public string? ModifiedBy { get; set; }
}
