using IME.Core.DTOs;
using IME.Core.Models;

namespace IME.Core.Interfaces;

public interface IMagazineRepository
{
    Task<List<MagazineDTO>> GetAllMagazinesAsync();
    Task<MagazineDetailDTO?> GetMagazineByIdAsync(int magazineId);
    Task<int> CreateMagazineAsync(Magazine magazine);
    Task<bool> UpdateMagazineAsync(Magazine magazine);
    Task<bool> DeleteMagazineAsync(int magazineId);

    Task<List<MagazineAttachmentDTO>> GetMagazineAttachmentsAsync(int magazineId);
    Task<MagazineAttachmentDTO> AddMagazineAttachmentAsync(int magazineId, string fileName, string filePath, int uploadedBy);
    Task<bool> DeleteMagazineAttachmentAsync(int attachmentId);
    Task<List<ForumDiscussionDto>> GetForumDiscussionAsync(int magazineId);

    Task<ForumDiscussionDto> AddForumDiscussionAsync(
        int magazineId, int memberId, string memberName, string comment);
}