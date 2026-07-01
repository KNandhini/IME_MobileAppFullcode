namespace IME.Core.DTOs;

public class MagazineDTO
{
    public int MagazineId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? IssueNumber { get; set; }
    public DateTime PublishedDate { get; set; }
    public string? AuthorName { get; set; }
    public string? Category { get; set; }
    public string? AttachmentPath { get; set; }   // first attachment URL for list view
    public int CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }
}

public class MagazineDetailDTO
{
    public int MagazineId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? IssueNumber { get; set; }
    public DateTime PublishedDate { get; set; }
    public string? AuthorName { get; set; }
    public string? Category { get; set; }
    public string? AttachmentPath { get; set; }   // first attachment URL for detail view
    public int CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }
    public List<MagazineAttachmentDTO> Attachments { get; set; } = new();
}

public class MagazineAttachmentDTO
{
    public int AttachmentId { get; set; }
    public int MagazineId { get; set; }
    public string? FileName { get; set; }
    public string? FilePath { get; set; }
    public long? FileSize { get; set; }
    public string? FileType { get; set; }
    public int? UploadedBy { get; set; }
    public DateTime UploadedDate { get; set; }
}
public class ForumDiscussionDto
{
    public int DiscussionId { get; set; }
    public int MagazineId { get; set; }
    public int MemberId { get; set; }
    public string MemberName { get; set; }
    public string Comment { get; set; }
    public DateTime CreatedDate { get; set; }
}
// Reuse the existing AttachmentDTO from Achievements — same shape, no need to duplicate:
// public class AttachmentDTO { public int AttachmentId; public string? FileName; public string? FilePath; public DateTime UploadedDate; }