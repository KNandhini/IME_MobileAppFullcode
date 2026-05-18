namespace IME.API.Requests;

public class AchievementUpdateRequest
{
    public string MemberName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AchievementDate { get; set; }
    public IFormFile? Photo { get; set; }
    public IFormFile? Attachment { get; set; }
    public int MemberId { get; internal set; }
}