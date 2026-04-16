using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using System.Data.SqlClient;
using IME.Infrastructure.Data;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NewsController : ControllerBase
{
    private readonly DatabaseContext _dbContext;

    public NewsController(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<NewsDTO>>>> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var newsList = new List<NewsDTO>();

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetAllNews", connection);

            command.Parameters.AddWithValue("@PageNumber", pageNumber);
            command.Parameters.AddWithValue("@PageSize", pageSize);

            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                newsList.Add(new NewsDTO
                {
                    NewsId = reader.GetInt32(reader.GetOrdinal("NewsId")),
                    Title = reader.GetString(reader.GetOrdinal("Title")),
                    ShortDescription = reader.IsDBNull(reader.GetOrdinal("ShortDescription")) ? null : reader.GetString(reader.GetOrdinal("ShortDescription")),
                    CoverImagePath = reader.IsDBNull(reader.GetOrdinal("CoverImagePath")) ? null : reader.GetString(reader.GetOrdinal("CoverImagePath")),
                    PublishDate = reader.GetDateTime(reader.GetOrdinal("PublishDate")),
                    AttachmentCount = reader.GetInt32(reader.GetOrdinal("AttachmentCount"))
                });
            }

            return Ok(new ApiResponse<List<NewsDTO>>
            {
                Success = true,
                Data = newsList
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<NewsDTO>>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<NewsDetailDTO>>> GetById(int id)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetNewsById", connection);

            command.Parameters.AddWithValue("@NewsId", id);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var news = new NewsDetailDTO
                {
                    NewsId = reader.GetInt32(reader.GetOrdinal("NewsId")),
                    Title = reader.GetString(reader.GetOrdinal("Title")),
                    ShortDescription = reader.IsDBNull(reader.GetOrdinal("ShortDescription")) ? null : reader.GetString(reader.GetOrdinal("ShortDescription")),
                    FullContent = reader.IsDBNull(reader.GetOrdinal("FullContent")) ? null : reader.GetString(reader.GetOrdinal("FullContent")),
                    CoverImagePath = reader.IsDBNull(reader.GetOrdinal("CoverImagePath")) ? null : reader.GetString(reader.GetOrdinal("CoverImagePath")),
                    PublishDate = reader.GetDateTime(reader.GetOrdinal("PublishDate")),
                    Attachments = new List<AttachmentDTO>()
                };

                // Read attachments from second result set
                if (await reader.NextResultAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        news.Attachments.Add(new AttachmentDTO
                        {
                            AttachmentId = reader.GetInt32(reader.GetOrdinal("AttachmentId")),
                            FileName = reader.IsDBNull(reader.GetOrdinal("FileName")) ? null : reader.GetString(reader.GetOrdinal("FileName")),
                            FilePath = reader.IsDBNull(reader.GetOrdinal("FilePath")) ? null : reader.GetString(reader.GetOrdinal("FilePath")),
                            UploadedDate = reader.GetDateTime(reader.GetOrdinal("UploadedDate"))
                        });
                    }
                }

                return Ok(new ApiResponse<NewsDetailDTO>
                {
                    Success = true,
                    Data = news
                });
            }

            return NotFound(new ApiResponse<NewsDetailDTO>
            {
                Success = false,
                Message = "News not found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<NewsDetailDTO>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] CreateNewsDTO request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_CreateNews", connection);

            command.Parameters.AddWithValue("@Title", request.Title);
            command.Parameters.AddWithValue("@ShortDescription", request.ShortDescription ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@FullContent", request.FullContent ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@CoverImagePath", request.CoverImagePath ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@CreatedBy", userId);
            command.Parameters.AddWithValue("@CreatedDate", (object?)(request.CreatedDate?.ToUniversalTime() ?? DateTime.UtcNow));

            var newsId = Convert.ToInt32(await command.ExecuteScalarAsync());

            // Send notification
            await NotificationController.CreateContentNotificationAsync(
                _dbContext,
                "News",
                newsId,
                "New News Article",
                $"New: {request.Title}"
            );

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "News created successfully",
                Data = new { NewsId = newsId }
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
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] UpdateNewsDTO request)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateCommand(
                @"UPDATE News SET
                    Title = @Title,
                    ShortDescription = @ShortDescription,
                    FullContent = @FullContent,
                    CoverImagePath = @CoverImagePath,
                    UpdatedDate = @UpdatedDate
                  WHERE NewsId = @NewsId",
                connection);

            command.Parameters.AddWithValue("@NewsId", id);
            command.Parameters.AddWithValue("@Title", request.Title);
            command.Parameters.AddWithValue("@ShortDescription", request.ShortDescription ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@FullContent", request.FullContent ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@CoverImagePath", request.CoverImagePath ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@UpdatedDate", (object?)(request.CreatedDate?.ToUniversalTime() ?? DateTime.UtcNow));

            var rowsAffected = await command.ExecuteNonQueryAsync();

            return Ok(new ApiResponse<object>
            {
                Success = rowsAffected > 0,
                Message = rowsAffected > 0 ? "News updated successfully" : "News not found"
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
                "DELETE FROM News WHERE NewsId = @NewsId",
                connection);

            command.Parameters.AddWithValue("@NewsId", id);

            var rowsAffected = await command.ExecuteNonQueryAsync();

            return Ok(new ApiResponse<object>
            {
                Success = rowsAffected > 0,
                Message = rowsAffected > 0 ? "News deleted successfully" : "News not found"
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
