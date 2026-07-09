using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Infrastructure.Services;
using System.Security.Claims;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
//[Authorize]
public class FeedController : ControllerBase
{
    private readonly IFeedRepository _feedRepository;
    private readonly FileStorageService _fileStorageService;

    private static readonly string[] AllowedImageTypes = { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" };
    private static readonly string[] AllowedVideoTypes = { ".mp4", ".mov", ".avi", ".mkv", ".webm" };

    public FeedController(IFeedRepository feedRepository, FileStorageService fileStorageService)
    {
        _feedRepository = feedRepository;
        _fileStorageService = fileStorageService;
    }

    // ── GET /api/feed?pageNumber=1&pageSize=10 ────────────
    [HttpGet]
    public async Task<ActionResult<ApiResponse<FeedResponseDTO>>> GetFeed(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int? viewerUserId = int.TryParse(userIdClaim, out var uid) && uid > 0 ? uid : null;
            var feed = await _feedRepository.GetFeedAsync(pageNumber, pageSize, viewerUserId);
            return Ok(new ApiResponse<FeedResponseDTO> { Success = true, Data = feed });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<FeedResponseDTO> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── GET /api/feed/member/{memberId} ──────────────────────
    /*[HttpGet("member/{memberId:int}")]
    public async Task<ActionResult<ApiResponse<FeedResponseDTO>>> GetMemberFeed(
        int memberId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            // Viewer's own MemberId (matches tbl_Members.MemberId, used for the club-match check)
            var viewerMemberIdClaim = User.FindFirst("MemberId")?.Value;
            int? viewerId = int.TryParse(viewerMemberIdClaim, out var vid) && vid > 0 ? vid : null;

            var feed = await _feedRepository.GetMemberFeedAsync(memberId, pageNumber, pageSize, viewerId);
            return Ok(new ApiResponse<FeedResponseDTO> { Success = true, Data = feed });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<FeedResponseDTO> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }*/

    [HttpGet("member/{memberId:int}")]
    public async Task<ActionResult<ApiResponse<FeedResponseDTO>>> GetMemberFeed(
    int memberId,
    [FromQuery] int pageNumber = 1,
    [FromQuery] int pageSize = 10,
    [FromQuery] int? viewerId = null)
    {
        try
        {
            // Prefer an explicitly passed viewerId (from frontend), but fall back to
            // the authenticated user's own MemberId claim if none was passed.
            if (viewerId is null || viewerId <= 0)
            {
                var viewerMemberIdClaim = User.FindFirst("MemberId")?.Value;
                viewerId = int.TryParse(viewerMemberIdClaim, out var vid) && vid > 0 ? vid : null;
            }

            var feed = await _feedRepository.GetMemberFeedAsync(memberId, pageNumber, pageSize, viewerId);
            return Ok(new ApiResponse<FeedResponseDTO> { Success = true, Data = feed });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<FeedResponseDTO> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── POST /api/feed/post  (multipart: content + files[] + clubId) ─
    [HttpPost("post")]
    public async Task<ActionResult<ApiResponse<object>>> CreatePost(
        [FromForm] string? content,
        [FromForm] List<IFormFile>? files,
        [FromForm] string? createdDate,
        [FromForm] int? clubId)
    {
        try
        {
            var memberIdClaim = User.FindFirst("MemberId")?.Value
                             ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(memberIdClaim, out var memberId) || memberId <= 0)
                return Ok(new ApiResponse<object> { Success = false, Message = "Member not found in token." });

            if (string.IsNullOrWhiteSpace(content) && (files == null || files.Count == 0))
                return Ok(new ApiResponse<object> { Success = false, Message = "Post must have content or at least one media file." });

            DateTime? postedDate = null;
            if (!string.IsNullOrWhiteSpace(createdDate) &&
                DateTime.TryParse(createdDate, null, System.Globalization.DateTimeStyles.RoundtripKind, out var parsed))
                postedDate = parsed.ToUniversalTime();

            // 0 (or missing) = Public; any positive value = Private to that club
            int resolvedClubId = clubId.GetValueOrDefault(0);

            var postId = await _feedRepository.CreatePostAsync(memberId, content, postedDate, resolvedClubId);
            if (postId <= 0)
                return Ok(new ApiResponse<object> { Success = false, Message = "Failed to create post." });

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
                    if (AllowedImageTypes.Contains(ext)) mediaType = "image";
                    else if (AllowedVideoTypes.Contains(ext)) mediaType = "video";
                    else continue;

                    var ms = new MemoryStream();
                    await file.CopyToAsync(ms);
                    ms.Position = 0;
                    validFiles.Add((ms, file.FileName, mediaType, order++));
                }

                var saveTasks = validFiles.Select(f =>
    _fileStorageService.SaveFileAsync(f.Stream, "Posts", postId, f.FileName)
        .ContinueWith(t =>
        {
            var relativePath = t.Result;
            var fullPath = _fileStorageService.GetFullPath(relativePath);
            return (Path: fullPath, f.MediaType, f.Order);
        }));

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
                Data = new { PostId = postId, MediaCount = savedMedia.Count }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── DELETE /api/feed/post/{postId} ───────────────────────
    // Deletes a post owned by the calling member, removes its media rows,
    // then deletes the physical files from disk.
    [HttpDelete("post/{postId:int}")]
    public async Task<ActionResult<ApiResponse<object>>> DeletePost(int postId)
    {
        try
        {
            var memberIdClaim = User.FindFirst("MemberId")?.Value
                             ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(memberIdClaim, out var memberId) || memberId <= 0)
                return Ok(new ApiResponse<object> { Success = false, Message = "Member not found in token." });

            var (success, filePaths) = await _feedRepository.DeletePostAsync(postId, memberId);

            if (!success)
                return Ok(new ApiResponse<object> { Success = false, Message = "Post not found or you don't have permission to delete it." });

            // Best-effort cleanup of physical files; don't fail the request if this errors
            foreach (var path in filePaths)
            {
                try
                {
                    if (_fileStorageService.FileExists(path))
                        _fileStorageService.DeleteFile(path);
                }
                catch
                {
                    // DB delete already succeeded — file cleanup failure shouldn't block the response
                }
            }

            return Ok(new ApiResponse<object> { Success = true, Message = "Post deleted successfully." });
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
            using var connection = await GetDbContext().CreateOpenConnectionAsync();
            using var cmd = GetDbContext().CreateCommand(
                "SELECT FilePath, MediaType FROM tbl_PostMedia WHERE MediaId = @MediaId", connection);
            cmd.Parameters.AddWithValue("@MediaId", mediaId);

            string? filePath = null;
            string mediaType = "image";

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                filePath = reader.IsDBNull(0) ? null : reader.GetString(0);
                mediaType = reader.IsDBNull(1) ? "image" : reader.GetString(1);
            }

            if (string.IsNullOrEmpty(filePath) || !_fileStorageService.FileExists(filePath))
                return NotFound();

            var fullPath = _fileStorageService.GetFullPath(filePath);
            var ext = Path.GetExtension(filePath).ToLowerInvariant();
            var contentType = mediaType == "video" ? GetVideoContentType(ext) : GetImageContentType(ext);

            var bytes = await System.IO.File.ReadAllBytesAsync(fullPath);
            return File(bytes, contentType);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // ── POST /api/feed/post/{postId}/like ─────────────────
    [HttpPost("post/{postId:int}/like")]
    public async Task<ActionResult<ApiResponse<LikeToggleResultDTO>>> ToggleLike(int postId)
    {
        try
        {
            var memberIdClaim = User.FindFirst("MemberId")?.Value
                             ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(memberIdClaim, out var memberId) || memberId <= 0)
                return Ok(new ApiResponse<LikeToggleResultDTO> { Success = false, Message = "Member not found in token." });

            var result = await _feedRepository.ToggleLikeAsync(postId, memberId);
            return Ok(new ApiResponse<LikeToggleResultDTO> { Success = true, Data = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<LikeToggleResultDTO> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── POST /api/feed/post/{postId}/comment ──────────────
   
    [HttpPost("post/{postId:int}/comment")]
    public async Task<ActionResult<ApiResponse<PostCommentDTO>>> AddComment(int postId, [FromBody] AddCommentRequestDTO request)
    {
        try
        {
            var memberIdClaim = User.FindFirst("MemberId")?.Value
                             ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(memberIdClaim, out var memberId) || memberId <= 0)
                return Ok(new ApiResponse<PostCommentDTO> { Success = false, Message = "Member not found in token." });

            if (string.IsNullOrWhiteSpace(request?.CommentDetails))
                return Ok(new ApiResponse<PostCommentDTO> { Success = false, Message = "Comment cannot be empty." });

            var comment = await _feedRepository.AddCommentAsync(postId, memberId, request.CommentDetails.Trim());
            return Ok(new ApiResponse<PostCommentDTO> { Success = true, Data = comment });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<PostCommentDTO> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── GET /api/feed/post/{postId}/comments ──────────────
    [HttpGet("post/{postId:int}/comments")]
    public async Task<ActionResult<ApiResponse<List<PostCommentDTO>>>> GetPostComments(int postId)
    {
        try
        {
            var comments = await _feedRepository.GetPostCommentsAsync(postId);
            return Ok(new ApiResponse<List<PostCommentDTO>> { Success = true, Data = comments });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<PostCommentDTO>> { Success = false, Message = $"Error: {ex.Message}" });
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
        ".png" => "image/png",
        ".gif" => "image/gif",
        ".bmp" => "image/bmp",
        ".webp" => "image/webp",
        _ => "application/octet-stream"
    };

    private static string GetVideoContentType(string ext) => ext switch
    {
        ".mp4" => "video/mp4",
        ".mov" => "video/quicktime",
        ".avi" => "video/x-msvideo",
        ".mkv" => "video/x-matroska",
        ".webm" => "video/webm",
        _ => "application/octet-stream"
    };
}