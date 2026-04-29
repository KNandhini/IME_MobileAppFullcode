using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using System.Data.SqlClient;
using IME.Infrastructure.Data;
using IME.Infrastructure.Services;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AchievementsController : ControllerBase
{
    private readonly DatabaseContext _dbContext;
    private readonly FileStorageService _fileStorageService;

    private static readonly string[] AllowedPhotoTypes      = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    private static readonly string[] AllowedAttachmentTypes = { ".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx" };

    public AchievementsController(DatabaseContext dbContext, FileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private string BuildFileUrl(string relativePath)
    {
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        return $"{baseUrl}/uploads/{relativePath.Replace('\\', '/')}";
    }

    // ── GET /api/achievements ─────────────────────────────────────────────────
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<AchievementDTO>>>> GetAll()
    {
        try
        {
            var achievements = new List<AchievementDTO>();

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetAllAchievements", connection);
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                var photoPath = reader.IsDBNull(reader.GetOrdinal("MemberPhotoPath"))
                    ? null : reader.GetString(reader.GetOrdinal("MemberPhotoPath"));
                var attachPath = reader.IsDBNull(reader.GetOrdinal("AttachmentPath"))
                    ? null : reader.GetString(reader.GetOrdinal("AttachmentPath"));

                achievements.Add(new AchievementDTO
                {
                    AchievementId   = reader.GetInt32(reader.GetOrdinal("AchievementId")),
                    MemberName      = reader.GetString(reader.GetOrdinal("MemberName")),
                    PhotoPath       = photoPath,
                    MemberPhotoPath = photoPath != null ? BuildFileUrl(photoPath) : null,
                    AttachmentPath  = attachPath != null ? BuildFileUrl(attachPath) : null,
                    Title           = reader.GetString(reader.GetOrdinal("Title")),
                    Description     = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                    AchievementDate = reader.IsDBNull(reader.GetOrdinal("AchievementDate")) ? null : reader.GetDateTime(reader.GetOrdinal("AchievementDate")),
                    CreatedDate     = reader.GetDateTime(reader.GetOrdinal("CreatedDate"))
                });
            }

            return Ok(new ApiResponse<List<AchievementDTO>> { Success = true, Data = achievements });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<AchievementDTO>> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── GET /api/achievements/{id} ────────────────────────────────────────────
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<AchievementDetailDTO>>> GetById(int id)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateCommand(
                "SELECT * FROM Achievements WHERE AchievementId = @AchievementId", connection);
            command.Parameters.AddWithValue("@AchievementId", id);
            using var reader = await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
                return NotFound(new ApiResponse<AchievementDetailDTO> { Success = false, Message = "Achievement not found" });

            var photoPath = reader.IsDBNull(reader.GetOrdinal("PhotoPath"))
                ? null : reader.GetString(reader.GetOrdinal("PhotoPath"));

            var achievement = new AchievementDetailDTO
            {
                AchievementId   = reader.GetInt32(reader.GetOrdinal("AchievementId")),
                MemberName      = reader.GetString(reader.GetOrdinal("MemberName")),
                PhotoPath       = photoPath,
                MemberPhotoPath = photoPath != null ? BuildFileUrl(photoPath) : null,
                Title           = reader.GetString(reader.GetOrdinal("Title")),
                Description     = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                AchievementDate = reader.IsDBNull(reader.GetOrdinal("AchievementDate")) ? null : reader.GetDateTime(reader.GetOrdinal("AchievementDate")),
                CreatedDate     = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                Attachments     = []
            };
            reader.Close();

            // Load attachments
            using var attachCmd = _dbContext.CreateCommand(
                "SELECT * FROM AchievementAttachments WHERE AchievementId = @AchievementId", connection);
            attachCmd.Parameters.AddWithValue("@AchievementId", id);
            using var attachReader = await attachCmd.ExecuteReaderAsync();

            while (await attachReader.ReadAsync())
            {
                var filePath = attachReader.IsDBNull(attachReader.GetOrdinal("FilePath"))
                    ? null : attachReader.GetString(attachReader.GetOrdinal("FilePath"));

                achievement.Attachments.Add(new AttachmentDTO
                {
                    AttachmentId = attachReader.GetInt32(attachReader.GetOrdinal("AttachmentId")),
                    FileName     = attachReader.IsDBNull(attachReader.GetOrdinal("FileName")) ? null : attachReader.GetString(attachReader.GetOrdinal("FileName")),
                    FilePath     = filePath != null ? BuildFileUrl(filePath) : null,
                    UploadedDate = attachReader.GetDateTime(attachReader.GetOrdinal("UploadedDate"))
                });
            }

            // Populate flat AttachmentPath from first attachment
            achievement.AttachmentPath = achievement.Attachments.FirstOrDefault()?.FilePath;

            return Ok(new ApiResponse<AchievementDetailDTO> { Success = true, Data = achievement });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<AchievementDetailDTO> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── POST /api/achievements ────────────────────────────────────────────────
    // Open to all authenticated users (any member can add their own achievement)
    [HttpPost]
    public async Task<ActionResult<ApiResponse<object>>> Create(
        [FromForm] string memberName,
        [FromForm] string title,
        [FromForm] string? description,
        [FromForm] string? achievementDate,
        [FromForm] IFormFile? photo,
        [FromForm] IFormFile? attachment)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            // Insert achievement record first to get its ID
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_CreateAchievement", connection);
            command.Parameters.AddWithValue("@MemberName",      memberName);
            command.Parameters.AddWithValue("@PhotoPath",       DBNull.Value);  // updated after file save
            command.Parameters.AddWithValue("@Title",           title);
            command.Parameters.AddWithValue("@Description",     (object?)description ?? DBNull.Value);
            command.Parameters.AddWithValue("@AchievementDate", achievementDate != null && DateTime.TryParse(achievementDate, out var dt) ? dt : DBNull.Value);
            command.Parameters.AddWithValue("@CreatedBy",       userId);

            var achievementId = Convert.ToInt32(await command.ExecuteScalarAsync());

            // Save photo
            if (photo != null && AllowedPhotoTypes.Contains(Path.GetExtension(photo.FileName).ToLowerInvariant()))
            {
                var photoPath = await _fileStorageService.SaveFileAsync(
                    photo.OpenReadStream(), "Achievements", achievementId, photo.FileName);

                using var updateCmd = _dbContext.CreateCommand(
                    "UPDATE Achievements SET PhotoPath = @PhotoPath WHERE AchievementId = @AchievementId",
                    connection);
                updateCmd.Parameters.AddWithValue("@PhotoPath",      photoPath);
                updateCmd.Parameters.AddWithValue("@AchievementId",  achievementId);
                await updateCmd.ExecuteNonQueryAsync();
            }

            // Save attachment
            if (attachment != null && AllowedAttachmentTypes.Contains(Path.GetExtension(attachment.FileName).ToLowerInvariant()))
            {
                var attachPath = await _fileStorageService.SaveFileAsync(
                    attachment.OpenReadStream(), "Achievements", achievementId, attachment.FileName);

                using var insertAttach = _dbContext.CreateCommand(
                    "INSERT INTO AchievementAttachments (AchievementId, FileName, FilePath) VALUES (@AchievementId, @FileName, @FilePath)",
                    connection);
                insertAttach.Parameters.AddWithValue("@AchievementId", achievementId);
                insertAttach.Parameters.AddWithValue("@FileName",      attachment.FileName);
                insertAttach.Parameters.AddWithValue("@FilePath",      attachPath);
                await insertAttach.ExecuteNonQueryAsync();
            }

            await NotificationController.CreateContentNotificationAsync(
                _dbContext, "Achievements", achievementId, "New Achievement", $"{memberName}: {title}");

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Achievement created successfully",
                Data    = new { AchievementId = achievementId }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── PUT /api/achievements/{id} ────────────────────────────────────────────
    // Open to all authenticated users
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Update(
        int id,
        [FromForm] string memberName,
        [FromForm] string title,
        [FromForm] string? description,
        [FromForm] string? achievementDate,
        [FromForm] IFormFile? photo,
        [FromForm] IFormFile? attachment)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();

            // Save new photo if provided
            string? newPhotoPath = null;
            if (photo != null && AllowedPhotoTypes.Contains(Path.GetExtension(photo.FileName).ToLowerInvariant()))
                newPhotoPath = await _fileStorageService.SaveFileAsync(
                    photo.OpenReadStream(), "Achievements", id, photo.FileName);

            // Use sp_UpdateAchievement — NULL PhotoPath = keep existing
            using var updateCmd = _dbContext.CreateStoredProcCommand("sp_UpdateAchievement", connection);
            updateCmd.Parameters.AddWithValue("@AchievementId",  id);
            updateCmd.Parameters.AddWithValue("@MemberName",     memberName);
            updateCmd.Parameters.AddWithValue("@Title",          title);
            updateCmd.Parameters.AddWithValue("@Description",    (object?)description ?? DBNull.Value);
            updateCmd.Parameters.AddWithValue("@AchievementDate",
                achievementDate != null && DateTime.TryParse(achievementDate, out var dt) ? dt : DBNull.Value);
            updateCmd.Parameters.AddWithValue("@PhotoPath",      (object?)newPhotoPath ?? DBNull.Value);

            using var updReader = await updateCmd.ExecuteReaderAsync();
            await updReader.ReadAsync();
            var rows = updReader.IsDBNull(updReader.GetOrdinal("RowsAffected"))
                ? 0 : updReader.GetInt32(updReader.GetOrdinal("RowsAffected"));
            updReader.Close();

            // Save new attachment if provided — replaces old one
            if (attachment != null && AllowedAttachmentTypes.Contains(Path.GetExtension(attachment.FileName).ToLowerInvariant()))
            {
                var attachPath = await _fileStorageService.SaveFileAsync(
                    attachment.OpenReadStream(), "Achievements", id, attachment.FileName);

                using var delOld = _dbContext.CreateCommand(
                    "DELETE FROM AchievementAttachments WHERE AchievementId = @AchievementId", connection);
                delOld.Parameters.AddWithValue("@AchievementId", id);
                await delOld.ExecuteNonQueryAsync();

                using var insertAttach = _dbContext.CreateCommand(
                    "INSERT INTO AchievementAttachments (AchievementId, FileName, FilePath) VALUES (@AchievementId, @FileName, @FilePath)",
                    connection);
                insertAttach.Parameters.AddWithValue("@AchievementId", id);
                insertAttach.Parameters.AddWithValue("@FileName",      attachment.FileName);
                insertAttach.Parameters.AddWithValue("@FilePath",      attachPath);
                await insertAttach.ExecuteNonQueryAsync();
            }

            return Ok(new ApiResponse<object>
            {
                Success = rows > 0,
                Message = rows > 0 ? "Achievement updated successfully" : "Achievement not found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── DELETE /api/achievements/{id} ─────────────────────────────────────────
    // Open to all authenticated users
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_DeleteAchievement", connection);
            command.Parameters.AddWithValue("@AchievementId", id);

            using var reader = await command.ExecuteReaderAsync();
            await reader.ReadAsync();
            var rows = reader.IsDBNull(reader.GetOrdinal("RowsAffected"))
                ? 0 : reader.GetInt32(reader.GetOrdinal("RowsAffected"));

            return Ok(new ApiResponse<object>
            {
                Success = rows > 0,
                Message = rows > 0 ? "Achievement deleted successfully" : "Achievement not found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }
}
