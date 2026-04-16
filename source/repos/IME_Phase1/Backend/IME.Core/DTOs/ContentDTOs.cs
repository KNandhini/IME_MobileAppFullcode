namespace IME.Core.DTOs;

// News DTOs
public class NewsDTO
{
    public int NewsId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public string? CoverImagePath { get; set; }
    public DateTime PublishDate { get; set; }
    public int AttachmentCount { get; set; }
}

public class NewsDetailDTO
{
    public int NewsId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public string? FullContent { get; set; }
    public string? CoverImagePath { get; set; }
    public DateTime PublishDate { get; set; }
    public List<AttachmentDTO> Attachments { get; set; } = new();
}

public class CreateNewsDTO
{
    public string Title { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public string? FullContent { get; set; }
    public string? CoverImagePath { get; set; }
    public DateTime? CreatedDate { get; set; }
}

public class UpdateNewsDTO
{
    public string Title { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public string? FullContent { get; set; }
    public string? CoverImagePath { get; set; }
    public DateTime? CreatedDate { get; set; }
}

// Media DTOs
public class MediaDTO
{
    public int MediaId { get; set; }
    public string? Title { get; set; }
    public string? MediaType { get; set; }
    public string? Description { get; set; }
    public string? FilePath { get; set; }
    public string? ThumbnailPath { get; set; }
    public DateTime? EventDate { get; set; }
    public DateTime CreatedDate { get; set; }
}

public class MediaDetailDTO
{
    public int MediaId { get; set; }
    public string? Title { get; set; }
    public string? MediaType { get; set; }
    public string? Description { get; set; }
    public string? FilePath { get; set; }
    public string? ThumbnailPath { get; set; }
    public DateTime? EventDate { get; set; }
    public List<AttachmentDTO> Attachments { get; set; } = new();
}

public class CreateMediaDTO
{
    public string? Title { get; set; }
    public string? MediaType { get; set; }
    public string? Description { get; set; }
    public string? FilePath { get; set; }
    public string? ThumbnailPath { get; set; }
    public DateTime? EventDate { get; set; }
}

// Podcast DTOs
public class PodcastDTO
{
    public int PodcastId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Speaker { get; set; }
    public string? Description { get; set; }
    public string? MediaFilePath { get; set; }
    public string? MediaLink { get; set; }
    public string? Duration { get; set; }
    public DateTime PublishDate { get; set; }
}

public class PodcastDetailDTO
{
    public int PodcastId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Speaker { get; set; }
    public string? Description { get; set; }
    public string? MediaFilePath { get; set; }
    public string? MediaLink { get; set; }
    public string? Duration { get; set; }
    public DateTime PublishDate { get; set; }
    public List<AttachmentDTO> Attachments { get; set; } = new();
}

public class CreatePodcastDTO
{
    public string Title { get; set; } = string.Empty;
    public string? Speaker { get; set; }
    public string? Description { get; set; }
    public string? MediaFilePath { get; set; }
    public string? MediaLink { get; set; }
    public string? Duration { get; set; }
}

public class UpdatePodcastDTO
{
    public string Title { get; set; } = string.Empty;
    public string? Speaker { get; set; }
    public string? Description { get; set; }
    public string? MediaFilePath { get; set; }
    public string? MediaLink { get; set; }
    public string? Duration { get; set; }
}

// Common Attachment DTO
public class AttachmentDTO
{
    public int AttachmentId { get; set; }
    public string? FileName { get; set; }
    public string? FilePath { get; set; }
    public DateTime UploadedDate { get; set; }
}
