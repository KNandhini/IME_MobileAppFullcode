using System.Data.SqlClient;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Data;

namespace IME.Infrastructure.Repositories;

public class ActivityRepository(DatabaseContext dbContext) : IActivityRepository
{
    private readonly DatabaseContext _dbContext = dbContext;

    public async Task<List<Activity>> GetAllActivitiesAsync(int pageNumber, int pageSize)
    {
        var activities = new List<Activity>();

        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetAllActivities", connection);
        command.Parameters.AddWithValue("@PageNumber", pageNumber);
        command.Parameters.AddWithValue("@PageSize",   pageSize);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            activities.Add(MapActivity(reader));
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
            return MapActivity(reader, includeCreatedBy: true);

        return null;
    }

    public async Task<int> CreateActivityAsync(Activity activity)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command    = _dbContext.CreateStoredProcCommand("sp_CreateActivity", connection);
        command.Parameters.AddWithValue("@ActivityName", activity.ActivityName);
        command.Parameters.AddWithValue("@Description",  (object?)activity.Description  ?? DBNull.Value);
        command.Parameters.AddWithValue("@ActivityDate", (object?)activity.ActivityDate  ?? DBNull.Value);
        command.Parameters.AddWithValue("@Venue",        (object?)activity.Venue         ?? DBNull.Value);
        command.Parameters.AddWithValue("@Time",         (object?)activity.Time          ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChiefGuest",   (object?)activity.ChiefGuest    ?? DBNull.Value);
        command.Parameters.AddWithValue("@CreatedBy",    (object?)activity.CreatedBy     ?? DBNull.Value);
        command.Parameters.AddWithValue("@CreatedDate",  activity.CreatedDate);
        command.Parameters.AddWithValue("@Coordinator", (object?)activity.Coordinator ?? DBNull.Value); // ← ADD
        command.Parameters.AddWithValue("@Status", (object?)activity.Status ?? "Upcoming");   // ← ADD
        command.Parameters.AddWithValue("@RegistrationDeadline", (object?)activity.RegistrationDeadline ?? DBNull.Value); // ← ADD

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<bool> UpdateActivityAsync(Activity activity)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command    = _dbContext.CreateStoredProcCommand("sp_UpdateActivity", connection);
        command.Parameters.AddWithValue("@ActivityId",   activity.ActivityId);
        command.Parameters.AddWithValue("@ActivityName", activity.ActivityName);
        command.Parameters.AddWithValue("@Description",  (object?)activity.Description  ?? DBNull.Value);
        command.Parameters.AddWithValue("@ActivityDate", (object?)activity.ActivityDate  ?? DBNull.Value);
        command.Parameters.AddWithValue("@Venue",        (object?)activity.Venue         ?? DBNull.Value);
        command.Parameters.AddWithValue("@Time",         (object?)activity.Time          ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChiefGuest",   (object?)activity.ChiefGuest    ?? DBNull.Value);
        command.Parameters.AddWithValue("@UpdatedDate",  (object?)activity.UpdatedDate   ?? DateTime.UtcNow);
        command.Parameters.AddWithValue("@Coordinator", (object?)activity.Coordinator ?? DBNull.Value); // ← ADD
        command.Parameters.AddWithValue("@Status", (object?)activity.Status ?? DBNull.Value); // ← ADD
        command.Parameters.AddWithValue("@RegistrationDeadline", (object?)activity.RegistrationDeadline ?? DBNull.Value); // ← ADD
        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;

        return false;
    }

    public async Task<bool> DeleteActivityAsync(int activityId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command    = _dbContext.CreateStoredProcCommand("sp_DeleteActivity", connection);
        command.Parameters.AddWithValue("@ActivityId", activityId);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;

        return false;
    }

    // ── Attachments ───────────────────────────────────────────

    public async Task<List<ActivityAttachmentDTO>> GetActivityAttachmentsAsync(int activityId)
    {
        var list = new List<ActivityAttachmentDTO>();

        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command    = _dbContext.CreateStoredProcCommand("sp_GetActivityAttachments", connection);
        command.Parameters.AddWithValue("@ActivityId", activityId);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapAttachment(reader));
        }

