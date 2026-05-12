// AchievementsController.cs
// Place in: IME.API/Controllers/AchievementsController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Services;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AchievementsController : ControllerBase
{
    private readonly IAchievementRepository _achievementRepository;
    private readonly FileStorageService _fileStorageService;

    private static readonly string[] AllowedPhotoTypes =
        { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

    private static readonly string[] AllowedAttachmentTypes =
        { ".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx" };

    public AchievementsController(
        IAchievementRepository achievementRepository,
        FileStorageService fileStorageService)
    {
        _achievementRepository = achievementRepository;
        _fileStorageService = fileStorageService;
    }

    // ── helper ────────────────────────────────────────────────
    private string BuildFileUrl(string? relativePath)
    {
        if (string.IsNullOrEmpty(relativePath)) return string.Empty;
        return $"{Request.Scheme}://{Request.Host}/uploads/{relativePath.Replace('\\', '/')}";
    }

    // helper: read userId from JWT claims
    private int GetUserId() =>
        int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    // ── GET /api/achievements ─────────────────────────────────
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<AchievementDTO>>>> GetAll()
    {
        try
        {
            var achievements = await _achievementRepository.GetAllAchievementsAsync();
            foreach (var a in achievements)
            {
                // MemberPhotoPath is already a base64 data-URI from the mapper — don't touch it
                // Only build URL for the file-based attachment path
                a.AttachmentPath = BuildFileUrl(a.AttachmentPath);
            }
            return Ok(new ApiResponse<List<AchievementDTO>> { Success = true, Data = achievements });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<AchievementDTO>>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── GET /api/achievements/{id} ────────────────────────────
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<AchievementDetailDTO>>> GetById(int id)
    {
        try
        {
            var achievement = await _achievementRepository.GetAchievementByIdAsync(id);
            if (achievement == null)
                return NotFound(new ApiResponse<AchievementDetailDTO>
                { Success = false, Message = "Achievement not found" });

            achievement.MemberPhotoPath = BuildFileUrl(achievement.PhotoPath);
            foreach (var att in achievement.Attachments ?? [])
                att.FilePath = BuildFileUrl(att.FilePath);
            achievement.AttachmentPath = achievement.Attachments?.FirstOrDefault()?.FilePath;

            return Ok(new ApiResponse<AchievementDetailDTO> { Success = true, Data = achievement });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<AchievementDetailDTO>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── POST /api/achievements ────────────────────────────────
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<object>>> Create(
        [FromForm] int memberId,
        [FromForm] string title,
        [FromForm] string? description,
        [FromForm] string? achievementDate,
        [FromForm] IFormFile? photo,
        [FromForm] IFormFile? attachment)
    {
        try
        {
            var userId = GetUserId();

            // 1. Create the achievement record first (no photo yet)
            var achievement = new Achievement
            {
                MemberId = memberId,
                Title = title,
                Description = description,
                AchievementDate = DateTime.TryParse(achievementDate, out var dt) ? dt : null,
                CreatedBy = userId,
                CreatedDate = DateTime.UtcNow,
            };
            var achievementId = await _achievementRepository.CreateAchievementAsync(achievement);

            // 2. Save photo — then update record with the path
            if (photo != null &&
                AllowedPhotoTypes.Contains(Path.GetExtension(photo.FileName).ToLowerInvariant()))
            {
                var photoPath = await _fileStorageService.SaveFileAsync(
                    photo.OpenReadStream(), "Achievements", achievementId, photo.FileName);

                // FIX: pass memberName & title so SP does not get null
                await _achievementRepository.UpdateAchievementAsync(new Achievement
                {
                    AchievementId = achievementId,
                    MemberId = memberId,     // ← required by sp_UpdateAchievement
                    Title = title,             // ← required by sp_UpdateAchievement
                    Description = description,
                    AchievementDate = achievement.AchievementDate,
                    PhotoPath = photoPath,
                });
            }

            // 3. Save attachment — FIX: pass real userId not DBNull
            if (attachment != null &&
                AllowedAttachmentTypes.Contains(Path.GetExtension(attachment.FileName).ToLowerInvariant()))
            {
                var attachPath = await _fileStorageService.SaveFileAsync(
                    attachment.OpenReadStream(), "Achievements", achievementId, attachment.FileName);

                await _achievementRepository.AddAchievementAttachmentAsync(
                    achievementId, attachment.FileName, attachPath, userId);  // ← FIX
            }

            // 4. Push notification
            var dbContext = HttpContext.RequestServices
                .GetRequiredService<IME.Infrastructure.Data.DatabaseContext>();
            await NotificationController.CreateContentNotificationAsync(
                dbContext, "Achievements", achievementId,
                "New Achievement", $"{title}");

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Achievement created successfully",
                Data = new { AchievementId = achievementId }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message} | {ex.InnerException?.Message}" });
        }
    }

    // ── PUT /api/achievements/{id} ────────────────────────────
    [HttpPut("{id}")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<object>>> Update(
        int id,
        [FromForm] int memberId,
        [FromForm] string title,
        [FromForm] string? description,
        [FromForm] string? achievementDate,
        [FromForm] IFormFile? photo,
        [FromForm] IFormFile? attachment)
    {
        try
        {
            var userId = GetUserId();

            // 1. Save new photo if provided
            string? newPhotoPath = null;
            if (photo != null &&
                AllowedPhotoTypes.Contains(Path.GetExtension(photo.FileName).ToLowerInvariant()))
            {
                newPhotoPath = await _fileStorageService.SaveFileAsync(
                    photo.OpenReadStream(), "Achievements", id, photo.FileName);
            }

            // 2. Update achievement record
            var success = await _achievementRepository.UpdateAchievementAsync(new Achievement
            {
                AchievementId = id,
                MemberId = memberId,
                Title = title,
                Description = description,
                AchievementDate = DateTime.TryParse(achievementDate, out var dt) ? dt : null,
                PhotoPath = newPhotoPath,
                UpdatedDate = DateTime.UtcNow,
            });

            // 3. Replace attachment if a new one provided — FIX: pass userId
            if (attachment != null &&
                AllowedAttachmentTypes.Contains(Path.GetExtension(attachment.FileName).ToLowerInvariant()))
            {
                var attachPath = await _fileStorageService.SaveFileAsync(
                    attachment.OpenReadStream(), "Achievements", id, attachment.FileName);

                // Delete all old attachments first
                var existing = await _achievementRepository.GetAchievementAttachmentsAsync(id);
                foreach (var att in existing)
                    await _achievementRepository.DeleteAchievementAttachmentAsync(att.AttachmentId);

                await _achievementRepository.AddAchievementAttachmentAsync(
                    id, attachment.FileName, attachPath, userId);  // ← FIX
            }

            return Ok(new ApiResponse<object>
            {
                Success = success,
                Message = success ? "Achievement updated successfully" : "Achievement not found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message} | {ex.InnerException?.Message}" });
        }
    }

    // ── DELETE /api/achievements/{id} ─────────────────────────
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        try
        {
            var success = await _achievementRepository.DeleteAchievementAsync(id);
            return Ok(new ApiResponse<object>
            {
                Success = success,
                Message = success ? "Achievement deleted successfully" : "Achievement not found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── GET /api/achievements/{id}/attachments ────────────────
    [HttpGet("{id}/attachments")]
    public async Task<ActionResult<ApiResponse<List<AttachmentDTO>>>> GetAttachments(int id)
    {
        try
        {
            var attachments = await _achievementRepository.GetAchievementAttachmentsAsync(id);
            foreach (var att in attachments)
                att.FilePath = BuildFileUrl(att.FilePath);
            return Ok(new ApiResponse<List<AttachmentDTO>> { Success = true, Data = attachments });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<AttachmentDTO>>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── POST /api/achievements/{id}/attachments ───────────────
    [HttpPost("{id}/attachments")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<List<AttachmentDTO>>>> UploadAttachments(
        int id, [FromForm] List<IFormFile> files)
    {
        try
        {
            if (files == null || files.Count == 0)
                return Ok(new ApiResponse<List<AttachmentDTO>>
                { Success = false, Message = "No files provided." });

            var achievement = await _achievementRepository.GetAchievementByIdAsync(id);
            if (achievement == null)
                return NotFound(new ApiResponse<List<AttachmentDTO>>
                { Success = false, Message = "Achievement not found." });

            // FIX: get real userId for UploadedBy
            var userId = GetUserId();
            var saved = new List<AttachmentDTO>();

            foreach (var file in files)
            {
                if (file.Length == 0) continue;
                if (file.Length > 50 * 1024 * 1024) continue; // skip > 50 MB

                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!AllowedAttachmentTypes.Contains(ext)) continue;

                var filePath = await _fileStorageService.SaveFileAsync(
                    file.OpenReadStream(), "Achievements", id, file.FileName);

                // FIX: pass userId — was missing before
                var att = await _achievementRepository.AddAchievementAttachmentAsync(
                    id, file.FileName, filePath, userId);

                att.FilePath = BuildFileUrl(att.FilePath);
                saved.Add(att);
            }

            if (saved.Count == 0)
                return Ok(new ApiResponse<List<AttachmentDTO>>
                { Success = false, Message = "No valid files were uploaded." });

            return Ok(new ApiResponse<List<AttachmentDTO>>
            {
                Success = true,
                Message = $"{saved.Count} file(s) uploaded successfully.",
                Data = saved
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<AttachmentDTO>>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── DELETE /api/achievements/attachments/{attachmentId} ───
    [HttpDelete("attachments/{attachmentId}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteAttachment(int attachmentId)
    {
        try
        {
            var deleted = await _achievementRepository.DeleteAchievementAttachmentAsync(attachmentId);
            if (!deleted)
                return NotFound(new ApiResponse<object>
                { Success = false, Message = "Attachment not found." });

            return Ok(new ApiResponse<object>
            { Success = true, Message = "Attachment deleted successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }
   
}