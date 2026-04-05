using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using System.Data.SqlClient;
using IME.Infrastructure.Data;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PodcastsController : ControllerBase
{
    private readonly DatabaseContext _dbContext;

    public PodcastsController(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<PodcastDTO>>>> GetAll()
    {
        try
        {
            var podcasts = new List<PodcastDTO>();

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetAllPodcasts", connection);

            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                podcasts.Add(new PodcastDTO
                {
                    PodcastId = reader.GetInt32(reader.GetOrdinal("PodcastId")),
                    Title = reader.GetString(reader.GetOrdinal("Title")),
                    Speaker = reader.IsDBNull(reader.GetOrdinal("Speaker")) ? null : reader.GetString(reader.GetOrdinal("Speaker")),
                    Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                    MediaFilePath = reader.IsDBNull(reader.GetOrdinal("MediaFilePath")) ? null : reader.GetString(reader.GetOrdinal("MediaFilePath")),
                    MediaLink = reader.IsDBNull(reader.GetOrdinal("MediaLink")) ? null : reader.GetString(reader.GetOrdinal("MediaLink")),
                    Duration = reader.IsDBNull(reader.GetOrdinal("Duration")) ? null : reader.GetString(reader.GetOrdinal("Duration")),
                    PublishDate = reader.GetDateTime(reader.GetOrdinal("PublishDate"))
                });
            }

            return Ok(new ApiResponse<List<PodcastDTO>>
            {
                Success = true,
                Data = podcasts
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<PodcastDTO>>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<PodcastDetailDTO>>> GetById(int id)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateCommand(
                "SELECT * FROM Podcasts WHERE PodcastId = @PodcastId",
                connection);

            command.Parameters.AddWithValue("@PodcastId", id);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var podcast = new PodcastDetailDTO
                {
                    PodcastId = reader.GetInt32(reader.GetOrdinal("PodcastId")),
                    Title = reader.GetString(reader.GetOrdinal("Title")),
                    Speaker = reader.IsDBNull(reader.GetOrdinal("Speaker")) ? null : reader.GetString(reader.GetOrdinal("Speaker")),
                    Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                    MediaFilePath = reader.IsDBNull(reader.GetOrdinal("MediaFilePath")) ? null : reader.GetString(reader.GetOrdinal("MediaFilePath")),
                    MediaLink = reader.IsDBNull(reader.GetOrdinal("MediaLink")) ? null : reader.GetString(reader.GetOrdinal("MediaLink")),
                    Duration = reader.IsDBNull(reader.GetOrdinal("Duration")) ? null : reader.GetString(reader.GetOrdinal("Duration")),
                    PublishDate = reader.GetDateTime(reader.GetOrdinal("PublishDate")),
                    Attachments = new List<AttachmentDTO>()
                };

                reader.Close();

                // Get attachments
                using var attachCommand = _dbContext.CreateCommand(
                    "SELECT * FROM PodcastAttachments WHERE PodcastId = @PodcastId",
                    connection);
                attachCommand.Parameters.AddWithValue("@PodcastId", id);

                using var attachReader = await attachCommand.ExecuteReaderAsync();
                while (await attachReader.ReadAsync())
                {
                    podcast.Attachments.Add(new AttachmentDTO
                    {
                        AttachmentId = attachReader.GetInt32(attachReader.GetOrdinal("AttachmentId")),
                        FileName = attachReader.IsDBNull(attachReader.GetOrdinal("FileName")) ? null : attachReader.GetString(attachReader.GetOrdinal("FileName")),
                        FilePath = attachReader.IsDBNull(attachReader.GetOrdinal("FilePath")) ? null : attachReader.GetString(attachReader.GetOrdinal("FilePath")),
                        UploadedDate = attachReader.GetDateTime(attachReader.GetOrdinal("UploadedDate"))
                    });
                }

                return Ok(new ApiResponse<PodcastDetailDTO>
                {
                    Success = true,
                    Data = podcast
                });
            }

            return NotFound(new ApiResponse<PodcastDetailDTO>
            {
                Success = false,
                Message = "Podcast not found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<PodcastDetailDTO>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] CreatePodcastDTO request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_CreatePodcast", connection);

            command.Parameters.AddWithValue("@Title", request.Title);
            command.Parameters.AddWithValue("@Speaker", request.Speaker ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@Description", request.Description ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@MediaFilePath", request.MediaFilePath ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@MediaLink", request.MediaLink ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@Duration", request.Duration ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@CreatedBy", userId);

            var podcastId = Convert.ToInt32(await command.ExecuteScalarAsync());

            // Send notification
            await NotificationController.CreateContentNotificationAsync(
                _dbContext,
                "Podcasts",
                podcastId,
                "New Podcast Added",
                $"New podcast: {request.Title}"
            );

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Podcast created successfully",
                Data = new { PodcastId = podcastId }
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

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] UpdatePodcastDTO request)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateCommand(
                @"UPDATE Podcasts SET
                    Title = @Title,
                    Speaker = @Speaker,
                    Description = @Description,
                    MediaFilePath = @MediaFilePath,
                    MediaLink = @MediaLink,
                    Duration = @Duration
                  WHERE PodcastId = @PodcastId",
                connection);

            command.Parameters.AddWithValue("@PodcastId", id);
            command.Parameters.AddWithValue("@Title", request.Title);
            command.Parameters.AddWithValue("@Speaker", request.Speaker ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@Description", request.Description ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@MediaFilePath", request.MediaFilePath ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@MediaLink", request.MediaLink ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@Duration", request.Duration ?? (object)DBNull.Value);

            var rowsAffected = await command.ExecuteNonQueryAsync();

            return Ok(new ApiResponse<object>
            {
                Success = rowsAffected > 0,
                Message = rowsAffected > 0 ? "Podcast updated successfully" : "Podcast not found"
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
                "DELETE FROM Podcasts WHERE PodcastId = @PodcastId",
                connection);

            command.Parameters.AddWithValue("@PodcastId", id);

            var rowsAffected = await command.ExecuteNonQueryAsync();

            return Ok(new ApiResponse<object>
            {
                Success = rowsAffected > 0,
                Message = rowsAffected > 0 ? "Podcast deleted successfully" : "Podcast not found"
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
