// HealthNutritionRequests.cs
// Place in: IME.API/Requests/HealthNutritionRequests.cs

namespace IME.API.Requests;

public class HealthNutritionCreateRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string PostedUser { get; set; } = string.Empty;
    public string PostedBy { get; set; } = string.Empty;   // yyyy-MM-dd, parsed in controller
    public IFormFile? Attachment { get; set; }              // required — validated in controller
    public bool Status { get; set; } = true;
}

public class HealthNutritionUpdateRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string PostedUser { get; set; } = string.Empty;
    public string PostedBy { get; set; } = string.Empty;
    public IFormFile? Attachment { get; set; }              // optional — omit to keep existing file
    public bool Status { get; set; } = true;
}
