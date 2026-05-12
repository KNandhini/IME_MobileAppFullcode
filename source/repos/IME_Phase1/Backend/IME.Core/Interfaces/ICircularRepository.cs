using IME.Core.DTOs;
namespace IME.Core.Interfaces;

public interface ICircularRepository
{
    Task<List<CircularDTO>> GetAllCircularsAsync();
    Task<CircularDetailDTO?> GetCircularByIdAsync(int circularId);
    Task<int> CreateCircularAsync(string title, string? description, string? circularNumber, DateTime publishDate, int createdBy);
    Task UpdateCircularAsync(int circularId, string title, string? description, string? circularNumber, DateTime publishDate);
    Task DeleteCircularAsync(int circularId);
    Task<AttachmentDTO> AddCircularAttachmentAsync(int circularId, string fileName, string filePath);
    Task DeleteCircularAttachmentAsync(int attachmentId);
    Task<List<AttachmentDTO>> GetCircularAttachmentsAsync(int circularId);
}