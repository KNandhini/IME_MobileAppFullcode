// MagazineCreateRequest.cs
// Place in: IME.API/Requests/MagazineCreateRequest.cs

namespace IME.API.Requests;

public class MagazineCreateRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? IssueNumber { get; set; }
    public string PublishedDate { get; set; } = string.Empty;
    public string? AuthorName { get; set; }
    public string? Category { get; set; }
    public List<IFormFile>? Files { get; set; }
}
public class ForumDiscussionRequest
{
    public int MagazineId { get; set; }
    public int MemberId { get; set; }
    public string MemberName { get; set; }
    public string Comment { get; set; }
}