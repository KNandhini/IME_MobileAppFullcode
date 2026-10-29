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
        using var command = new SqlCommand(
            "SELECT AttachmentId, FileName, FilePath, UploadedDate FROM tbl_Attachments WHERE ModuleName = 'Achievements' AND ReferenceId = @AchievementId ORDER BY UploadedDate DESC",
            connection);
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
    public async Task<AttachmentDTO> AddAchievementAttachmentAsync(
        int achievementId, string fileName, string filePath, long fileSize)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = new SqlCommand(
            "INSERT INTO tbl_Attachments (ModuleName, ReferenceId, FileName, FilePath, FileSize) VALUES ('Achievements', @AchievementId, @FileName, @FilePath, @FileSize); SELECT CAST(SCOPE_IDENTITY() AS INT);",
            connection);
        command.Parameters.AddWithValue("@AchievementId", achievementId);
        command.Parameters.AddWithValue("@FileName", fileName);
        command.Parameters.AddWithValue("@FilePath", filePath);
        command.Parameters.AddWithValue("@FileSize", fileSize);
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
        using var command = new SqlCommand(
            "DELETE FROM tbl_Attachments WHERE AttachmentId = @AttachmentId AND ModuleName = 'Achievements'",
            connection);
        command.Parameters.AddWithValue("@AttachmentId", attachmentId);
        return await command.ExecuteNonQueryAsync() > 0;
    }

    // ── MAPPER ────────────────────────────────────────────────
    private static AchievementDTO MapAchievement(SqlDataReader r)
    {
        var photoPath = ReadOptionalString(r, "AchievementPhotoPath", "PhotoPath");
        var memberPhotoPath = ReadOptionalString(r, "MemberPhotoPath", "ProfilePhotoPath");
        var attachPath = ReadOptionalString(r, "AttachmentPath");
        var memberIdOrdinal = GetOptionalOrdinal(r, "MemberId");
        var memberNameOrdinal = GetOptionalOrdinal(r, "MemberName");
        var descriptionOrdinal = GetOptionalOrdinal(r, "Description");
        var dateOrdinal = GetOptionalOrdinal(r, "AchievementDate");
        var createdDateOrdinal = GetOptionalOrdinal(r, "CreatedDate");

        return new AchievementDTO
        {
            AchievementId = r.GetInt32(r.GetOrdinal("AchievementId")),
            MemberId = memberIdOrdinal >= 0 && !r.IsDBNull(memberIdOrdinal) ? r.GetInt32(memberIdOrdinal) : 0,
            MemberName = memberNameOrdinal >= 0 && !r.IsDBNull(memberNameOrdinal) ? r.GetString(memberNameOrdinal) : string.Empty,
            PhotoPath = photoPath,
            MemberPhotoPath = memberPhotoPath,
            AttachmentPath = attachPath,
            Title = r.GetString(r.GetOrdinal("Title")),
            Description = descriptionOrdinal >= 0 && !r.IsDBNull(descriptionOrdinal) ? r.GetString(descriptionOrdinal) : null,
            AchievementDate = dateOrdinal >= 0 && !r.IsDBNull(dateOrdinal) ? r.GetDateTime(dateOrdinal) : null,
            CreatedDate = createdDateOrdinal >= 0 && !r.IsDBNull(createdDateOrdinal) ? r.GetDateTime(createdDateOrdinal) : DateTime.MinValue,
        };
    }

    private static string? ReadOptionalString(SqlDataReader reader, params string[] columnNames)
    {
        foreach (var columnName in columnNames)
        {
            var ordinal = GetOptionalOrdinal(reader, columnName);
            if (ordinal < 0 || reader.IsDBNull(ordinal)) continue;

            if (reader.GetFieldType(ordinal) == typeof(byte[]))
            {
                var bytes = (byte[])reader.GetValue(ordinal);
                return $"data:image/jpeg;base64,{Convert.ToBase64String(bytes)}";
            }

            return reader.GetString(ordinal);
        }

        return null;
    }

    private static int GetOptionalOrdinal(SqlDataReader reader, string columnName)
    {
        try { return reader.GetOrdinal(columnName); }
        catch (IndexOutOfRangeException) { return -1; }
    }
}