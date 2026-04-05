namespace IME.Core.DTOs;

public class ActivityDTO
{
    public int ActivityId { get; set; }
    public string ActivityName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? ActivityDate { get; set; }
    public string? Venue { get; set; }
    public string? Time { get; set; }
    public string? ChiefGuest { get; set; }
    public DateTime CreatedDate { get; set; }
    public int AttachmentCount { get; set; }
}

public class CreateActivityDTO
{
    public string ActivityName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? ActivityDate { get; set; }
    public string? Venue { get; set; }
    public string? Time { get; set; }
    public string? ChiefGuest { get; set; }
}

public class UpdateActivityDTO
{
    public int ActivityId { get; set; }
    public string ActivityName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? ActivityDate { get; set; }
    public string? Venue { get; set; }
    public string? Time { get; set; }
    public string? ChiefGuest { get; set; }
}
