// HealthNutritionDTO.cs
// Place in: IME.Core/DTOs/HealthNutritionDTO.cs

namespace IME.Core.DTOs;

public class HealthNutritionDTO
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string PostedUser { get; set; } = string.Empty;
    public DateTime PostedBy { get; set; }

    public string? AttachmentPath { get; set; }   // full URL, built by controller
    public string? AttachmentType { get; set; }   // "image" | "audio" | "video" | "pdf" | "other"
    public string? AttachmentFileName { get; set; }

    public bool Status { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedDate { get; set; }
}

// Same shape today — kept separate so detail-only fields can be added later
// (e.g. related records, view count) without touching the list DTO.
public class HealthNutritionDetailDTO : HealthNutritionDTO
{
}

// Paginated envelope for GET /api/healthnutrition — matches what
// healthNutritionService.js / HealthNutritionScreen.js expect:
// data.items, data.pageNumber, data.totalPages.
public class HealthNutritionListDTO
{
    public List<HealthNutritionDTO> Items { get; set; } = new();
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
}