using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using System.Data.SqlClient;
using IME.Infrastructure.Data;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MediaController : ControllerBase
{
    private readonly DatabaseContext _dbContext;

    public MediaController(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<MediaDTO>>>> GetAll([FromQuery] string? mediaType = null)
    {
        try
        {
            var mediaList = new List<MediaDTO>();

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetAllMedia", connection);

            command.Parameters.AddWithValue("@MediaType", mediaType ?? (object)DBNull.Value);

            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                mediaList.Add(new MediaDTO
                {
                    MediaId = reader.GetInt32(reader.GetOrdinal("MediaId")),
                    Title = reader.IsDBNull(reader.GetOrdinal("Title")) ? null : reader.GetString(reader.GetOrdinal("Title")),
                    MediaType = reader.IsDBNull(reader.GetOrdinal("MediaType")) ? null : reader.GetString(reader.GetOrdinal("MediaType")),
                    Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                    FilePath = reader.IsDBNull(reader.GetOrdinal("FilePath")) ? null : reader.GetString(reader.GetOrdinal("FilePath")),
                    ThumbnailPath = reader.IsDBNull(reader.GetOrdinal("ThumbnailPath")) ? null : reader.GetString(reader.GetOrdinal("ThumbnailPath")),
                    EventDate = reader.IsDBNull(reader.GetOrdinal("EventDate")) ? null : reader.GetDateTime(reader.GetOrdinal("EventDate")),
                    CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate"))
                });
            }

            return Ok(new ApiResponse<List<MediaDTO>>
            {
                Success = true,
                Data = mediaList
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<MediaDTO>>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<MediaDetailDTO>>> GetById(int id)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateCommand(
                "SELECT * FROM Media WHERE MediaId = @MediaId",
                connection);

            command.Parameters.AddWithValue("@MediaId", id);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var media = new MediaDetailDTO
                {
                    MediaId = reader.GetInt32(reader.GetOrdinal("MediaId")),
                    Title = reader.IsDBNull(reader.GetOrdinal("Title")) ? null : reader.GetString(reader.GetOrdinal("Title")),
                    MediaType = reader.IsDBNull(reader.GetOrdinal("MediaType")) ? null : reader.GetString(reader.GetOrdinal("MediaType")),
                    Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                    FilePath = reader.IsDBNull(reader.GetOrdinal("FilePath")) ? null : reader.GetString(reader.GetOrdinal("FilePath")),
                    ThumbnailPath = reader.IsDBNull(reader.GetOrdinal("ThumbnailPath")) ? null : reader.GetString(reader.GetOrdinal("ThumbnailPath")),
                    EventDate = reader.IsDBNull(reader.GetOrdinal("EventDate")) ? null : reader.GetDateTime(reader.GetOrdinal("EventDate")),
                    Attachments = new List<AttachmentDTO>()
                };

                reader.Close();

                // Get attachments
                using var attachCommand = _dbContext.CreateCommand(
                    "SELECT * FROM MediaAttachments WHERE MediaId = @MediaId",
                    connection);
                attachCommand.Parameters.AddWithValue("@MediaId", id);

                using var attachReader = await attachCommand.ExecuteReaderAsync();
                while (await attachReader.ReadAsync())
                {
                    media.Attachments.Add(new AttachmentDTO
                    {
                        AttachmentId = attachReader.GetInt32(attachReader.GetOrdinal("AttachmentId")),
                        FilePath = attachReader.IsDBNull(attachReader.GetOrdinal("FilePath")) ? null : attachReader.GetString(attachReader.GetOrdinal("FilePath")),
                        UploadedDate = attachReader.GetDateTime(attachReader.GetOrdinal("UploadedDate"))
                    });
                }

                return Ok(new ApiResponse<MediaDetailDTO>
                {
                    Success = true,
                    Data = media
                });
            }

            return NotFound(new ApiResponse<MediaDetailDTO>
            {
                Success = false,
                Message = "Media not found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<MediaDetailDTO>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] CreateMediaDTO request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_CreateMedia", connection);

            command.Parameters.AddWithValue("@Title", request.Title ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@MediaType", request.MediaType ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@Description", request.Description ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@FilePath", request.FilePath ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@ThumbnailPath", request.ThumbnailPath ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@EventDate", request.EventDate ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@CreatedBy", userId);

            var mediaId = Convert.ToInt32(await command.ExecuteScalarAsync());

            // Send notification
            await NotificationController.CreateContentNotificationAsync(
                _dbContext,
                "Media",
                mediaId,
                "New Media Added",
                $"New media: {request.Title ?? "Photo/Video"}"
            );

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Media created successfully",
                Data = new { MediaId = mediaId }
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
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateCommand(
                "DELETE FROM Media WHERE MediaId = @MediaId",
                connection);

            command.Parameters.AddWithValue("@MediaId", id);

            var rowsAffected = await command.ExecuteNonQueryAsync();

            return Ok(new ApiResponse<object>
            {
                Success = rowsAffected > 0,
                Message = rowsAffected > 0 ? "Media deleted successfully" : "Media not found"
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
}
