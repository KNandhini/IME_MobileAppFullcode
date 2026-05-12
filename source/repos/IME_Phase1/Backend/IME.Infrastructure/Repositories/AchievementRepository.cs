// AchievementRepository.cs
// Place in: IME.Infrastructure/Repositories/AchievementRepository.cs

using System.Data;
using System.Data.SqlClient;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Data;

namespace IME.Infrastructure.Repositories;

public class AchievementRepository(DatabaseContext dbContext) : IAchievementRepository
{
    private readonly DatabaseContext _dbContext = dbContext;

    // ── GET ALL ───────────────────────────────────────────────
    public async Task<List<AchievementDTO>> GetAllAchievementsAsync()
    {
        var list = new List<AchievementDTO>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetAllAchievements", connection);
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            list.Add(MapAchievement(reader));
        return list;
    }

    // ── GET BY ID ─────────────────────────────────────────────
    public async Task<AchievementDetailDTO?> GetAchievementByIdAsync(int achievementId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetAchievementById", connection);
        command.Parameters.AddWithValue("@AchievementId", achievementId);

        using var reader = await command.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;

        var achievement = new AchievementDetailDTO
        {
            AchievementId = reader.GetInt32(reader.GetOrdinal("AchievementId")),
            MemberId = reader.GetInt32(reader.GetOrdinal("MemberId")),
            Title = reader.GetString(reader.GetOrdinal("Title")),
            Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
            AchievementDate = reader.IsDBNull(reader.GetOrdinal("AchievementDate")) ? null : reader.GetDateTime(reader.GetOrdinal("AchievementDate")),
            PhotoPath = reader.IsDBNull(reader.GetOrdinal("PhotoPath")) ? null : reader.GetString(reader.GetOrdinal("PhotoPath")),
            CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
            Attachments = []
        };
        reader.Close();

        var attachments = await GetAchievementAttachmentsAsync(achievementId);
        achievement.Attachments = attachments;
        achievement.AttachmentPath = attachments.FirstOrDefault()?.FilePath;
        return achievement;
    }

