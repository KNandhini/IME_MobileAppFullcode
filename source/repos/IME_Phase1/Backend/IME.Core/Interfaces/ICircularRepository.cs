using IME.Core.DTOs;
namespace IME.Core.Interfaces;

public interface ICircularRepository
{
    Task<List<CircularDTO>> GetAllCircularsAsync();
    Task<List<CircularDTO>> GetCircularsByClubAsync(int clubId);
    Task<CircularDetailDTO?> GetCircularByIdAsync(int circularId);
    Task<int> CreateCircularAsync(string title, string? description, string? circularNumber, DateTime publishDate, int createdBy, int? clubId = null, string visibility = "All");
    Task UpdateCircularAsync(int circularId, string title, string? description, string? circularNumber, DateTime publishDate, string? visibility = null);
    Task DeleteCircularAsync(int circularId);
    Task<AttachmentDTO> AddCircularAttachmentAsync(int circularId, string fileName, string filePath);
    Task DeleteCircularAttachmentAsync(int attachmentId);
    Task<List<AttachmentDTO>> GetCircularAttachmentsAsync(int circularId);
}