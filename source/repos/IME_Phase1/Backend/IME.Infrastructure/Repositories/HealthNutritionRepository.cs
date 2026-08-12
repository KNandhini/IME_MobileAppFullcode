// HealthNutritionRepository.cs
// Place in: IME.Infrastructure/Repositories/HealthNutritionRepository.cs

using System.Data;
using System.Data.SqlClient;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Data;

namespace IME.Infrastructure.Repositories;

public class HealthNutritionRepository(DatabaseContext dbContext) : IHealthNutritionRepository
{
    private readonly DatabaseContext _dbContext = dbContext;

    // ── GET ALL ───────────────────────────────────────────────
    public async Task<List<HealthNutritionDTO>> GetAllAsync()
    {
        var list = new List<HealthNutritionDTO>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetAllHealthNutrition", connection);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            list.Add(MapDto(reader));

        return list;
    }

    // ── GET BY ID ─────────────────────────────────────────────
    public async Task<HealthNutritionDetailDTO?> GetByIdAsync(long id)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetHealthNutritionById", connection);
        command.Parameters.AddWithValue("@id", id);

        using var reader = await command.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;

        var dto = MapDto(reader);
        return new HealthNutritionDetailDTO
        {
            Id = dto.Id,
            Title = dto.Title,
            Description = dto.Description,
            PostedUser = dto.PostedUser,
            PostedBy = dto.PostedBy,
            AttachmentPath = dto.AttachmentPath,
            AttachmentType = dto.AttachmentType,
            AttachmentFileName = dto.AttachmentFileName,
            Status = dto.Status,
            CreatedBy = dto.CreatedBy,
            CreatedDate = dto.CreatedDate,
            ModifiedBy = dto.ModifiedBy,
            ModifiedDate = dto.ModifiedDate,
        };
    }

    // ── CREATE ────────────────────────────────────────────────
    public async Task<HealthNutrition> CreateAsync(HealthNutrition item)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_CreateHealthNutrition", connection);

        command.Parameters.AddWithValue("@title", item.Title);
        command.Parameters.AddWithValue("@description", item.Description);
        command.Parameters.AddWithValue("@posteduser", item.PostedUser);
        command.Parameters.AddWithValue("@postedby", item.PostedBy.Date);
        command.Parameters.AddWithValue("@attachment", item.Attachment ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@status", item.Status);
        command.Parameters.AddWithValue("@createdby", (object?)item.CreatedBy ?? DBNull.Value);

        var newIdParam = new SqlParameter("@new_id", SqlDbType.BigInt) { Direction = ParameterDirection.Output };
        command.Parameters.Add(newIdParam);

        using var reader = await command.ExecuteReaderAsync();
        HealthNutrition? created = null;
        if (await reader.ReadAsync())
            created = MapModel(reader);
        reader.Close();

        var newId = (long)(newIdParam.Value ?? 0L);
        return created ?? new HealthNutrition { Id = newId };
    }

    // ── UPDATE ────────────────────────────────────────────────
    public async Task<(bool Success, string? OldAttachment)> UpdateAsync(HealthNutrition item)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_UpdateHealthNutrition", connection);

        command.Parameters.AddWithValue("@id", item.Id);
        command.Parameters.AddWithValue("@title", item.Title);
        command.Parameters.AddWithValue("@description", item.Description);
        command.Parameters.AddWithValue("@posteduser", item.PostedUser);
        command.Parameters.AddWithValue("@postedby", item.PostedBy.Date);
        // NULL = keep existing file, "" = clear, value = replace
        command.Parameters.AddWithValue("@attachment", (object?)item.Attachment ?? DBNull.Value);
        command.Parameters.AddWithValue("@status", item.Status);
        command.Parameters.AddWithValue("@modifiedby", (object?)item.ModifiedBy ?? DBNull.Value);

        var oldAttachmentParam = new SqlParameter("@old_attachment", SqlDbType.NVarChar, 500)
        { Direction = ParameterDirection.Output };
        var rowsAffectedParam = new SqlParameter("@rows_affected", SqlDbType.Int)
        { Direction = ParameterDirection.Output };
        command.Parameters.Add(oldAttachmentParam);
        command.Parameters.Add(rowsAffectedParam);

        using (var reader = await command.ExecuteReaderAsync())
        {
            // final SELECT in the SP — nothing to map here, just drain it
            // so the output parameters become readable once closed.
        }

        var rowsAffected = (int)(rowsAffectedParam.Value is int i ? i : 0);
        var oldAttachment = oldAttachmentParam.Value as string;

        return (rowsAffected > 0, string.IsNullOrEmpty(oldAttachment) ? null : oldAttachment);
    }

    // ── DELETE ────────────────────────────────────────────────
    public async Task<(bool Success, string? Attachment)> DeleteAsync(long id)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_DeleteHealthNutrition", connection);
        command.Parameters.AddWithValue("@id", id);

        var attachmentParam = new SqlParameter("@attachment", SqlDbType.NVarChar, 500)
        { Direction = ParameterDirection.Output };
        var rowsAffectedParam = new SqlParameter("@rows_affected", SqlDbType.Int)
        { Direction = ParameterDirection.Output };
        command.Parameters.Add(attachmentParam);
        command.Parameters.Add(rowsAffectedParam);

        await command.ExecuteNonQueryAsync();

        var rowsAffected = (int)(rowsAffectedParam.Value is int i ? i : 0);
        var attachment = attachmentParam.Value as string;

        return (rowsAffected > 0, attachment);
    }

    // ── MAPPERS ───────────────────────────────────────────────
    private static HealthNutritionDTO MapDto(SqlDataReader r)
    {
        var attachment = r.IsDBNull(r.GetOrdinal("attachment")) ? null : r.GetString(r.GetOrdinal("attachment"));

        return new HealthNutritionDTO
        {
            Id = r.GetInt64(r.GetOrdinal("id")),
            Title = r.GetString(r.GetOrdinal("title")),
            Description = r.GetString(r.GetOrdinal("description")),
            PostedUser = r.GetString(r.GetOrdinal("posteduser")),
            PostedBy = r.GetDateTime(r.GetOrdinal("postedby")),
            AttachmentPath = attachment,
            AttachmentType = ResolveAttachmentType(attachment),
            AttachmentFileName = string.IsNullOrEmpty(attachment) ? null : Path.GetFileName(attachment),
            Status = r.GetBoolean(r.GetOrdinal("status")),
            CreatedBy = r.IsDBNull(r.GetOrdinal("createdby")) ? null : r.GetString(r.GetOrdinal("createdby")),
            CreatedDate = r.GetDateTime(r.GetOrdinal("createddate")),
            ModifiedBy = r.IsDBNull(r.GetOrdinal("modifiedby")) ? null : r.GetString(r.GetOrdinal("modifiedby")),
            ModifiedDate = r.IsDBNull(r.GetOrdinal("modifieddate")) ? null : r.GetDateTime(r.GetOrdinal("modifieddate")),
        };
    }

    private static HealthNutrition MapModel(SqlDataReader r) => new()
    {
        Id = r.GetInt64(r.GetOrdinal("id")),
        Title = r.GetString(r.GetOrdinal("title")),
        Description = r.GetString(r.GetOrdinal("description")),
        PostedUser = r.GetString(r.GetOrdinal("posteduser")),
        PostedBy = r.GetDateTime(r.GetOrdinal("postedby")),
        Attachment = r.IsDBNull(r.GetOrdinal("attachment")) ? null : r.GetString(r.GetOrdinal("attachment")),
        Status = r.GetBoolean(r.GetOrdinal("status")),
        CreatedBy = r.IsDBNull(r.GetOrdinal("createdby")) ? null : r.GetString(r.GetOrdinal("createdby")),
        CreatedDate = r.GetDateTime(r.GetOrdinal("createddate")),
        ModifiedBy = r.IsDBNull(r.GetOrdinal("modifiedby")) ? null : r.GetString(r.GetOrdinal("modifiedby")),
        ModifiedDate = r.IsDBNull(r.GetOrdinal("modifieddate")) ? null : r.GetDateTime(r.GetOrdinal("modifieddate")),
    };

    // Drives the UI behavior rule: image → viewer, audio/video → player, pdf → preview+download, else → download.
    private static string ResolveAttachmentType(string? path)
    {
        if (string.IsNullOrEmpty(path)) return "other";
        var ext = Path.GetExtension(path).ToLowerInvariant();
        return ext switch
        {
            ".jpg" or ".jpeg" or ".png" or ".gif" or ".webp"
                or ".heic" or ".heif" or ".bmp" or ".tiff" or ".tif" or ".svg" => "image",
            // Note: ".mpeg"/".mpga" are classified as audio here because that's
            // the real-world case that came up (voice-note exports mislabeled
            // with a .mpeg extension). Classic MPEG *video* files are almost
            // always ".mpg"/".mp4" in practice, so this tradeoff favors the
            // audio case — revisit if a genuine .mpeg video upload shows up.
            ".mp3" or ".wav" or ".m4a" or ".aac" or ".opus" or ".ogg"
                or ".mpeg" or ".mpga" or ".wma" or ".flac" or ".amr" => "audio",
            ".mp4" or ".avi" or ".mov" or ".mkv" or ".webm" or ".3gp" or ".wmv" or ".flv" => "video",
            ".pdf" => "pdf",
            _ => "other",
        };
    }
}