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
        ".jpg", ".jpeg", ".png", ".gif", ".webp",             // images
        ".heic", ".heif", ".bmp", ".tiff", ".tif", ".svg",
        ".pdf", ".doc", ".docx", ".xls", ".xlsx",
        ".ppt", ".pptx", ".txt", ".rtf", ".odt", ".ods", ".odp", // documents
        ".mp3", ".wav", ".m4a", ".aac", ".opus", ".ogg",
        ".mpeg", ".mpga", ".wma", ".flac", ".amr",             // audio
        ".mp4", ".avi", ".mov", ".mkv", ".webm", ".3gp", ".wmv", ".flv", // video
        ".zip", ".rar", ".7z",                                  // compressed
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
    // BuildFileUrl turns the stored relative path (e.g. "HealthNutrition-3/abc123.mp4",
    // relative to the "Uploads" folder — see FileStorageService.SaveFileAsync) into an
    // absolute URL the client can actually stream/download from. Program.cs maps that
    // same "Uploads" folder to the public "/Uploads" static-files route, so the URL
    // just needs {scheme}://{host}/Uploads/{relativePath}.
    //
    // Previously this returned a server-side filesystem path (e.g.
    // "/home/site/wwwroot/HealthNutrition-3/abc123.mp4") — not a fetchable URL at all,
    // and missing the "Uploads/" segment besides — which is why attachments wouldn't
    // play or download on-device even though the file existed on disk.
    private string BuildFileUrl(string? relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath) || relativePath == "pending")
            return string.Empty;

        var normalized = relativePath.Replace('\\', '/').TrimStart('/');

        // Use the actual incoming request's scheme + host (port included) so this
        // works correctly against both a local dev server (e.g. http://10.0.2.2:5000
        // as seen from the Android emulator) and production (https://imei.co.in).
        // NOTE: if this API is ever deployed behind a reverse proxy that terminates
        // TLS without forwarding the original scheme/host (no UseForwardedHeaders
        // configured), Request.Scheme can under-report as "http" — revisit this if
        // that setup is introduced later.
        return $"{Request.Scheme}://{Request.Host}/Uploads/{normalized}";
    }

    private string GetUserName() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown";

    // ── GET /api/healthnutrition ─────────────────────────────
    // Accepts the same query params the app already sends
    // (search, sortDirection, pageNumber, pageSize) and returns a
    // paginated envelope: { items, pageNumber, pageSize, totalCount, totalPages }.
    [HttpGet]
    public async Task<ActionResult<ApiResponse<HealthNutritionListDTO>>> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] string sortDirection = "DESC",
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var items = await _repository.GetAllAsync();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                items = items.Where(i =>
                    (i.Title?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||
                    (i.Description?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false))
                    .ToList();
            }

            items = string.Equals(sortDirection, "ASC", StringComparison.OrdinalIgnoreCase)
                ? items.OrderBy(i => i.PostedBy).ToList()
                : items.OrderByDescending(i => i.PostedBy).ToList();

            var totalCount = items.Count;
            var safePageSize = pageSize <= 0 ? 20 : pageSize;
            var totalPages = (int)Math.Ceiling(totalCount / (double)safePageSize);
            var safePageNumber = pageNumber <= 0 ? 1 : pageNumber;

            var pageItems = items
                .Skip((safePageNumber - 1) * safePageSize)
                .Take(safePageSize)
                .ToList();

            foreach (var item in pageItems)
                item.AttachmentPath = BuildFileUrl(item.AttachmentPath);

            var result = new HealthNutritionListDTO
            {
                Items = pageItems,
                PageNumber = safePageNumber,
                PageSize = safePageSize,
                TotalCount = totalCount,
                TotalPages = totalPages,
            };

            return Ok(new ApiResponse<HealthNutritionListDTO> { Success = true, Data = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<HealthNutritionListDTO>
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