namespace IME.Core.Models;

public class Activity
{
    public int ActivityId { get; set; }
    public string ActivityName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? ActivityDate { get; set; }
    public string? Venue { get; set; }
    public string? Time { get; set; }
    public string? ChiefGuest { get; set; }
    public string? Coordinator { get; set; }           // ? ADD
    public string? Status { get; set; }                // ? ADD
    public DateTime? RegistrationDeadline { get; set; } // ? ADD
    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
}

public class ActivityAttachment
{
    public int AttachmentId { get; set; }
    public int ActivityId { get; set; }
    public string? FileName { get; set; }
    public string? FilePath { get; set; }
    public long? FileSize { get; set; }
    public DateTime UploadedDate { get; set; }
}
