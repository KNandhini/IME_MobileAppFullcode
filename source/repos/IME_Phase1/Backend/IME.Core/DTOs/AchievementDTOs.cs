namespace IME.Core.DTOs;

public class AchievementsDTO
{
    public string MemberName { get; set; }
    public string Title { get; set; }
    public string? Description { get; set; }
    public string? AchievementDate { get; set; }
public int AchievementId { get; set; }
    public string? PhotoPath { get; set; }
    public string? MemberPhotoPath { get; set; }   // alias of PhotoPath for frontend
    public string? AttachmentPath { get; set; }     // first attachment URL for list view
    
    public DateTime CreatedDate { get; set; }
}