namespace IME.Core.DTOs;

public class FeedMediaDTO
{
    public int    MediaId   { get; set; }
    public string FilePath  { get; set; } = string.Empty;
    public string MediaType { get; set; } = "image"; // "image" | "video"
    public int    SortOrder { get; set; }
}

public class FeedItemDTO
{
    public int               Id          { get; set; }
    public string            Type        { get; set; } = string.Empty; // Post | Activity | News | Circular
    public string            MemberName  { get; set; } = string.Empty;
    public string            Title       { get; set; } = string.Empty;
    public string?           Description { get; set; }
    public bool              HasImage    { get; set; }
    public string?           ImagePath   { get; set; }  // single image (News cover)
    public List<FeedMediaDTO> MediaItems { get; set; } = new(); // multi-media (Posts)
    public DateTime          PostedDate  { get; set; }
    public int               Likes       { get; set; }
    public int               Comments    { get; set; }
}

public class FeedResponseDTO
{
    public List<FeedItemDTO> Items      { get; set; } = new();
    public int               PageNumber { get; set; }
    public int               PageSize   { get; set; }
    public bool              HasMore    { get; set; }
}

public class CreatePostDTO
{
    public string? Content { get; set; }
}
