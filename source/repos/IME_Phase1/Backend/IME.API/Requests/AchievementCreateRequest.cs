namespace IME.API.Requests;

public class AchievementCreateRequest
{
    public string MemberName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AchievementDate { get; set; }
    public IFormFile? Photo { get; set; }
    public IFormFile? Attachment { get; set; }
}