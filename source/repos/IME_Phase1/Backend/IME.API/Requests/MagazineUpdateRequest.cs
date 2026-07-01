// MagazineUpdateRequest.cs
// Place in: IME.API/Requests/MagazineUpdateRequest.cs

namespace IME.API.Requests;

public class MagazineUpdateRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? IssueNumber { get; set; }
    public string PublishedDate { get; set; } = string.Empty;
    public string? AuthorName { get; set; }
    public string? Category { get; set; }
    public List<IFormFile>? Files { get; set; }  // optional new attachments to add
}