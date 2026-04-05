using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using System.Data.SqlClient;
using IME.Infrastructure.Data;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContentController : ControllerBase
{
    private readonly DatabaseContext _dbContext;

    public ContentController(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("{pageKey}")]
    public async Task<ActionResult<ApiResponse<ContentPageDTO>>> GetByKey(string pageKey)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetContentByKey", connection);

            command.Parameters.AddWithValue("@PageKey", pageKey);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var content = new ContentPageDTO
                {
                    PageId = reader.GetInt32(reader.GetOrdinal("PageId")),
                    PageKey = reader.GetString(reader.GetOrdinal("PageKey")),
                    PageTitle = reader.GetString(reader.GetOrdinal("PageTitle")),
                    Content = reader.IsDBNull(reader.GetOrdinal("Content")) ? null : reader.GetString(reader.GetOrdinal("Content")),
                    CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                    UpdatedDate = reader.IsDBNull(reader.GetOrdinal("UpdatedDate")) ? null : reader.GetDateTime(reader.GetOrdinal("UpdatedDate"))
                };

                return Ok(new ApiResponse<ContentPageDTO>
                {
                    Success = true,
                    Data = content
                });
            }

            return NotFound(new ApiResponse<ContentPageDTO>
            {
                Success = false,
                Message = "Content page not found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<ContentPageDTO>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPut("{pageKey}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Update(string pageKey, [FromBody] UpdateContentDTO request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_UpdateContent", connection);

            command.Parameters.AddWithValue("@PageKey", pageKey);
            command.Parameters.AddWithValue("@PageTitle", request.PageTitle);
            command.Parameters.AddWithValue("@Content", request.Content ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@UpdatedBy", userId);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var rowsAffected = reader.GetInt32(reader.GetOrdinal("RowsAffected"));

                return Ok(new ApiResponse<object>
                {
                    Success = rowsAffected > 0,
                    Message = rowsAffected > 0 ? "Content updated successfully" : "Content not found"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = false,
                Message = "Failed to update content"
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

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ContentPageDTO>>>> GetAll()
    {
        try
        {
            var pages = new List<ContentPageDTO>();

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateCommand(
                "SELECT PageId, PageKey, PageTitle, CreatedDate, UpdatedDate FROM StaticContentPages ORDER BY PageTitle",
                connection);

            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                pages.Add(new ContentPageDTO
                {
                    PageId = reader.GetInt32(reader.GetOrdinal("PageId")),
                    PageKey = reader.GetString(reader.GetOrdinal("PageKey")),
                    PageTitle = reader.GetString(reader.GetOrdinal("PageTitle")),
                    CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                    UpdatedDate = reader.IsDBNull(reader.GetOrdinal("UpdatedDate")) ? null : reader.GetDateTime(reader.GetOrdinal("UpdatedDate"))
                });
            }

            return Ok(new ApiResponse<List<ContentPageDTO>>
            {
                Success = true,
                Data = pages
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<ContentPageDTO>>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }
}
