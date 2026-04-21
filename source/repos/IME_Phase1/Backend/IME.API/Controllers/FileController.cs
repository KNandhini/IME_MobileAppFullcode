using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Infrastructure.Services;
using IME.Infrastructure.Data;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FileController : ControllerBase
{
    private readonly FileStorageService _fileStorageService;
    private readonly DatabaseContext _dbContext;
    private readonly string[] _allowedImageExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".bmp" };
    private readonly string[] _allowedDocumentExtensions = { ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt" };
    private readonly long _maxFileSize = 10 * 1024 * 1024; // 10MB

    public FileController(FileStorageService fileStorageService, DatabaseContext dbContext)
    {
        _fileStorageService = fileStorageService;
        _dbContext = dbContext;
    }

    [HttpPost("upload")]
    public async Task<ActionResult<ApiResponse<FileUploadResponseDTO>>> UploadFile(
        [FromForm] IFormFile file,
        [FromForm] string moduleName,
        [FromForm] int recordId)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new ApiResponse<FileUploadResponseDTO>
                {
                    Success = false,
                    Message = "No file uploaded"
                });
            }

            // Validate file size
            if (file.Length > _maxFileSize)
            {
                return BadRequest(new ApiResponse<FileUploadResponseDTO>
                {
                    Success = false,
                    Message = $"File size exceeds maximum allowed size of {_maxFileSize / (1024 * 1024)}MB"
                });
            }

            // Validate file extension
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowedExtensions = _allowedImageExtensions.Concat(_allowedDocumentExtensions).ToArray();

            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new ApiResponse<FileUploadResponseDTO>
                {
                    Success = false,
                    Message = "File type not allowed"
                });
            }

            // Save file
            var filePath = await _fileStorageService.SaveFileAsync(
                file.OpenReadStream(),
                moduleName,
                recordId,
                file.FileName
            );

            // Store file metadata in database
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_AddAttachment", connection);

            command.Parameters.AddWithValue("@TableName", moduleName);
            command.Parameters.AddWithValue("@ReferenceId", recordId);
            command.Parameters.AddWithValue("@FileName", file.FileName);
            command.Parameters.AddWithValue("@FilePath", filePath);
            command.Parameters.AddWithValue("@FileSize", file.Length);

            var attachmentId = await command.ExecuteScalarAsync();

            return Ok(new ApiResponse<FileUploadResponseDTO>
            {
                Success = true,
                Message = "File uploaded successfully",
                Data = new FileUploadResponseDTO
                {
                    FileName = file.FileName,
                    FilePath = filePath,
                    FileSize = file.Length,
                    AttachmentId = Convert.ToInt32(attachmentId)
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<FileUploadResponseDTO>
            {
                Success = false,
                Message = $"Error uploading file: {ex.Message}"
            });
        }
    }

    [HttpPost("upload-multiple")]
    public async Task<ActionResult<ApiResponse<List<FileUploadResponseDTO>>>> UploadMultipleFiles(
        [FromForm] List<IFormFile> files,
        [FromForm] string moduleName,
        [FromForm] int recordId)
    {
        try
        {
            if (files == null || files.Count == 0)
            {
                return BadRequest(new ApiResponse<List<FileUploadResponseDTO>>
                {
                    Success = false,
                    Message = "No files uploaded"
                });
            }

            var uploadedFiles = new List<FileUploadResponseDTO>();

            foreach (var file in files)
            {
                if (file.Length == 0) continue;

                // Validate file size
                if (file.Length > _maxFileSize) continue;

                // Validate file extension
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                var allowedExtensions = _allowedImageExtensions.Concat(_allowedDocumentExtensions).ToArray();
                if (!allowedExtensions.Contains(extension)) continue;

                // Save file
                var filePath = await _fileStorageService.SaveFileAsync(
                    file.OpenReadStream(),
                    moduleName,
                    recordId,
                    file.FileName
                );

                // Store file metadata in database
                using var connection = await _dbContext.CreateOpenConnectionAsync();
                using var command = _dbContext.CreateStoredProcCommand("sp_AddAttachment", connection);

                command.Parameters.AddWithValue("@TableName", moduleName);
                command.Parameters.AddWithValue("@ReferenceId", recordId);
                command.Parameters.AddWithValue("@FileName", file.FileName);
                command.Parameters.AddWithValue("@FilePath", filePath);
                command.Parameters.AddWithValue("@FileSize", file.Length);

                var attachmentId = await command.ExecuteScalarAsync();

                uploadedFiles.Add(new FileUploadResponseDTO
                {
                    FileName = file.FileName,
                    FilePath = filePath,
                    FileSize = file.Length,
                    AttachmentId = Convert.ToInt32(attachmentId)
                });
            }

            return Ok(new ApiResponse<List<FileUploadResponseDTO>>
            {
                Success = true,
                Message = $"{uploadedFiles.Count} files uploaded successfully",
                Data = uploadedFiles
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<FileUploadResponseDTO>>
            {
                Success = false,
                Message = $"Error uploading files: {ex.Message}"
            });
        }
    }

    [HttpPost("upload-profile-photo")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<FileUploadResponseDTO>>> UploadProfilePhoto(
        [FromForm] IFormFile file,
        [FromForm] int memberId)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new ApiResponse<FileUploadResponseDTO>
                {
                    Success = false,
                    Message = "No file uploaded"
                });
            }

            // Validate it's an image
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_allowedImageExtensions.Contains(extension))
            {
                return BadRequest(new ApiResponse<FileUploadResponseDTO>
                {
                    Success = false,
                    Message = "Only image files are allowed for profile photos"
                });
            }

            // Validate file size (2MB for profile photos)
            if (file.Length > 2 * 1024 * 1024)
            {
                return BadRequest(new ApiResponse<FileUploadResponseDTO>
                {
                    Success = false,
                    Message = "Profile photo size must be less than 2MB"
                });
            }

            // Read file bytes and store as BLOB in database
            byte[] photoBytes;
            using (var ms = new MemoryStream())
            {
                await file.CopyToAsync(ms);
                photoBytes = ms.ToArray();
            }

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_UpdateMemberProfilePhoto", connection);

            command.Parameters.AddWithValue("@MemberId", memberId);
            command.Parameters.AddWithValue("@ProfilePhoto", photoBytes);

            await command.ExecuteNonQueryAsync();

            return Ok(new ApiResponse<FileUploadResponseDTO>
            {
                Success = true,
                Message = "Profile photo uploaded successfully",
                Data = new FileUploadResponseDTO
                {
                    FileName = file.FileName,
                    FilePath = string.Empty,
                    FileSize = file.Length
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<FileUploadResponseDTO>
            {
                Success = false,
                Message = $"Error uploading profile photo: {ex.Message}"
            });
        }
    }

    [HttpGet("download/{*filePath}")]
    public async Task<IActionResult> DownloadFile(string filePath)
    {
        try
        {
            var fullPath = _fileStorageService.GetFullPath(filePath);

            if (!_fileStorageService.FileExists(filePath))
            {
                return NotFound(new { message = "File not found" });
            }

            var memory = new MemoryStream();
            using (var stream = new FileStream(fullPath, FileMode.Open))
            {
                await stream.CopyToAsync(memory);
            }
            memory.Position = 0;

            var fileName = Path.GetFileName(fullPath);
            var contentType = GetContentType(fileName);

            return File(memory, contentType, fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error downloading file: {ex.Message}" });
        }
    }

    [HttpDelete("delete/{attachmentId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteFile(int attachmentId, [FromQuery] string tableName)
    {
        try
        {
            // Get file path from database first
            string? filePath = null;
            using (var connection = await _dbContext.CreateOpenConnectionAsync())
            {
                string? query = tableName switch
                {
                    "Activities" => "SELECT FilePath FROM ActivityAttachments WHERE AttachmentId = @AttachmentId",
                    "News" => "SELECT FilePath FROM NewsAttachments WHERE AttachmentId = @AttachmentId",
                    "Media" => "SELECT FilePath FROM MediaAttachments WHERE AttachmentId = @AttachmentId",
                    "Podcasts" => "SELECT FilePath FROM PodcastAttachments WHERE AttachmentId = @AttachmentId",
                    "Support" => "SELECT FilePath FROM SupportAttachments WHERE AttachmentId = @AttachmentId",
                    "GOCircular" => "SELECT FilePath FROM GOCircularAttachments WHERE AttachmentId = @AttachmentId",
                    "Achievements" => "SELECT FilePath FROM AchievementAttachments WHERE AttachmentId = @AttachmentId",
                    _ => null
                };

                if (query == null)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Invalid table name"
                    });
                }

                using var command = _dbContext.CreateCommand(query, connection);
                command.Parameters.AddWithValue("@AttachmentId", attachmentId);

                var result = await command.ExecuteScalarAsync();
                if (result != null)
                {
                    filePath = result.ToString();
                }
            }

            if (string.IsNullOrEmpty(filePath))
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "File not found"
                });
            }

            // Delete from database
            using (var connection = await _dbContext.CreateOpenConnectionAsync())
            {
                string? deleteQuery = tableName switch
                {
                    "Activities" => "DELETE FROM ActivityAttachments WHERE AttachmentId = @AttachmentId",
                    "News" => "DELETE FROM NewsAttachments WHERE AttachmentId = @AttachmentId",
                    "Media" => "DELETE FROM MediaAttachments WHERE AttachmentId = @AttachmentId",
                    "Podcasts" => "DELETE FROM PodcastAttachments WHERE AttachmentId = @AttachmentId",
                    "Support" => "DELETE FROM SupportAttachments WHERE AttachmentId = @AttachmentId",
                    "GOCircular" => "DELETE FROM GOCircularAttachments WHERE AttachmentId = @AttachmentId",
                    "Achievements" => "DELETE FROM AchievementAttachments WHERE AttachmentId = @AttachmentId",
                    _ => null
                };

                if (deleteQuery != null)
                {
                    using var command = _dbContext.CreateCommand(deleteQuery, connection);
                    command.Parameters.AddWithValue("@AttachmentId", attachmentId);
                    await command.ExecuteNonQueryAsync();
                }
            }

            // Delete physical file
            _fileStorageService.DeleteFile(filePath);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "File deleted successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error deleting file: {ex.Message}"
            });
        }
    }

    private string GetContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".bmp" => "image/bmp",
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".txt" => "text/plain",
            _ => "application/octet-stream"
        };
    }
}
