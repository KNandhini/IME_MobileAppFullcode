// MagazinesController.cs
// Place in: IME.API/Controllers/MagazinesController.cs

using IME.API.Requests;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
//[Authorize]
public class MagazinesController : ControllerBase
{
    private readonly IMagazineRepository _magazineRepository;
    private readonly FileStorageService _fileStorageService;

    private static readonly string[] AllowedAttachmentTypes =
        { ".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx" };

    public MagazinesController(
        IMagazineRepository magazineRepository,
        FileStorageService fileStorageService)
    {
        _magazineRepository = magazineRepository;
        _fileStorageService = fileStorageService;
    }

    private string BuildFileUrl(string? relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            return string.Empty;

        return Path.Combine(
            Directory.GetCurrentDirectory(),
            
            relativePath.Replace('/', Path.DirectorySeparatorChar)
                        .Replace('\\', Path.DirectorySeparatorChar));
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
    private string GetUserName() =>
      User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
    // ── GET /api/magazines ─────────────────────────────────
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<MagazineDTO>>>> GetAll()
    {
        try
        {
            var magazines = await _magazineRepository.GetAllMagazinesAsync();
            foreach (var m in magazines)
                m.AttachmentPath = BuildFileUrl(m.AttachmentPath);

            return Ok(new ApiResponse<List<MagazineDTO>> { Success = true, Data = magazines });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<MagazineDTO>>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── GET /api/magazines/{id} ────────────────────────────
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<MagazineDetailDTO>>> GetById(int id)
    {
        try
        {
            var magazine = await _magazineRepository.GetMagazineByIdAsync(id);
            if (magazine == null)
                return NotFound(new ApiResponse<MagazineDetailDTO>
                { Success = false, Message = "Magazine not found" });

            foreach (var att in magazine.Attachments ?? [])
                att.FilePath = BuildFileUrl(att.FilePath);
            magazine.AttachmentPath = magazine.Attachments?.FirstOrDefault()?.FilePath;

            return Ok(new ApiResponse<MagazineDetailDTO> { Success = true, Data = magazine });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<MagazineDetailDTO>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── POST /api/magazines ────────────────────────────────
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromForm] MagazineCreateRequest request)
    {
        try
        {
            var userId = GetUserId();

            var magazine = new Magazine
            {
                Title = request.Title,
                Description = request.Description,
                IssueNumber = request.IssueNumber,
                PublishedDate = DateTime.TryParse(request.PublishedDate, out var dt) ? dt : DateTime.UtcNow,
                AuthorName = request.AuthorName,
                Category = request.Category,
                CreatedBy = userId,
                CreatedDate = DateTime.UtcNow,
            };
            var magazineId = await _magazineRepository.CreateMagazineAsync(magazine);

            // Save multiple attachments (PDF, cover image, docs, etc.)
            if (request.Files != null)
            {
                foreach (var file in request.Files)
                {
                    if (file.Length == 0 || file.Length > 50 * 1024 * 1024) continue;
                    var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                    if (!AllowedAttachmentTypes.Contains(ext)) continue;

                    var relativePath = await _fileStorageService.SaveFileAsync(
                        file.OpenReadStream(), "Magazines", magazineId, file.FileName);
                    var fullFilePath = _fileStorageService.GetFullPath(relativePath);
                    await _magazineRepository.AddMagazineAttachmentAsync(
                        magazineId, file.FileName, fullFilePath, userId);
                }
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Magazine created successfully",
                Data = new { MagazineId = magazineId }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message} | {ex.InnerException?.Message}" });
        }
    }
    // ── PUT /api/magazines/{id} ────────────────────────────
    [HttpPut("{id}")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromForm] MagazineUpdateRequest request)
    {
        try
        {
            var userId = GetUserId();

            var magazine = new Magazine
            {
                MagazineId = id,
                Title = request.Title,
                Description = request.Description,
                IssueNumber = request.IssueNumber,
                PublishedDate = DateTime.TryParse(request.PublishedDate, out var dt) ? dt : DateTime.UtcNow,
                AuthorName = request.AuthorName,
                Category = request.Category,
            };

            var success = await _magazineRepository.UpdateMagazineAsync(magazine);
            if (!success)
                return Ok(new ApiResponse<object> { Success = false, Message = "Magazine not found" });

            // Add any new attachments provided during edit (existing ones are untouched)
            if (request.Files != null)
            {
                foreach (var file in request.Files)
                {
                    if (file.Length == 0 || file.Length > 50 * 1024 * 1024) continue;
                    var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                    if (!AllowedAttachmentTypes.Contains(ext)) continue;


                    var relativePath = await _fileStorageService.SaveFileAsync(
                        file.OpenReadStream(), "Magazines", id, file.FileName);

                    var fullFilePath = _fileStorageService.GetFullPath(relativePath);

                    await _magazineRepository.AddMagazineAttachmentAsync(id, file.FileName, fullFilePath, userId);
                }
            }

            return Ok(new ApiResponse<object> { Success = true, Message = "Magazine updated successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message} | {ex.InnerException?.Message}" });
        }
    }

    // ── DELETE /api/magazines/{id} ─────────────────────────
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        try
        {
            var success = await _magazineRepository.DeleteMagazineAsync(id);
            return Ok(new ApiResponse<object>
            {
                Success = success,
                Message = success ? "Magazine deleted successfully" : "Magazine not found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── GET /api/magazines/{id}/attachments ────────────────
    [HttpGet("{id}/attachments")]
    public async Task<ActionResult<ApiResponse<List<MagazineAttachmentDTO>>>> GetAttachments(int id)
    {
        try
        {
            var attachments = await _magazineRepository.GetMagazineAttachmentsAsync(id);
            foreach (var att in attachments)
                att.FilePath = BuildFileUrl(att.FilePath);
            return Ok(new ApiResponse<List<MagazineAttachmentDTO>> { Success = true, Data = attachments });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<MagazineAttachmentDTO>>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── POST /api/magazines/{id}/attachments ───────────────
    [HttpPost("{id}/attachments")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<List<MagazineAttachmentDTO>>>> UploadAttachments(
        int id, [FromForm] List<IFormFile> files)
    {
        try
        {
            if (files == null || files.Count == 0)
                return Ok(new ApiResponse<List<MagazineAttachmentDTO>>
                { Success = false, Message = "No files provided." });

            var magazine = await _magazineRepository.GetMagazineByIdAsync(id);
            if (magazine == null)
                return NotFound(new ApiResponse<List<MagazineAttachmentDTO>>
                { Success = false, Message = "Magazine not found." });

            var userId = GetUserId();
            var saved = new List<MagazineAttachmentDTO>();

            foreach (var file in files)
            {
                if (file.Length == 0 || file.Length > 50 * 1024 * 1024) continue;
                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!AllowedAttachmentTypes.Contains(ext)) continue;

                var relativePath = await _fileStorageService.SaveFileAsync(
    file.OpenReadStream(),
    "Magazines",
    id,
    file.FileName);

                var fullFilePath = _fileStorageService.GetFullPath(relativePath);

                var att = await _magazineRepository.AddMagazineAttachmentAsync(
                    id,
                    file.FileName,
                    fullFilePath,
                    userId);

                att.FilePath = BuildFileUrl(att.FilePath);
                saved.Add(att);
            }

            if (saved.Count == 0)
                return Ok(new ApiResponse<List<MagazineAttachmentDTO>>
                { Success = false, Message = "No valid files were uploaded." });

            return Ok(new ApiResponse<List<MagazineAttachmentDTO>>
            {
                Success = true,
                Message = $"{saved.Count} file(s) uploaded successfully.",
                Data = saved
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<MagazineAttachmentDTO>>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── DELETE /api/magazines/attachments/{attachmentId} ───
    [HttpDelete("attachments/{attachmentId}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteAttachment(int attachmentId)
    {
        try
        {
            var deleted = await _magazineRepository.DeleteMagazineAttachmentAsync(attachmentId);
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
    // ── GET /api/magazines/{id}/discussion ──────────────────
    [HttpGet("{id}/discussion")]
    public async Task<ActionResult<ApiResponse<List<ForumDiscussionDto>>>> GetForumDiscussion(int id)
    {
        try
        {
            var discussion = await _magazineRepository.GetForumDiscussionAsync(id);
            return Ok(new ApiResponse<List<ForumDiscussionDto>> { Success = true, Data = discussion });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<ForumDiscussionDto>>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── POST /api/magazines/{id}/discussion ─────────────────
    [HttpPost("{id}/discussion")]
    public async Task<ActionResult<ApiResponse<ForumDiscussionDto>>> AddForumDiscussion(
        int id, [FromBody] ForumDiscussionRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Comment))
                return Ok(new ApiResponse<ForumDiscussionDto>
                { Success = false, Message = "Comment cannot be empty." });
            var userId = request.MemberId;
            var userName = request.MemberName;

            var inserted = await _magazineRepository.AddForumDiscussionAsync(
                id, userId, userName, request.Comment);

            return Ok(new ApiResponse<ForumDiscussionDto>
            {
                Success = true,
                Message = "Discussion posted successfully",
                Data = inserted
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<ForumDiscussionDto>
            { Success = false, Message = $"Error: {ex.Message} | {ex.InnerException?.Message}" });
        }
    }
}