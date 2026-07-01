namespace IME.Core.Models;

public class Magazine
{
    public int MagazineId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? IssueNumber { get; set; }
    public DateTime PublishedDate { get; set; }
    public string? AuthorName { get; set; }
    public string? Category { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }
}