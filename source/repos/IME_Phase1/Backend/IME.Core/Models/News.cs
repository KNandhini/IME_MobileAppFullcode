namespace IME.Core.Models;

public class News
{
    public int NewsId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public string? FullContent { get; set; }
    public string? CoverImagePath { get; set; }
    public DateTime PublishDate { get; set; }
    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
}

public class NewsAttachment
{
    public int AttachmentId { get; set; }
    public int NewsId { get; set; }
    public string? FileName { get; set; }
    public string? FilePath { get; set; }
    public DateTime UploadedDate { get; set; }
}
