// HealthNutritionController.cs
// Place in: IME.API/Controllers/HealthNutritionController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.API.Requests;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Services;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HealthNutritionController : ControllerBase
{
    private readonly IHealthNutritionRepository _repository;
    private readonly FileStorageService _fileStorageService;

    private const string ModuleFolder = "HealthNutrition";
    private const long MaxFileSizeBytes = 50 * 1024 * 1024; // 50 MB

    private static readonly string[] AllowedAttachmentTypes =
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp",           // images
        ".pdf", ".doc", ".docx", ".xls", ".xlsx",
        ".ppt", ".pptx", ".txt",                             // documents
        ".mp3", ".wav",                                      // audio
        ".mp4", ".avi", ".mov", ".mkv",                      // video
        ".zip", ".rar", ".7z",                                // compressed
        ".csv", ".json"
    };

    public HealthNutritionController(
        IHealthNutritionRepository repository,
        FileStorageService fileStorageService)
    {
        _repository = repository;
        _fileStorageService = fileStorageService;
    }

    // ── helpers ───────────────────────────────────────────────
    private string BuildFileUrl(string? relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath) || relativePath == "pending")
            return string.Empty;

        return Path.Combine(
            Directory.GetCurrentDirectory(),
            relativePath.Replace('/', Path.DirectorySeparatorChar)
                        .Replace('\\', Path.DirectorySeparatorChar));
    }

    private string GetUserName() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown";

    // ── GET /api/healthnutrition ─────────────────────────────
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<HealthNutritionDTO>>>> GetAll()
    {
        try
        {
            var items = await _repository.GetAllAsync();
            foreach (var item in items)
                item.AttachmentPath = BuildFileUrl(item.AttachmentPath);

            return Ok(new ApiResponse<List<HealthNutritionDTO>> { Success = true, Data = items });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<HealthNutritionDTO>>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── GET /api/healthnutrition/{id} ────────────────────────
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<HealthNutritionDetailDTO>>> GetById(long id)
    {
        try
        {
            var item = await _repository.GetByIdAsync(id);
            if (item == null)
                return NotFound(new ApiResponse<HealthNutritionDetailDTO>
                { Success = false, Message = "Record not found" });

            item.AttachmentPath = BuildFileUrl(item.AttachmentPath);
            return Ok(new ApiResponse<HealthNutritionDetailDTO> { Success = true, Data = item });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<HealthNutritionDetailDTO>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── POST /api/healthnutrition ────────────────────────────
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromForm] HealthNutritionCreateRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return Ok(new ApiResponse<object> { Success = false, Message = "Title is required." });

            if (string.IsNullOrWhiteSpace(request.Description))
                return Ok(new ApiResponse<object> { Success = false, Message = "Description is required." });

            if (string.IsNullOrWhiteSpace(request.PostedUser))
                return Ok(new ApiResponse<object> { Success = false, Message = "Posted user is required." });

            if (!DateTime.TryParse(request.PostedBy, out var postedByDate))
                return Ok(new ApiResponse<object> { Success = false, Message = "A valid posted date is required." });

            if (request.Attachment == null || request.Attachment.Length == 0)
                return Ok(new ApiResponse<object> { Success = false, Message = "An attachment file is required." });

            if (request.Attachment.Length > MaxFileSizeBytes)
                return Ok(new ApiResponse<object> { Success = false, Message = "File exceeds the 50 MB limit." });

            var ext = Path.GetExtension(request.Attachment.FileName).ToLowerInvariant();
            if (!AllowedAttachmentTypes.Contains(ext))
                return Ok(new ApiResponse<object> { Success = false, Message = $"File type '{ext}' is not supported." });

            var userName = GetUserName();

            // 1. Insert with a placeholder attachment (column is NOT NULL) so we get an id
            //    to build the "HealthNutrition-{id}" upload folder.
            var created = await _repository.CreateAsync(new HealthNutrition
            {
                Title = request.Title,
                Description = request.Description,
                PostedUser = request.PostedUser,
                PostedBy = postedByDate,
                Attachment = "pending",
                Status = request.Status,
                CreatedBy = userName,
            });

            // 2. Save the real file now that we have an id, then update the record with its path.
            var relativePath = await _fileStorageService.SaveFileAsync(
                request.Attachment.OpenReadStream(), ModuleFolder, (int)created.Id, request.Attachment.FileName);

            var (success, _) = await _repository.UpdateAsync(new HealthNutrition
            {
                Id = created.Id,
                Title = request.Title,
                Description = request.Description,
                PostedUser = request.PostedUser,
                PostedBy = postedByDate,
                Attachment = relativePath,
                Status = request.Status,
                ModifiedBy = userName,
            });

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Health & Nutrition record created successfully",
                Data = new { Id = created.Id }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message} | {ex.InnerException?.Message}" });
        }
    }

    // ── PUT /api/healthnutrition/{id} ────────────────────────
    [HttpPut("{id}")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<object>>> Update(long id, [FromForm] HealthNutritionUpdateRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return Ok(new ApiResponse<object> { Success = false, Message = "Title is required." });

            if (string.IsNullOrWhiteSpace(request.Description))
                return Ok(new ApiResponse<object> { Success = false, Message = "Description is required." });

            if (string.IsNullOrWhiteSpace(request.PostedUser))
                return Ok(new ApiResponse<object> { Success = false, Message = "Posted user is required." });

            if (!DateTime.TryParse(request.PostedBy, out var postedByDate))
                return Ok(new ApiResponse<object> { Success = false, Message = "A valid posted date is required." });

            string? newRelativePath = null; // null => keep existing file (per SP contract)

            if (request.Attachment != null && request.Attachment.Length > 0)
            {
                if (request.Attachment.Length > MaxFileSizeBytes)
                    return Ok(new ApiResponse<object> { Success = false, Message = "File exceeds the 50 MB limit." });

                var ext = Path.GetExtension(request.Attachment.FileName).ToLowerInvariant();
                if (!AllowedAttachmentTypes.Contains(ext))
                    return Ok(new ApiResponse<object> { Success = false, Message = $"File type '{ext}' is not supported." });

                newRelativePath = await _fileStorageService.SaveFileAsync(
                    request.Attachment.OpenReadStream(), ModuleFolder, (int)id, request.Attachment.FileName);
            }

            var (success, oldAttachment) = await _repository.UpdateAsync(new HealthNutrition
            {
                Id = id,
                Title = request.Title,
                Description = request.Description,
                PostedUser = request.PostedUser,
                PostedBy = postedByDate,
                Attachment = newRelativePath,
                Status = request.Status,
                ModifiedBy = GetUserName(),
            });

            if (!success)
                return Ok(new ApiResponse<object> { Success = false, Message = "Record not found" });

            // Old file was replaced — clean it up from disk.
            if (!string.IsNullOrWhiteSpace(oldAttachment) && oldAttachment != "pending")
                _fileStorageService.DeleteFile(oldAttachment);

            return Ok(new ApiResponse<object>
            { Success = true, Message = "Health & Nutrition record updated successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message} | {ex.InnerException?.Message}" });
        }
    }

    // ── DELETE /api/healthnutrition/{id} ─────────────────────
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(long id)
    {
        try
        {
            var (success, attachment) = await _repository.DeleteAsync(id);
            if (!success)
                return Ok(new ApiResponse<object> { Success = false, Message = "Record not found" });

            if (!string.IsNullOrWhiteSpace(attachment) && attachment != "pending")
                _fileStorageService.DeleteFile(attachment);

            return Ok(new ApiResponse<object>
            { Success = true, Message = "Health & Nutrition record deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }
}