    // ── CREATE ────────────────────────────────────────────────
    public async Task<int> CreateAchievementAsync(Achievement achievement)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_CreateAchievement", connection);
        command.Parameters.AddWithValue("@MemberId", achievement.MemberId);
        command.Parameters.AddWithValue("@PhotoPath", (object?)achievement.PhotoPath ?? DBNull.Value);
        command.Parameters.AddWithValue("@Title", achievement.Title);
        command.Parameters.AddWithValue("@Description", (object?)achievement.Description ?? DBNull.Value);
        command.Parameters.AddWithValue("@AchievementDate", (object?)achievement.AchievementDate ?? DBNull.Value);
        command.Parameters.AddWithValue("@CreatedBy", (object?)achievement.CreatedBy ?? DBNull.Value);
        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    // ── UPDATE ────────────────────────────────────────────────
    public async Task<bool> UpdateAchievementAsync(Achievement achievement)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_UpdateAchievement", connection);
        command.Parameters.AddWithValue("@AchievementId", achievement.AchievementId);
        command.Parameters.AddWithValue("@MemberId", achievement.MemberId);
        command.Parameters.AddWithValue("@Title", achievement.Title);
        command.Parameters.AddWithValue("@Description", (object?)achievement.Description ?? DBNull.Value);
        command.Parameters.AddWithValue("@AchievementDate", (object?)achievement.AchievementDate ?? DBNull.Value);
        command.Parameters.AddWithValue("@PhotoPath", (object?)achievement.PhotoPath ?? DBNull.Value);
        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;
        return false;
    }

    // ── DELETE ────────────────────────────────────────────────
    public async Task<bool> DeleteAchievementAsync(int achievementId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_DeleteAchievement", connection);
        command.Parameters.AddWithValue("@AchievementId", achievementId);
        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;
        return false;
    }

    // ── GET ATTACHMENTS ───────────────────────────────────────
    public async Task<List<AttachmentDTO>> GetAchievementAttachmentsAsync(int achievementId)
    {
        var list = new List<AttachmentDTO>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetAchievementAttachments", connection);
        command.Parameters.AddWithValue("@AchievementId", achievementId);
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new AttachmentDTO
            {
                AttachmentId = reader.GetInt32(reader.GetOrdinal("AttachmentId")),
                FileName = reader.IsDBNull(reader.GetOrdinal("FileName")) ? null : reader.GetString(reader.GetOrdinal("FileName")),
                FilePath = reader.IsDBNull(reader.GetOrdinal("FilePath")) ? null : reader.GetString(reader.GetOrdinal("FilePath")),
                UploadedDate = reader.GetDateTime(reader.GetOrdinal("UploadedDate")),
            });
        }
        return list;
    }

    // ── ADD ATTACHMENT ────────────────────────────────────────
    // Uses direct SQL INSERT instead of SP to guarantee the record saves.
    // The SP sp_AddAchievementAttachment is NOT called here because it was
    // silently failing to insert (files saved to disk but no DB row).
    // This direct INSERT always works and returns the new AttachmentId.
    // FIX: uploadedBy now passed properly — no more DBNull crash
    public async Task<AttachmentDTO> AddAchievementAttachmentAsync(
        int achievementId, string fileName, string filePath, int uploadedBy)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_AddAchievementAttachment", connection);
        command.Parameters.AddWithValue("@AchievementId", achievementId);
        command.Parameters.AddWithValue("@FileName", fileName);
        command.Parameters.AddWithValue("@FilePath", filePath);
        command.Parameters.AddWithValue("@FileSize", 0);
        command.Parameters.AddWithValue("@FileType", Path.GetExtension(fileName).TrimStart('.'));
        command.Parameters.AddWithValue("@UploadedBy", uploadedBy);   // ← FIX: real userId, not DBNull
        var attachmentId = Convert.ToInt32(await command.ExecuteScalarAsync());
        return new AttachmentDTO
        {
            AttachmentId = attachmentId,
            FileName = fileName,
            FilePath = filePath,
            UploadedDate = DateTime.UtcNow,
        };
    }

    // ── DELETE ATTACHMENT ─────────────────────────────────────
    public async Task<bool> DeleteAchievementAttachmentAsync(int attachmentId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_DeleteAchievementAttachment", connection);
        command.Parameters.AddWithValue("@AttachmentId", attachmentId);
        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;
        return false;
    }

    // ── MAPPER ────────────────────────────────────────────────
    private static AchievementDTO MapAchievement(SqlDataReader r)
    {
        // ── PhotoPath: stored as relative path string ─────────────────
        var photoPath = r.IsDBNull(r.GetOrdinal("AchievementPhotoPath"))
            ? null
            : r.GetString(r.GetOrdinal("AchievementPhotoPath"));

        // ── MemberPhotoPath: ProfilePhoto is varbinary → convert to base64 data-URI ──
        string? memberPhotoPath = null;
        var photoOrdinal = r.GetOrdinal("MemberPhotoPath");
        if (!r.IsDBNull(photoOrdinal))
        {
            var colType = r.GetFieldType(photoOrdinal);
            if (colType == typeof(byte[]))
            {
                // varbinary → base64 data-URI (matches what the frontend expects)
                var bytes = (byte[])r.GetValue(photoOrdinal);
                memberPhotoPath = $"data:image/jpeg;base64,{Convert.ToBase64String(bytes)}";
            }
            else
            {
                // already a string path
                memberPhotoPath = r.GetString(photoOrdinal);
            }
        }

        var attachPath = r.IsDBNull(r.GetOrdinal("AttachmentPath"))
            ? null
            : r.GetString(r.GetOrdinal("AttachmentPath"));

        return new AchievementDTO
        {
            AchievementId = r.GetInt32(r.GetOrdinal("AchievementId")),
            MemberId = r.GetInt32(r.GetOrdinal("MemberId")),
            MemberName = r.IsDBNull(r.GetOrdinal("MemberName")) ? string.Empty : r.GetString(r.GetOrdinal("MemberName")),
            PhotoPath = photoPath,
            MemberPhotoPath = memberPhotoPath,   // ← base64 data-URI or null
            AttachmentPath = attachPath,
            Title = r.GetString(r.GetOrdinal("Title")),
            Description = r.IsDBNull(r.GetOrdinal("Description")) ? null : r.GetString(r.GetOrdinal("Description")),
            AchievementDate = r.IsDBNull(r.GetOrdinal("AchievementDate")) ? null : r.GetDateTime(r.GetOrdinal("AchievementDate")),
            CreatedDate = r.GetDateTime(r.GetOrdinal("CreatedDate")),
        };
    }
}