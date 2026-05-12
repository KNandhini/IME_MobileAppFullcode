using IME.Core.DTOs;

namespace IME.Core.Interfaces;

public interface INewsRepository
{
    Task<List<NewsDTO>> GetAllNewsAsync(int pageNumber, int pageSize);
    Task<NewsDetailDTO?> GetNewsByIdAsync(int newsId);
    Task<int> CreateNewsAsync(string title, string? shortDescription, string? fullContent, string? coverImagePath, int createdBy, DateTime? createdDate);
    Task<bool> UpdateNewsAsync(int newsId, string title, string? shortDescription, string? fullContent, string? coverImagePath, DateTime? updatedDate);
    Task<bool> DeleteNewsAsync(int newsId);
    Task<AttachmentDTO> AddNewsAttachmentAsync(int newsId, string fileName, string filePath);
    Task DeleteNewsAttachmentAsync(int attachmentId);
    Task<List<AttachmentDTO>> GetNewsAttachmentsAsync(int newsId);
}