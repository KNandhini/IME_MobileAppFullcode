using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Infrastructure.Services;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CircularController : ControllerBase
{
    private readonly ICircularRepository _circularRepository;
    private readonly FileStorageService _fileStorageService;

    private static readonly string[] AllowedTypes =
        { ".jpg", ".jpeg", ".png", ".gif", ".webp",
          ".mp4", ".mov", ".avi", ".mkv", ".webm",
          ".pdf", ".doc", ".docx" };

    public CircularController(ICircularRepository circularRepository, FileStorageService fileStorageService)
    {
        _circularRepository = circularRepository;
        _fileStorageService = fileStorageService;
    }

    private string BuildFileUrl(string? relativePath)
    {
        if (string.IsNullOrEmpty(relativePath)) return string.Empty;
        return $"{Request.Scheme}://{Request.Host}/uploads/{relativePath.Replace('\\', '/')}";
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    // ── GET /api/circular ─────────────────────────────────────
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<CircularDTO>>>> GetAll()
    {
        try
        {
            var circulars = await _circularRepository.GetAllCircularsAsync();
            return Ok(new ApiResponse<List<CircularDTO>> { Success = true, Data = circulars });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<CircularDTO>>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── GET /api/circular/my-club ─────────────────────────────
    [HttpGet("my-club")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<CircularDTO>>>> GetMyClub()
    {
        try
        {
            var userId = GetUserId();
            var clubId = await GetAdminClubIdAsync(userId);
            if (clubId == null)
                return Ok(new ApiResponse<List<CircularDTO>> { Success = true, Data = new List<CircularDTO>() });
            var circulars = await _circularRepository.GetCircularsByClubAsync(clubId.Value);
            return Ok(new ApiResponse<List<CircularDTO>> { Success = true, Data = circulars });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<CircularDTO>>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── GET /api/circular/{id} ────────────────────────────────
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<CircularDetailDTO>>> GetById(int id)
    {
        try
        {
            var circular = await _circularRepository.GetCircularByIdAsync(id);
            if (circular == null)
                return NotFound(new ApiResponse<CircularDetailDTO>
                { Success = false, Message = "Circular not found" });

            foreach (var att in circular.Attachments)
                att.FilePath = BuildFileUrl(att.FilePath);

            return Ok(new ApiResponse<CircularDetailDTO> { Success = true, Data = circular });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<CircularDetailDTO>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── POST /api/circular ────────────────────────────────────
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [DisableRequestSizeLimit]
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)]
    public async Task<ActionResult<ApiResponse<object>>> Create(
        [FromForm] string title,
        [FromForm] string? description,
        [FromForm] string? circularNumber,
        [FromForm] string publishDate,
        [FromForm] string? visibility,
        [FromForm] List<IFormFile>? files)
    {
        try
        {
            var userId = GetUserId();
            var clubId = await GetAdminClubIdAsync(userId);
            var circularId = await _circularRepository.CreateCircularAsync(
                title, description, circularNumber,
                DateTime.Parse(publishDate), userId,
                clubId, visibility ?? "All");

            await SaveAttachments(circularId, files);

            await NotificationController.CreateContentNotificationAsync(
                HttpContext.RequestServices.GetRequiredService<IME.Infrastructure.Data.DatabaseContext>(),
                "Circular", circularId, "New GO & Circular", $"New circular: {title}");

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Circular created successfully",
                Data = new { CircularId = circularId }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── PUT /api/circular/{id} ────────────────────────────────
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    [DisableRequestSizeLimit]
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)]
    public async Task<ActionResult<ApiResponse<object>>> Update(
        int id,
        [FromForm] string title,
        [FromForm] string? description,
        [FromForm] string? circularNumber,
        [FromForm] string publishDate,
        [FromForm] string? visibility,
        [FromForm] List<IFormFile>? files)
    {
        try
        {
            await _circularRepository.UpdateCircularAsync(
                id, title, description, circularNumber, DateTime.Parse(publishDate), visibility);

            await SaveAttachments(id, files);

            return Ok(new ApiResponse<object> { Success = true, Message = "Circular updated successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── DELETE /api/circular/{id} ─────────────────────────────
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        try
        {
            await _circularRepository.DeleteCircularAsync(id);
            return Ok(new ApiResponse<object> { Success = true, Message = "Circular deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── DELETE /api/circular/attachment/{attachmentId} ────────
    [HttpDelete("attachment/{attachmentId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteAttachment(int attachmentId)
    {
        try
        {
            await _circularRepository.DeleteCircularAttachmentAsync(attachmentId);
            return Ok(new ApiResponse<object> { Success = true, Message = "Attachment deleted" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── GET /api/circular/attachment/{attachmentId} ───────────
    [HttpGet("attachment/{attachmentId}")]
    public async Task<IActionResult> GetAttachment(int attachmentId)
    {
        try
        {
            var attachments = await _circularRepository.GetCircularAttachmentsAsync(0);
            // fallback: direct query since we only have circularId-based fetch in repo
            using var connection = await HttpContext.RequestServices
                .GetRequiredService<IME.Infrastructure.Data.DatabaseContext>()
                .CreateOpenConnectionAsync();
            using var cmd = HttpContext.RequestServices
                .GetRequiredService<IME.Infrastructure.Data.DatabaseContext>()
                .CreateCommand(
                    "SELECT FileName, FilePath FROM tbl_GOCircularAttachments WHERE AttachmentId = @AttachmentId",
                    connection);
            cmd.Parameters.AddWithValue("@AttachmentId", attachmentId);
            using var reader = await cmd.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) return NotFound();

            var fileName = reader.IsDBNull(0) ? "file" : reader.GetString(0);
            var filePath = reader.IsDBNull(1) ? null : reader.GetString(1);
            reader.Close();

            if (string.IsNullOrEmpty(filePath) || !_fileStorageService.FileExists(filePath))
                return NotFound("File not found on disk.");

            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            var contentType = GetContentType(ext);
            return PhysicalFile(_fileStorageService.GetFullPath(filePath), contentType, fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error: {ex.Message}");
        }
    }

    // ── Helpers ───────────────────────────────────────────────
    private async Task<int?> GetAdminClubIdAsync(int userId)
    {
        using var connection = await HttpContext.RequestServices
            .GetRequiredService<IME.Infrastructure.Data.DatabaseContext>()
            .CreateOpenConnectionAsync();
        using var cmd = HttpContext.RequestServices
            .GetRequiredService<IME.Infrastructure.Data.DatabaseContext>()
            .CreateCommand("SELECT ClubId FROM Members WHERE UserId = @UserId", connection);
        cmd.Parameters.AddWithValue("@UserId", userId);
        var result = await cmd.ExecuteScalarAsync();
        return result == null || result == DBNull.Value ? null : Convert.ToInt32(result);
    }

    private async Task SaveAttachments(int circularId, List<IFormFile>? files)
    {
        if (files == null || files.Count == 0) return;
        foreach (var file in files)
        {
            if (file.Length == 0 || file.Length > 50 * 1024 * 1024) continue;
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedTypes.Contains(ext)) continue;

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            ms.Position = 0;

            var filePath = await _fileStorageService.SaveFileAsync(ms, "Circular", circularId, file.FileName);
            await _circularRepository.AddCircularAttachmentAsync(circularId, file.FileName, filePath);
        }
    }

    private static string GetContentType(string ext) => ext switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".gif" => "image/gif",
        ".webp" => "image/webp",
        ".pdf" => "application/pdf",
        ".mp4" => "video/mp4",
        ".mov" => "video/quicktime",
        ".avi" => "video/x-msvideo",
        ".mkv" => "video/x-matroska",
        ".webm" => "video/webm",
        ".doc" => "application/msword",
        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        _ => "application/octet-stream"
    };
}