        return list;
    }

    public async Task<ActivityAttachmentDTO> AddActivityAttachmentAsync(
        int activityId, string fileName, string filePath, long fileSize, string fileType, int uploadedBy)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command    = _dbContext.CreateStoredProcCommand("sp_AddActivityAttachment", connection);
        command.Parameters.AddWithValue("@ActivityId",  activityId);
        command.Parameters.AddWithValue("@FileName",    fileName);
        command.Parameters.AddWithValue("@FilePath",    filePath);
        command.Parameters.AddWithValue("@FileSize",    fileSize);
        command.Parameters.AddWithValue("@FileType",    fileType);
        command.Parameters.AddWithValue("@UploadedBy",  uploadedBy);

        var result       = await command.ExecuteScalarAsync();
        var attachmentId = Convert.ToInt32(result ?? 0);

        return new ActivityAttachmentDTO
        {
            AttachmentId   = attachmentId,
            ActivityId     = activityId,
            FileName       = fileName,
            FilePath       = filePath,
            FileSize       = fileSize,
            FileType       = fileType,
            UploadedBy     = uploadedBy,
            UploadedByName = string.Empty,
            UploadedDate   = DateTime.UtcNow,
        };
    }

    public async Task<(string? FilePath, bool Deleted)> DeleteActivityAttachmentAsync(int attachmentId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command    = _dbContext.CreateStoredProcCommand("sp_DeleteActivityAttachment", connection);
        command.Parameters.AddWithValue("@AttachmentId", attachmentId);

        // SP returns FilePath in first result set, then RowsAffected in second
        string? filePath = null;
        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            filePath = reader.IsDBNull(0) ? null : reader.GetString(0);

        bool deleted = false;
        if (await reader.NextResultAsync() && await reader.ReadAsync())
            deleted = reader.GetInt32(0) > 0;

        return (filePath, deleted);
    }

    // ── Helpers ───────────────────────────────────────────────

    private static Activity MapActivity(SqlDataReader r, bool includeCreatedBy = false)
    {
        return new Activity
        {
            ActivityId   = r.GetInt32(r.GetOrdinal("ActivityId")),
            ActivityName = r.GetString(r.GetOrdinal("ActivityName")),
            Description  = r.IsDBNull(r.GetOrdinal("Description"))  ? null : r.GetString(r.GetOrdinal("Description")),
            ActivityDate = r.IsDBNull(r.GetOrdinal("ActivityDate"))  ? null : r.GetDateTime(r.GetOrdinal("ActivityDate")),
            Venue        = r.IsDBNull(r.GetOrdinal("Venue"))         ? null : r.GetString(r.GetOrdinal("Venue")),
            Time         = r.IsDBNull(r.GetOrdinal("Time"))          ? null : r.GetString(r.GetOrdinal("Time")),
            ChiefGuest   = r.IsDBNull(r.GetOrdinal("ChiefGuest"))    ? null : r.GetString(r.GetOrdinal("ChiefGuest")),
            CreatedBy    = includeCreatedBy && !r.IsDBNull(r.GetOrdinal("CreatedBy"))
                               ? r.GetInt32(r.GetOrdinal("CreatedBy")) : null,
            CreatedDate  = r.GetDateTime(r.GetOrdinal("CreatedDate")),
        };
    }

    private static ActivityAttachmentDTO MapAttachment(SqlDataReader r)
    {
        return new ActivityAttachmentDTO
        {
            AttachmentId   = r.GetInt32(r.GetOrdinal("AttachmentId")),
            ActivityId     = r.GetInt32(r.GetOrdinal("ActivityId")),
            FileName       = r.GetString(r.GetOrdinal("FileName")),
            FilePath       = r.GetString(r.GetOrdinal("FilePath")),
            FileSize       = r.IsDBNull(r.GetOrdinal("FileSize"))    ? null : r.GetInt64(r.GetOrdinal("FileSize")),
            FileType       = r.IsDBNull(r.GetOrdinal("FileType"))    ? null : r.GetString(r.GetOrdinal("FileType")),
            UploadedBy     = r.IsDBNull(r.GetOrdinal("UploadedBy"))  ? null : r.GetInt32(r.GetOrdinal("UploadedBy")),
            UploadedByName = r.IsDBNull(r.GetOrdinal("UploadedByName")) ? string.Empty : r.GetString(r.GetOrdinal("UploadedByName")),
            UploadedDate   = r.GetDateTime(r.GetOrdinal("UploadedDate")),
        };
    }
}
