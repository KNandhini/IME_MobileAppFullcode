using IME.Core.DTOs;
using IME.Core.Models;

namespace IME.Core.Interfaces;

public interface IActivityRepository
{
    Task<List<Activity>> GetAllActivitiesAsync(int pageNumber, int pageSize);
    Task<Activity?> GetActivityByIdAsync(int activityId);
    Task<int> CreateActivityAsync(Activity activity);
    Task<bool> UpdateActivityAsync(Activity activity);
    Task<bool> DeleteActivityAsync(int activityId);
    Task<List<ActivityAttachmentDTO>> GetActivityAttachmentsAsync(int activityId);
    Task<ActivityAttachmentDTO> AddActivityAttachmentAsync(int activityId, string fileName, string filePath, long fileSize, string fileType, int uploadedBy);
    Task<(string? FilePath, bool Deleted)> DeleteActivityAttachmentAsync(int attachmentId);
}
