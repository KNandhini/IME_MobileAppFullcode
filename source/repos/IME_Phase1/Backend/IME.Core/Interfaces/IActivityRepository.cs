using IME.Core.Models;

namespace IME.Core.Interfaces;

public interface IActivityRepository
{
    Task<List<Activity>> GetAllActivitiesAsync(int pageNumber, int pageSize);
    Task<Activity?> GetActivityByIdAsync(int activityId);
    Task<int> CreateActivityAsync(Activity activity);
    Task<bool> UpdateActivityAsync(Activity activity);
    Task<bool> DeleteActivityAsync(int activityId);
    Task<List<ActivityAttachment>> GetActivityAttachmentsAsync(int activityId);
}
