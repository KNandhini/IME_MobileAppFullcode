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
public class CircularController : ControllerBase
{
    private readonly DatabaseContext   _dbContext;
    private readonly FileStorageService _fileStorageService;

    private static readonly string[] AllowedImageTypes = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    private static readonly string[] AllowedVideoTypes = { ".mp4", ".mov", ".avi", ".mkv", ".webm" };
    private static readonly string[] AllowedDocTypes   = { ".pdf", ".doc", ".docx" };

    public CircularController(DatabaseContext dbContext, FileStorageService fileStorageService)
    {
        _dbContext          = dbContext;
        _fileStorageService = fileStorageService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<CircularDTO>>>> GetAll()
    {
        try
        {
            var circulars = new List<CircularDTO>();

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command    = _dbContext.CreateStoredProcCommand("sp_GetAllCirculars", connection);
            using var reader     = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                circulars.Add(new CircularDTO
                {
                    CircularId      = reader.GetInt32(reader.GetOrdinal("CircularId")),
                    Title           = reader.GetString(reader.GetOrdinal("Title")),
                    Description     = reader.IsDBNull(reader.GetOrdinal("Description"))     ? null : reader.GetString(reader.GetOrdinal("Description")),
                    CircularNumber  = reader.IsDBNull(reader.GetOrdinal("CircularNumber"))  ? null : reader.GetString(reader.GetOrdinal("CircularNumber")),
                    PublishDate     = reader.GetDateTime(reader.GetOrdinal("PublishDate")),
                    AttachmentCount = reader.GetInt32(reader.GetOrdinal("AttachmentCount"))
                });
            }

            return Ok(new ApiResponse<List<CircularDTO>> { Success = true, Data = circulars });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<CircularDTO>> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<CircularDetailDTO>>> GetById(int id)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command    = _dbContext.CreateCommand(
                "SELECT * FROM tbl_GOCircular WHERE CircularId = @CircularId", connection);
            command.Parameters.AddWithValue("@CircularId", id);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var circular = new CircularDetailDTO
                {
                    CircularId     = reader.GetInt32(reader.GetOrdinal("CircularId")),
                    Title          = reader.GetString(reader.GetOrdinal("Title")),
                    Description    = reader.IsDBNull(reader.GetOrdinal("Description"))    ? null : reader.GetString(reader.GetOrdinal("Description")),
                    CircularNumber = reader.IsDBNull(reader.GetOrdinal("CircularNumber")) ? null : reader.GetString(reader.GetOrdinal("CircularNumber")),
                    PublishDate    = reader.GetDateTime(reader.GetOrdinal("PublishDate")),
                    CreatedDate    = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                    Attachments    = new List<AttachmentDTO>()
                };
                reader.Close();

                using var attachCmd = _dbContext.CreateCommand(
                    "SELECT * FROM tbl_GOCircularAttachments WHERE CircularId = @CircularId", connection);
                attachCmd.Parameters.AddWithValue("@CircularId", id);

                using var attachReader = await attachCmd.ExecuteReaderAsync();
                while (await attachReader.ReadAsync())
                {
                    circular.Attachments.Add(new AttachmentDTO
                    {
                        AttachmentId = attachReader.GetInt32(attachReader.GetOrdinal("AttachmentId")),
                        FileName     = attachReader.IsDBNull(attachReader.GetOrdinal("FileName"))   ? null : attachReader.GetString(attachReader.GetOrdinal("FileName")),
                        FilePath     = attachReader.IsDBNull(attachReader.GetOrdinal("FilePath"))   ? null : attachReader.GetString(attachReader.GetOrdinal("FilePath")),
                        UploadedDate = attachReader.GetDateTime(attachReader.GetOrdinal("UploadedDate"))
                    });
                }

                return Ok(new ApiResponse<CircularDetailDTO> { Success = true, Data = circular });
            }

            return NotFound(new ApiResponse<CircularDetailDTO> { Success = false, Message = "Circular not found" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<CircularDetailDTO> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // GET attachment file
    [HttpGet("attachment/{attachmentId}")]
    public async Task<IActionResult> GetAttachment(int attachmentId)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command    = _dbContext.CreateCommand(
                "SELECT FileName, FilePath FROM tbl_GOCircularAttachments WHERE AttachmentId = @AttachmentId",
                connection);
            command.Parameters.AddWithValue("@AttachmentId", attachmentId);

            using var reader = await command.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) return NotFound();

            var fileName = reader.IsDBNull(0) ? "file" : reader.GetString(0);
            var filePath = reader.IsDBNull(1) ? null   : reader.GetString(1);
            reader.Close();

            if (string.IsNullOrEmpty(filePath) || !_fileStorageService.FileExists(filePath))
                return NotFound("File not found on disk.");

            var fullPath    = _fileStorageService.GetFullPath(filePath);
            var ext         = Path.GetExtension(fileName).ToLowerInvariant();
            var contentType = GetContentType(ext);
            return PhysicalFile(fullPath, contentType, fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error: {ex.Message}");
        }
    }

    // DELETE attachment
    [HttpDelete("attachment/{attachmentId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAttachment(int attachmentId)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var selectCmd  = _dbContext.CreateCommand(
                "SELECT FilePath FROM tbl_GOCircularAttachments WHERE AttachmentId = @AttachmentId", connection);
            selectCmd.Parameters.AddWithValue("@AttachmentId", attachmentId);

            var filePath = (await selectCmd.ExecuteScalarAsync())?.ToString();
            if (filePath != null) _fileStorageService.DeleteFile(filePath);

            using var deleteCmd = _dbContext.CreateCommand(
                "DELETE FROM tbl_GOCircularAttachments WHERE AttachmentId = @AttachmentId", connection);
            deleteCmd.Parameters.AddWithValue("@AttachmentId", attachmentId);
            await deleteCmd.ExecuteNonQueryAsync();

            return Ok(new ApiResponse<object> { Success = true, Message = "Attachment deleted" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    [DisableRequestSizeLimit]
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)]
    public async Task<ActionResult<ApiResponse<object>>> Create(
        [FromForm] string title,
        [FromForm] string? description,
        [FromForm] string? circularNumber,
        [FromForm] string publishDate,
        [FromForm] List<IFormFile>? files)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command    = _dbContext.CreateStoredProcCommand("sp_CreateCircular", connection);

            command.Parameters.AddWithValue("@Title",          title);
            command.Parameters.AddWithValue("@Description",    description    ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@CircularNumber", circularNumber ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@PublishDate",    DateTime.Parse(publishDate));
            command.Parameters.AddWithValue("@CreatedBy",      userId);

            var circularId = Convert.ToInt32(await command.ExecuteScalarAsync());

            await SaveAttachments(circularId, files, connection);

            await NotificationController.CreateContentNotificationAsync(
                _dbContext, "Circular", circularId, "New GO & Circular", $"New circular: {title}");

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Circular created successfully",
                Data    = new { CircularId = circularId }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

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
        [FromForm] List<IFormFile>? files)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command    = _dbContext.CreateStoredProcCommand("sp_UpdateCircular", connection);

            command.Parameters.AddWithValue("@CircularId",     id);
            command.Parameters.AddWithValue("@Title",          title);
            command.Parameters.AddWithValue("@Description",    description    ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@CircularNumber", circularNumber ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@PublishDate",    DateTime.Parse(publishDate));

            await command.ExecuteNonQueryAsync();

            await SaveAttachments(id, files, connection);

            return Ok(new ApiResponse<object> { Success = true, Message = "Circular updated successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command    = _dbContext.CreateStoredProcCommand("sp_DeleteCircular", connection);
            command.Parameters.AddWithValue("@CircularId", id);
            await command.ExecuteNonQueryAsync();

            return Ok(new ApiResponse<object> { Success = true, Message = "Circular deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = ex.Message });
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private async Task SaveAttachments(int circularId, List<IFormFile>? files, SqlConnection connection)
    {
        if (files == null || files.Count == 0) return;

        foreach (var file in files)
        {
            if (file.Length == 0 || file.Length > 50 * 1024 * 1024) continue;

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedImageTypes.Contains(ext) && !AllowedVideoTypes.Contains(ext) && !AllowedDocTypes.Contains(ext))
                continue;

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            ms.Position = 0;

            var filePath = await _fileStorageService.SaveFileAsync(ms, "Circular", circularId, file.FileName);

            using var insertCmd = _dbContext.CreateCommand(
                @"INSERT INTO tbl_GOCircularAttachments (CircularId, FileName, FilePath, UploadedDate)
                  VALUES (@CircularId, @FileName, @FilePath, GETDATE())",
                connection);
            insertCmd.Parameters.AddWithValue("@CircularId", circularId);
            insertCmd.Parameters.AddWithValue("@FileName",   file.FileName);
            insertCmd.Parameters.AddWithValue("@FilePath",   filePath);
            await insertCmd.ExecuteNonQueryAsync();
        }
    }

    private static string GetContentType(string ext) => ext switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png"            => "image/png",
        ".gif"            => "image/gif",
        ".webp"           => "image/webp",
        ".pdf"            => "application/pdf",
        ".mp4"            => "video/mp4",
        ".mov"            => "video/quicktime",
        ".avi"            => "video/x-msvideo",
        ".mkv"            => "video/x-matroska",
        ".webm"           => "video/webm",
        ".doc"            => "application/msword",
        ".docx"           => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        _                 => "application/octet-stream"
    };
}
