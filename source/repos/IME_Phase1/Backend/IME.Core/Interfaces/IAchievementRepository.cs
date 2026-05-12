// IAchievementRepository.cs
// Place in: IME.Core/Interfaces/IAchievementRepository.cs

using IME.Core.DTOs;
using IME.Core.Models;

namespace IME.Core.Interfaces;

public interface IAchievementRepository
{
    Task<List<AchievementDTO>> GetAllAchievementsAsync();
    Task<AchievementDetailDTO?> GetAchievementByIdAsync(int achievementId);
    Task<int> CreateAchievementAsync(Achievement achievement);
    Task<bool> UpdateAchievementAsync(Achievement achievement);
    Task<bool> DeleteAchievementAsync(int achievementId);
    Task<List<AttachmentDTO>> GetAchievementAttachmentsAsync(int achievementId);

    // ← uploadedBy added — fixes DBNull.Value crash
    Task<AttachmentDTO> AddAchievementAttachmentAsync(
                                        int achievementId,
                                        string fileName,
                                        string filePath,
                                        int uploadedBy);

    Task<bool> DeleteAchievementAttachmentAsync(int attachmentId);
}