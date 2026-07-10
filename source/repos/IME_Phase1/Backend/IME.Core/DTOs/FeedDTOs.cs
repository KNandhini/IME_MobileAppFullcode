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
    public int?              MemberId    { get; set; }
    public string            MemberName  { get; set; } = string.Empty;
    public string?           Email       { get; set; }
    public string            Title       { get; set; } = string.Empty;
    public string?           Description { get; set; }
    public bool              HasImage    { get; set; }
    public string?           ImagePath   { get; set; }  // single image (News cover)
    public List<FeedMediaDTO> MediaItems { get; set; } = new(); // multi-media (Posts)
    public DateTime          PostedDate  { get; set; }
    public int               Likes       { get; set; }
    public int               Comments    { get; set; }
    public int? ClubId { get; set; }
    public bool IsSameClub { get; set; }
    public int LikeCount { get; set; }

    public int CommentCount { get; set; }

    public bool IsLikedByViewer { get; set; }
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
public class PostCommentDTO
{
    public int InteractionId { get; set; }
    public int ItemId { get; set; }        
    public string ItemType { get; set; } = "Post"; 
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public string CommentDetails { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
}
public class PostInteraction
{
    public int InteractionId { get; set; }

    public int PostId { get; set; }

    public int MemberId { get; set; }

    public bool IsLike { get; set; }

    public bool IsComment { get; set; }

    public string? CommentDetails { get; set; }

    public DateTime CreatedDate { get; set; }

    public int CreatedBy { get; set; }

    public DateTime? UpdatedDate { get; set; }

    public int? UpdatedBy { get; set; }
}
public class LikeToggleResultDTO
{
    public bool IsLikedByViewer { get; set; }

    public int LikeCount { get; set; }
}
// ?? POST /api/feed/post/{postId}/comment ??????????????
public class AddCommentRequestDTO
{
    public string? CommentDetails { get; set; }
}