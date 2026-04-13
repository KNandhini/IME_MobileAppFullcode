using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Services;
using System.Security.Claims;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ActivityController : ControllerBase
{
    private readonly IActivityRepository _activityRepository;
    private readonly FileStorageService  _fileStorageService;

    private static readonly string[] AllowedTypes = {
        ".jpg", ".jpeg", ".png", ".gif", ".webp",
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".mp4", ".mov", ".avi", ".zip", ".rar"
    };

    public ActivityController(IActivityRepository activityRepository, FileStorageService fileStorageService)
    {
        _activityRepository = activityRepository;
        _fileStorageService = fileStorageService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<Activity>>>> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var activities = await _activityRepository.GetAllActivitiesAsync(pageNumber, pageSize);

            return Ok(new ApiResponse<List<Activity>>
            {
                Success = true,
                Data = activities
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<Activity>>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<Activity>>> GetById(int id)
    {
        try
        {
            var activity = await _activityRepository.GetActivityByIdAsync(id);

            if (activity == null)
            {
                return NotFound(new ApiResponse<Activity>
                {
                    Success = false,
                    Message = "Activity not found"
                });
            }

            return Ok(new ApiResponse<Activity>
            {
                Success = true,
                Data = activity
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<Activity>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] CreateActivityDTO request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            var activity = new Activity
            {
                ActivityName = request.ActivityName,
                Description = request.Description,
                ActivityDate = request.ActivityDate,
                Venue = request.Venue,
                Time = request.Time,
                ChiefGuest = request.ChiefGuest,
                CreatedBy = userId
            };

            var activityId = await _activityRepository.CreateActivityAsync(activity);

            // Send notification to all users about new activity
            var dbContext = HttpContext.RequestServices.GetRequiredService<IME.Infrastructure.Data.DatabaseContext>();
            await NotificationController.CreateContentNotificationAsync(
                dbContext,
                "Activities",
                activityId,
                "New Activity Added",
                $"New activity: {request.ActivityName}"
            );

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Activity created successfully",
                Data = new { ActivityId = activityId }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] UpdateActivityDTO request)
    {
        try
        {
            var activity = new Activity
            {
                ActivityId = id,
                ActivityName = request.ActivityName,
                Description = request.Description,
                ActivityDate = request.ActivityDate,
                Venue = request.Venue,
                Time = request.Time,
                ChiefGuest = request.ChiefGuest
            };

            var success = await _activityRepository.UpdateActivityAsync(activity);

            if (success)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Activity updated successfully"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = false,
                Message = "Failed to update activity"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        try
        {
            var success = await _activityRepository.DeleteActivityAsync(id);

            if (success)
            {
                return Ok(new ApiResponse<object> { Success = true, Message = "Activity deleted successfully" });
            }

            return Ok(new ApiResponse<object> { Success = false, Message = "Failed to delete activity" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── GET /api/activity/{id}/attachments ───────────────────
    [HttpGet("{id}/attachments")]
    public async Task<ActionResult<ApiResponse<List<ActivityAttachmentDTO>>>> GetAttachments(int id)
    {
        try
        {
            var attachments = await _activityRepository.GetActivityAttachmentsAsync(id);
            return Ok(new ApiResponse<List<ActivityAttachmentDTO>> { Success = true, Data = attachments });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<ActivityAttachmentDTO>> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── POST /api/activity/{id}/attachments  (multipart) ─────
    [HttpPost("{id}/attachments")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<ActivityAttachmentDTO>>>> UploadAttachments(
        int id, [FromForm] List<IFormFile> files)
    {
        try
        {
            if (files == null || files.Count == 0)
                return Ok(new ApiResponse<List<ActivityAttachmentDTO>> { Success = false, Message = "No files provided." });

            var activity = await _activityRepository.GetActivityByIdAsync(id);
            if (activity == null)
                return NotFound(new ApiResponse<List<ActivityAttachmentDTO>> { Success = false, Message = "Activity not found." });

            var memberIdClaim = User.FindFirst("MemberId")?.Value
                             ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(memberIdClaim, out var uploadedBy);

            var saved = new List<ActivityAttachmentDTO>();

            foreach (var file in files)
            {
                if (file.Length == 0) continue;
                if (file.Length > 50 * 1024 * 1024) continue; // skip > 50 MB

                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!AllowedTypes.Contains(ext)) continue;

                var filePath = await _fileStorageService.SaveFileAsync(
                    file.OpenReadStream(), "Activities", id, file.FileName);

                var attachment = await _activityRepository.AddActivityAttachmentAsync(
                    id, file.FileName, filePath, file.Length,
                    file.ContentType, uploadedBy);

                saved.Add(attachment);
            }

            if (saved.Count == 0)
                return Ok(new ApiResponse<List<ActivityAttachmentDTO>> { Success = false, Message = "No valid files were uploaded." });

            return Ok(new ApiResponse<List<ActivityAttachmentDTO>>
            {
                Success = true,
                Message = $"{saved.Count} file(s) uploaded successfully.",
                Data    = saved
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<ActivityAttachmentDTO>> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── DELETE /api/activity/attachments/{attachmentId} ──────
    [HttpDelete("attachments/{attachmentId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteAttachment(int attachmentId)
    {
        try
        {
            var (filePath, deleted) = await _activityRepository.DeleteActivityAttachmentAsync(attachmentId);

            if (!deleted)
                return NotFound(new ApiResponse<object> { Success = false, Message = "Attachment not found." });

            // Delete physical file
            if (!string.IsNullOrEmpty(filePath))
                _fileStorageService.DeleteFile(filePath);

            return Ok(new ApiResponse<object> { Success = true, Message = "Attachment deleted successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── GET /api/activity/attachments/{attachmentId}/file ────
    [HttpGet("attachments/{attachmentId}/file")]
    public async Task<IActionResult> DownloadAttachment(int attachmentId)
    {
        try
        {
            var attachments = new List<ActivityAttachmentDTO>();
            // Fetch all attachments — we need a single lookup; use a direct query via DB context
            using var connection = await GetDbContext().CreateOpenConnectionAsync();
            using var cmd = GetDbContext().CreateCommand(
                "SELECT FileName, FilePath, FileType FROM Attachments WHERE AttachmentId = @Id AND ModuleName = 'Activities'",
                connection);
            cmd.Parameters.AddWithValue("@Id", attachmentId);

            string? fileName = null, filePath = null, fileType = null;
            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                fileName = reader.IsDBNull(0) ? null : reader.GetString(0);
                filePath = reader.IsDBNull(1) ? null : reader.GetString(1);
                fileType = reader.IsDBNull(2) ? null : reader.GetString(2);
            }

            if (filePath == null || !_fileStorageService.FileExists(filePath))
                return NotFound();

            var fullPath = _fileStorageService.GetFullPath(filePath);
            var bytes    = await System.IO.File.ReadAllBytesAsync(fullPath);
            var mime     = fileType ?? "application/octet-stream";

            return File(bytes, mime, fileName ?? Path.GetFileName(filePath));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    private IME.Infrastructure.Data.DatabaseContext GetDbContext() =>
        HttpContext.RequestServices.GetRequiredService<IME.Infrastructure.Data.DatabaseContext>();
}
