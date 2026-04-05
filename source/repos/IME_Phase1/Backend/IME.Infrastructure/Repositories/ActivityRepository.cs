using System.Data;
using System.Data.SqlClient;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Data;

namespace IME.Infrastructure.Repositories;

public class ActivityRepository : IActivityRepository
{
    private readonly DatabaseContext _dbContext;

    public ActivityRepository(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Activity>> GetAllActivitiesAsync(int pageNumber, int pageSize)
    {
        var activities = new List<Activity>();

        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetAllActivities", connection);

        command.Parameters.AddWithValue("@PageNumber", pageNumber);
        command.Parameters.AddWithValue("@PageSize", pageSize);

        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            activities.Add(new Activity
            {
                ActivityId = reader.GetInt32(reader.GetOrdinal("ActivityId")),
                ActivityName = reader.GetString(reader.GetOrdinal("ActivityName")),
                Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                ActivityDate = reader.IsDBNull(reader.GetOrdinal("ActivityDate")) ? null : reader.GetDateTime(reader.GetOrdinal("ActivityDate")),
                Venue = reader.IsDBNull(reader.GetOrdinal("Venue")) ? null : reader.GetString(reader.GetOrdinal("Venue")),
                Time = reader.IsDBNull(reader.GetOrdinal("Time")) ? null : reader.GetString(reader.GetOrdinal("Time")),
                ChiefGuest = reader.IsDBNull(reader.GetOrdinal("ChiefGuest")) ? null : reader.GetString(reader.GetOrdinal("ChiefGuest")),
                CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate"))
            });
        }

        return activities;
    }

    public async Task<Activity?> GetActivityByIdAsync(int activityId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetActivityById", connection);

        command.Parameters.AddWithValue("@ActivityId", activityId);

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return new Activity
            {
                ActivityId = reader.GetInt32(reader.GetOrdinal("ActivityId")),
                ActivityName = reader.GetString(reader.GetOrdinal("ActivityName")),
                Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                ActivityDate = reader.IsDBNull(reader.GetOrdinal("ActivityDate")) ? null : reader.GetDateTime(reader.GetOrdinal("ActivityDate")),
                Venue = reader.IsDBNull(reader.GetOrdinal("Venue")) ? null : reader.GetString(reader.GetOrdinal("Venue")),
                Time = reader.IsDBNull(reader.GetOrdinal("Time")) ? null : reader.GetString(reader.GetOrdinal("Time")),
                ChiefGuest = reader.IsDBNull(reader.GetOrdinal("ChiefGuest")) ? null : reader.GetString(reader.GetOrdinal("ChiefGuest")),
                CreatedBy = reader.IsDBNull(reader.GetOrdinal("CreatedBy")) ? null : reader.GetInt32(reader.GetOrdinal("CreatedBy")),
                CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate"))
            };
        }

        return null;
    }

    public async Task<int> CreateActivityAsync(Activity activity)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_CreateActivity", connection);

        command.Parameters.AddWithValue("@ActivityName", activity.ActivityName);
        command.Parameters.AddWithValue("@Description", activity.Description ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@ActivityDate", activity.ActivityDate ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Venue", activity.Venue ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Time", activity.Time ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@ChiefGuest", activity.ChiefGuest ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@CreatedBy", activity.CreatedBy ?? (object)DBNull.Value);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<bool> UpdateActivityAsync(Activity activity)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_UpdateActivity", connection);

        command.Parameters.AddWithValue("@ActivityId", activity.ActivityId);
        command.Parameters.AddWithValue("@ActivityName", activity.ActivityName);
        command.Parameters.AddWithValue("@Description", activity.Description ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@ActivityDate", activity.ActivityDate ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Venue", activity.Venue ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Time", activity.Time ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@ChiefGuest", activity.ChiefGuest ?? (object)DBNull.Value);

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;
        }

        return false;
    }

    public async Task<bool> DeleteActivityAsync(int activityId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_DeleteActivity", connection);

        command.Parameters.AddWithValue("@ActivityId", activityId);

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;
        }

        return false;
    }

    public async Task<List<ActivityAttachment>> GetActivityAttachmentsAsync(int activityId)
    {
        var attachments = new List<ActivityAttachment>();

        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetActivityById", connection);

        command.Parameters.AddWithValue("@ActivityId", activityId);

        using var reader = await command.ExecuteReaderAsync();

        // Skip first result set (activity details)
        await reader.NextResultAsync();

        // Read attachments
        while (await reader.ReadAsync())
        {
            attachments.Add(new ActivityAttachment
            {
                AttachmentId = reader.GetInt32(reader.GetOrdinal("AttachmentId")),
                ActivityId = reader.GetInt32(reader.GetOrdinal("ActivityId")),
                FileName = reader.IsDBNull(reader.GetOrdinal("FileName")) ? null : reader.GetString(reader.GetOrdinal("FileName")),
                FilePath = reader.IsDBNull(reader.GetOrdinal("FilePath")) ? null : reader.GetString(reader.GetOrdinal("FilePath")),
                UploadedDate = reader.GetDateTime(reader.GetOrdinal("UploadedDate"))
            });
        }

        return attachments;
    }
}
