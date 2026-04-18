using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http.Features;   // ? ADD
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Infrastructure.Services;

namespace IME.API.Controllers;

[ApiController]
[Route("api/support")]
[Authorize]
public class SupportController : ControllerBase
{
    private readonly ISupportRepository _repository;
    private readonly FileStorageService _fileStorageService;

    private static readonly string[] AllowedImageTypes = { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" };
    private static readonly string[] AllowedVideoTypes = { ".mp4", ".mov", ".avi", ".mkv", ".webm" };
    private static readonly string[] AllowedDocTypes = { ".pdf", ".doc", ".docx" };

    public SupportController(ISupportRepository repository, FileStorageService fileStorageService)
    {
        _repository = repository;
        _fileStorageService = fileStorageService;
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var result = await _repository.GetActiveCategoriesAsync();
        return Ok(result);
    }

    [HttpGet("category/{categoryId:int}")]
    public async Task<IActionResult> GetByCategory(int categoryId)
    {
        var result = await _repository.GetByCategoryAsync(categoryId);
        return Ok(result);
    }

    [HttpGet("{supportId:int}")]
    public async Task<IActionResult> Get(int supportId)
    {
        var result = await _repository.GetByIdAsync(supportId);
        return result == null ? NotFound() : Ok(result);
    }

    // ?? POST api/support ??????????????????????????????????????????????????????
    [HttpPost]
    [DisableRequestSizeLimit]                                        // ? ADD
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)]        // ? ADD
    public async Task<IActionResult> Create(
        [FromForm] int categoryId,
        [FromForm] string? personName,
        [FromForm] string? title,
        [FromForm] string? description,
        [FromForm] string? supportDate,
        [FromForm] string? companyOrIndividual,
        [FromForm] string? companyName,
        [FromForm] string? amount,
        [FromForm] int createdBy,
        [FromForm] List<IFormFile>? files)
    {
        var dto = new CreateSupportDTO
        {
            CategoryId = categoryId,
            PersonName = personName,
            Title = title ?? string.Empty,
            Description = description,
            SupportDate = string.IsNullOrEmpty(supportDate) ? null : DateTime.Parse(supportDate),
            CompanyOrIndividual = companyOrIndividual,
            CompanyName = companyName,
            Amount = decimal.TryParse(amount, out var amt) ? amt : null,
            CreatedBy = createdBy,
        };

        var newId = await _repository.CreateAsync(dto);
        if (newId == 0) return BadRequest("Failed to create support record.");

        await SaveAttachments(newId, files);

        var created = await _repository.GetByIdAsync(newId);
        return Ok(new { success = true, data = created });
    }

    // ?? PUT api/support/{supportId} ???????????????????????????????????????????
    [HttpPut("{supportId:int}")]
    [DisableRequestSizeLimit]                                        // ? ADD
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)]        // ? ADD
    public async Task<IActionResult> Update(
        int supportId,
        [FromForm] int categoryId,
        [FromForm] string? personName,
        [FromForm] string? title,
        [FromForm] string? description,
        [FromForm] string? supportDate,
        [FromForm] string? companyOrIndividual,
        [FromForm] string? companyName,
        [FromForm] string? amount,
        [FromForm] List<IFormFile>? files)
    {
        var dto = new UpdateSupportDTO
        {
            CategoryId = categoryId,
            PersonName = personName,
            Title = title ?? string.Empty,
            Description = description,
            SupportDate = string.IsNullOrEmpty(supportDate) ? null : DateTime.Parse(supportDate),
            CompanyOrIndividual = companyOrIndividual,
            CompanyName = companyName,
            Amount = decimal.TryParse(amount, out var amt) ? amt : null,
        };

        var success = await _repository.UpdateAsync(supportId, dto);
        if (!success) return NotFound($"Support {supportId} not found.");

        await SaveAttachments(supportId, files);

        var updated = await _repository.GetByIdAsync(supportId);
        return Ok(new { success = true, data = updated });
    }

    [HttpDelete("{supportId:int}")]
    public async Task<IActionResult> Delete(int supportId)
    {
        var success = await _repository.DeleteAsync(supportId);
        if (!success) return NotFound($"Support {supportId} not found.");
        return NoContent();
    }

    [HttpGet("attachment/{attachmentId:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAttachment(int attachmentId)
    {
        var attachment = await _repository.GetAttachmentByIdAsync(attachmentId);
        if (attachment == null || string.IsNullOrEmpty(attachment.FilePath))
            return NotFound();

        if (!_fileStorageService.FileExists(attachment.FilePath))
            return NotFound();

        var fullPath = _fileStorageService.GetFullPath(attachment.FilePath);
        var ext = Path.GetExtension(attachment.FilePath).ToLowerInvariant();
        var contentType = GetContentType(ext);
        var bytes = await System.IO.File.ReadAllBytesAsync(fullPath);

        return File(bytes, contentType, attachment.FileName);
    }

    [HttpDelete("attachment/{attachmentId:int}")]
    public async Task<IActionResult> DeleteAttachment(int attachmentId)
    {
        var success = await _repository.DeleteAttachmentAsync(attachmentId);
        if (!success) return NotFound($"Attachment {attachmentId} not found.");
        return NoContent();
    }

    // ?? Helpers ???????????????????????????????????????????????????????????????
    private async Task SaveAttachments(int supportId, List<IFormFile>? files)
    {
        if (files == null || files.Count == 0) return;

        int order = 1;
        foreach (var file in files)
        {
            if (file.Length == 0 || file.Length > 50 * 1024 * 1024) continue;

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

            string mediaType;
            if (AllowedImageTypes.Contains(ext)) mediaType = "image";
            else if (AllowedVideoTypes.Contains(ext)) mediaType = "video";
            else if (AllowedDocTypes.Contains(ext)) mediaType = "document";
            else continue;

            // ? Copy to MemoryStream FIRST — prevents IFormFile stream
            //    being disposed before SaveFileAsync finishes reading it
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            ms.Position = 0;

            var filePath = await _fileStorageService.SaveFileAsync(
                ms, "Support", supportId, file.FileName);

            await _repository.AddAttachmentAsync(new AddAttachmentDTO
            {
                SupportId = supportId,
                FileName = file.FileName,
                FilePath = filePath,
                MediaType = mediaType,
                SortOrder = order++,
            });
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
        _ => "application/octet-stream"
    };
}