using IME.Core.DTOs;

namespace IME.Core.Interfaces;

public interface ISupportRepository
{
    Task<List<SupportCategoryDTO>> GetActiveCategoriesAsync();
    Task<List<SupportDTO>> GetByCategoryAsync(int categoryId);
    Task<SupportDetailDTO?> GetByIdAsync(int supportId);
    Task<int> CreateAsync(CreateSupportDTO dto);
    Task<bool> UpdateAsync(int supportId, UpdateSupportDTO dto);
    Task<bool> DeleteAsync(int supportId);
    Task<int> AddAttachmentAsync(AddAttachmentDTO dto);
    Task<SupportAttachmentDTO?> GetAttachmentByIdAsync(int attachmentId);
    Task<bool> DeleteAttachmentAsync(int attachmentId);
}