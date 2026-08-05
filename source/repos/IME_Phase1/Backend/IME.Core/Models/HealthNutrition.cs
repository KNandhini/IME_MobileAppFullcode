// HealthNutrition.cs
// Place in: IME.Core/Models/HealthNutrition.cs

namespace IME.Core.Models;

public class HealthNutrition
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string PostedUser { get; set; } = string.Empty;
    public DateTime PostedBy { get; set; }
    public string? Attachment { get; set; }
    public bool Status { get; set; } = true;
    public string? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
