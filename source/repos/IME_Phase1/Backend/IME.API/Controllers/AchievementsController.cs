using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.API.Requests;
using System.Data.SqlClient;
using IME.Infrastructure.Data;
using IME.Infrastructure.Services;
using Microsoft.AspNetCore.Http;

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

            achievement.AttachmentPath = achievement.Attachments.FirstOrDefault()?.FilePath;

            return Ok(new ApiResponse<AchievementDetailDTO> { Success = true, Data = achievement });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<AchievementDetailDTO> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── POST /api/achievements ────────────────────────────────────────────────
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromForm] AchievementCreateRequest request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_CreateAchievement", connection);
            command.Parameters.AddWithValue("@MemberName",      request.MemberName);
            command.Parameters.AddWithValue("@PhotoPath",       DBNull.Value);
            command.Parameters.AddWithValue("@Title",           request.Title);
            command.Parameters.AddWithValue("@Description",     (object?)request.Description ?? DBNull.Value);
            command.Parameters.AddWithValue("@AchievementDate",
                request.AchievementDate != null && DateTime.TryParse(request.AchievementDate, out var dt)
                    ? dt : DBNull.Value);
            command.Parameters.AddWithValue("@CreatedBy", userId);

            var achievementId = Convert.ToInt32(await command.ExecuteScalarAsync());

            if (request.Photo != null && AllowedPhotoTypes.Contains(Path.GetExtension(request.Photo.FileName).ToLowerInvariant()))
            {
                var photoPath = await _fileStorageService.SaveFileAsync(
                    request.Photo.OpenReadStream(), "Achievements", achievementId, request.Photo.FileName);

                using var updateCmd = _dbContext.CreateCommand(
                    "UPDATE Achievements SET PhotoPath = @PhotoPath WHERE AchievementId = @AchievementId", connection);
                updateCmd.Parameters.AddWithValue("@PhotoPath",     photoPath);
                updateCmd.Parameters.AddWithValue("@AchievementId", achievementId);
                await updateCmd.ExecuteNonQueryAsync();
            }

            if (request.Attachment != null && AllowedAttachmentTypes.Contains(Path.GetExtension(request.Attachment.FileName).ToLowerInvariant()))
            {
                var attachPath = await _fileStorageService.SaveFileAsync(
                    request.Attachment.OpenReadStream(), "Achievements", achievementId, request.Attachment.FileName);

                using var insertAttach = _dbContext.CreateCommand(
                    "INSERT INTO AchievementAttachments (AchievementId, FileName, FilePath) VALUES (@AchievementId, @FileName, @FilePath)",
                    connection);
                insertAttach.Parameters.AddWithValue("@AchievementId", achievementId);
                insertAttach.Parameters.AddWithValue("@FileName",      request.Attachment.FileName);
                insertAttach.Parameters.AddWithValue("@FilePath",      attachPath);
                await insertAttach.ExecuteNonQueryAsync();
            }

            await NotificationController.CreateContentNotificationAsync(
                _dbContext, "Achievements", achievementId, "New Achievement", $"{request.MemberName}: {request.Title}");

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
    [HttpPut("{id}")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromForm] AchievementUpdateRequest request)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();

            string? newPhotoPath = null;
            if (request.Photo != null && AllowedPhotoTypes.Contains(Path.GetExtension(request.Photo.FileName).ToLowerInvariant()))
                newPhotoPath = await _fileStorageService.SaveFileAsync(
                    request.Photo.OpenReadStream(), "Achievements", id, request.Photo.FileName);

            using var updateCmd = _dbContext.CreateStoredProcCommand("sp_UpdateAchievement", connection);
            updateCmd.Parameters.AddWithValue("@AchievementId",  id);
            updateCmd.Parameters.AddWithValue("@MemberName",     request.MemberName);
            updateCmd.Parameters.AddWithValue("@Title",          request.Title);
            updateCmd.Parameters.AddWithValue("@Description",    (object?)request.Description ?? DBNull.Value);
            updateCmd.Parameters.AddWithValue("@AchievementDate",
                request.AchievementDate != null && DateTime.TryParse(request.AchievementDate, out var dt)
                    ? dt : DBNull.Value);
            updateCmd.Parameters.AddWithValue("@PhotoPath",      (object?)newPhotoPath ?? DBNull.Value);

            using var updReader = await updateCmd.ExecuteReaderAsync();
            await updReader.ReadAsync();
            var rows = updReader.IsDBNull(updReader.GetOrdinal("RowsAffected"))
                ? 0 : updReader.GetInt32(updReader.GetOrdinal("RowsAffected"));
            updReader.Close();

            if (request.Attachment != null && AllowedAttachmentTypes.Contains(Path.GetExtension(request.Attachment.FileName).ToLowerInvariant()))
            {
                var attachPath = await _fileStorageService.SaveFileAsync(
                    request.Attachment.OpenReadStream(), "Achievements", id, request.Attachment.FileName);

                using var delOld = _dbContext.CreateCommand(
                    "DELETE FROM AchievementAttachments WHERE AchievementId = @AchievementId", connection);
                delOld.Parameters.AddWithValue("@AchievementId", id);
                await delOld.ExecuteNonQueryAsync();

                using var insertAttach = _dbContext.CreateCommand(
                    "INSERT INTO AchievementAttachments (AchievementId, FileName, FilePath) VALUES (@AchievementId, @FileName, @FilePath)",
                    connection);
                insertAttach.Parameters.AddWithValue("@AchievementId", id);
                insertAttach.Parameters.AddWithValue("@FileName",      request.Attachment.FileName);
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