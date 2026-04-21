using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Infrastructure.Services;
using System.Security.Claims;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FeedController : ControllerBase
{
    private readonly IFeedRepository     _feedRepository;
    private readonly FileStorageService  _fileStorageService;

    private static readonly string[] AllowedImageTypes = { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" };
    private static readonly string[] AllowedVideoTypes = { ".mp4", ".mov", ".avi", ".mkv", ".webm" };

    public FeedController(IFeedRepository feedRepository, FileStorageService fileStorageService)
    {
        _feedRepository     = feedRepository;
        _fileStorageService = fileStorageService;
    }

    // ── GET /api/feed?pageNumber=1&pageSize=10 ────────────
    [HttpGet]
    public async Task<ActionResult<ApiResponse<FeedResponseDTO>>> GetFeed(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize   = 10)
    {
        try
        {
            var feed = await _feedRepository.GetFeedAsync(pageNumber, pageSize);
            return Ok(new ApiResponse<FeedResponseDTO> { Success = true, Data = feed });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<FeedResponseDTO> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── POST /api/feed/post  (multipart: content + files[]) ─
    [HttpPost("post")]
    public async Task<ActionResult<ApiResponse<object>>> CreatePost(
        [FromForm] string? content,
        [FromForm] List<IFormFile>? files,
        [FromForm] string? createdDate)
    {
        try
        {
            var memberIdClaim = User.FindFirst("MemberId")?.Value
                             ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(memberIdClaim, out var memberId) || memberId <= 0)
                return Ok(new ApiResponse<object> { Success = false, Message = "Member not found in token." });

            if (string.IsNullOrWhiteSpace(content) && (files == null || files.Count == 0))
                return Ok(new ApiResponse<object> { Success = false, Message = "Post must have content or at least one media file." });

            // Parse mobile datetime; fall back to server UTC if missing or invalid
            DateTime? postedDate = null;
            if (!string.IsNullOrWhiteSpace(createdDate) &&
                DateTime.TryParse(createdDate, null, System.Globalization.DateTimeStyles.RoundtripKind, out var parsed))
                postedDate = parsed.ToUniversalTime();

            // Create the post record first
            var postId = await _feedRepository.CreatePostAsync(memberId, content, postedDate);
            if (postId <= 0)
                return Ok(new ApiResponse<object> { Success = false, Message = "Failed to create post." });

            // Buffer all valid files into memory first, then save in parallel
            var savedMedia = new List<FeedMediaDTO>();
            if (files != null && files.Count > 0)
            {
                var validFiles = new List<(MemoryStream Stream, string FileName, string MediaType, int Order)>();
                int order = 1;
                foreach (var file in files)
                {
                    if (file.Length == 0 || file.Length > 50 * 1024 * 1024) continue;
                    var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                    string mediaType;
                    if (AllowedImageTypes.Contains(ext))      mediaType = "image";
                    else if (AllowedVideoTypes.Contains(ext)) mediaType = "video";
                    else                                       continue;

                    var ms = new MemoryStream();
                    await file.CopyToAsync(ms);
                    ms.Position = 0;
                    validFiles.Add((ms, file.FileName, mediaType, order++));
                }

                // Save all files to disk in parallel, then insert DB records sequentially
                var saveTasks = validFiles.Select(f =>
                    _fileStorageService.SaveFileAsync(f.Stream, "Posts", postId, f.FileName)
                        .ContinueWith(t => (Path: t.Result, f.MediaType, f.Order)));

                var results = await Task.WhenAll(saveTasks);
                foreach (var r in results.OrderBy(r => r.Order))
                {
                    var media = await _feedRepository.AddPostMediaAsync(postId, r.Path, r.MediaType, r.Order);
                    savedMedia.Add(media);
                }

                foreach (var (ms, _, _, _) in validFiles) ms.Dispose();
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Post created successfully.",
                Data    = new { PostId = postId, MediaCount = savedMedia.Count }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── GET /api/feed/media/{mediaId}  (serves media file) ─
    [HttpGet("media/{mediaId:int}")]
    [AllowAnonymous] // GUID-based paths are not guessable; auth would block Image component
    public async Task<IActionResult> GetMedia(int mediaId)
    {
        try
        {
            // Look up the file path from PostMedia table via a direct query
            using var connection = await GetDbContext().CreateOpenConnectionAsync();
            using var cmd = GetDbContext().CreateCommand(
                "SELECT FilePath, MediaType FROM tbl_PostMedia WHERE MediaId = @MediaId", connection);
            cmd.Parameters.AddWithValue("@MediaId", mediaId);

            string? filePath  = null;
            string  mediaType = "image";

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                filePath  = reader.IsDBNull(0) ? null : reader.GetString(0);
                mediaType = reader.IsDBNull(1) ? "image" : reader.GetString(1);
            }

            if (string.IsNullOrEmpty(filePath) || !_fileStorageService.FileExists(filePath))
                return NotFound();

            var fullPath    = _fileStorageService.GetFullPath(filePath);
            var ext         = Path.GetExtension(filePath).ToLowerInvariant();
            var contentType = mediaType == "video" ? GetVideoContentType(ext) : GetImageContentType(ext);

            var bytes = await System.IO.File.ReadAllBytesAsync(fullPath);
            return File(bytes, contentType);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // ── Helpers ───────────────────────────────────────────
    private IME.Infrastructure.Data.DatabaseContext GetDbContext()
    {
        return HttpContext.RequestServices.GetRequiredService<IME.Infrastructure.Data.DatabaseContext>();
    }

    private static string GetImageContentType(string ext) => ext switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png"            => "image/png",
        ".gif"            => "image/gif",
        ".bmp"            => "image/bmp",
        ".webp"           => "image/webp",
        _                 => "application/octet-stream"
    };

    private static string GetVideoContentType(string ext) => ext switch
    {
        ".mp4"  => "video/mp4",
        ".mov"  => "video/quicktime",
        ".avi"  => "video/x-msvideo",
        ".mkv"  => "video/x-matroska",
        ".webm" => "video/webm",
        _       => "application/octet-stream"
    };
}
