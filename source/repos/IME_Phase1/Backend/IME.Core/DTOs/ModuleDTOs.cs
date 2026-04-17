namespace IME.Core.DTOs;


public class SupportAttachmentDTO
{
    public int AttachmentId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? FilePath { get; set; }
    public DateTime UploadedDate { get; set; }
    public string MediaType { get; set; } = "document";
    public int SortOrder { get; set; }
}

public class SupportCategoryDTO
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class SupportDTO
{
    public int SupportId { get; set; }
    public string? PhotoPath { get; set; }
    public string? PersonName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? SupportDate { get; set; }
    public decimal? Amount { get; set; }
    public string? CompanyOrIndividual { get; set; }
    public string? CompanyName { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
}

public class SupportDetailDTO
{
    public int SupportId { get; set; }
    public int CategoryId { get; set; }
    public string? PhotoPath { get; set; }
    public string? PersonName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? SupportDate { get; set; }
    public decimal? Amount { get; set; }
    public string? CompanyOrIndividual { get; set; }
    public string? CompanyName { get; set; }

    public string CategoryName { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public List<SupportAttachmentDTO> Attachments { get; set; } = new();
}

public class CreateSupportDTO
{
    public int CategoryId { get; set; }
    public string? PhotoPath { get; set; }
    public string? PersonName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? SupportDate { get; set; }
    public string? CompanyOrIndividual { get; set; }
    public string? CompanyName { get; set; }
    public decimal? Amount { get; set; }
    public int CreatedBy { get; set; }
}

public class UpdateSupportDTO
{
    public int CategoryId { get; set; }
    public string? PhotoPath { get; set; }
    public string? PersonName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? SupportDate { get; set; }
    public string? CompanyOrIndividual { get; set; }
    public string? CompanyName { get; set; }
    public decimal? Amount { get; set; }
}

public class AddAttachmentDTO
{
    public int SupportId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string MediaType { get; set; } = "document";   // image | video | document
    public int SortOrder { get; set; } = 1;
}

// Circular DTOs
public class CircularDTO
{
    public int CircularId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CircularNumber { get; set; }
    public DateTime PublishDate { get; set; }
    public int AttachmentCount { get; set; }
}

public class CircularDetailDTO
{
    public int CircularId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CircularNumber { get; set; }
    public DateTime PublishDate { get; set; }
    public DateTime CreatedDate { get; set; }
    public List<AttachmentDTO> Attachments { get; set; } = new();
}

public class CreateCircularDTO
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CircularNumber { get; set; }
    public DateTime PublishDate { get; set; }
    public DateTime? CreatedDate { get; set; }
}

public class UpdateCircularDTO
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CircularNumber { get; set; }
    public DateTime PublishDate { get; set; }
    public DateTime? CreatedDate { get; set; }
}

// Achievement DTOs
public class AchievementDTO
{
    public int AchievementId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public string? PhotoPath { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? AchievementDate { get; set; }
    public DateTime CreatedDate { get; set; }
}

public class AchievementDetailDTO
{
    public int AchievementId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public string? PhotoPath { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? AchievementDate { get; set; }
    public DateTime CreatedDate { get; set; }
    public List<AttachmentDTO> Attachments { get; set; } = new();
}

public class CreateAchievementDTO
{
    public string MemberName { get; set; } = string.Empty;
    public string? PhotoPath { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? AchievementDate { get; set; }
}

public class UpdateAchievementDTO
{
    public string MemberName { get; set; } = string.Empty;
    public string? PhotoPath { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? AchievementDate { get; set; }
}

// Organisation DTOs
public class OrganisationMemberDTO
{
    public int OrgMemberId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? PhotoPath { get; set; }
    public string? Designation { get; set; }
    public string? Position { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

public class CreateOrganisationMemberDTO
{
    public string Name { get; set; } = string.Empty;
    public string? PhotoPath { get; set; }
    public string? Designation { get; set; }
    public string? Position { get; set; }
    public int DisplayOrder { get; set; }
}

public class UpdateOrganisationMemberDTO
{
    public string Name { get; set; } = string.Empty;
    public string? PhotoPath { get; set; }
    public string? Designation { get; set; }
    public string? Position { get; set; }
    public int DisplayOrder { get; set; }
}

// Content Page DTOs
public class ContentPageDTO
{
    public int PageId { get; set; }
    public string PageKey { get; set; } = string.Empty;
    public string PageTitle { get; set; } = string.Empty;
    public string? Content { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
}

public class UpdateContentDTO
{
    public string PageTitle { get; set; } = string.Empty;
    public string? Content { get; set; }
}
