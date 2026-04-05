using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using System.Data.SqlClient;
using IME.Infrastructure.Data;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SupportController : ControllerBase
{
    private readonly DatabaseContext _dbContext;

    public SupportController(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("categories")]
    public async Task<ActionResult<ApiResponse<List<SupportCategoryDTO>>>> GetCategories()
    {
        try
        {
            var categories = new List<SupportCategoryDTO>();

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateCommand(
                "SELECT * FROM SupportCategory WHERE IsActive = 1 ORDER BY CategoryName",
                connection);

            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                categories.Add(new SupportCategoryDTO
                {
                    CategoryId = reader.GetInt32(reader.GetOrdinal("CategoryId")),
                    CategoryName = reader.GetString(reader.GetOrdinal("CategoryName")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                });
            }

            return Ok(new ApiResponse<List<SupportCategoryDTO>>
            {
                Success = true,
                Data = categories
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<SupportCategoryDTO>>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpGet("category/{categoryId}")]
    public async Task<ActionResult<ApiResponse<List<SupportDTO>>>> GetByCategory(int categoryId)
    {
        try
        {
            var supportList = new List<SupportDTO>();

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetSupportByCategory", connection);

            command.Parameters.AddWithValue("@CategoryId", categoryId);

            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                supportList.Add(new SupportDTO
                {
                    SupportId = reader.GetInt32(reader.GetOrdinal("SupportId")),
                    PhotoPath = reader.IsDBNull(reader.GetOrdinal("PhotoPath")) ? null : reader.GetString(reader.GetOrdinal("PhotoPath")),
                    PersonName = reader.IsDBNull(reader.GetOrdinal("PersonName")) ? null : reader.GetString(reader.GetOrdinal("PersonName")),
                    Title = reader.GetString(reader.GetOrdinal("Title")),
                    Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                    SupportDate = reader.IsDBNull(reader.GetOrdinal("SupportDate")) ? null : reader.GetDateTime(reader.GetOrdinal("SupportDate")),
                    CompanyOrIndividual = reader.IsDBNull(reader.GetOrdinal("CompanyOrIndividual")) ? null : reader.GetString(reader.GetOrdinal("CompanyOrIndividual")),
                    CategoryName = reader.GetString(reader.GetOrdinal("CategoryName")),
                    CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate"))
                });
            }

            return Ok(new ApiResponse<List<SupportDTO>>
            {
                Success = true,
                Data = supportList
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<SupportDTO>>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<SupportDetailDTO>>> GetById(int id)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetSupportById", connection);

            command.Parameters.AddWithValue("@SupportId", id);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var support = new SupportDetailDTO
                {
                    SupportId = reader.GetInt32(reader.GetOrdinal("SupportId")),
                    CategoryId = reader.GetInt32(reader.GetOrdinal("CategoryId")),
                    PhotoPath = reader.IsDBNull(reader.GetOrdinal("PhotoPath")) ? null : reader.GetString(reader.GetOrdinal("PhotoPath")),
                    PersonName = reader.IsDBNull(reader.GetOrdinal("PersonName")) ? null : reader.GetString(reader.GetOrdinal("PersonName")),
                    Title = reader.GetString(reader.GetOrdinal("Title")),
                    Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                    SupportDate = reader.IsDBNull(reader.GetOrdinal("SupportDate")) ? null : reader.GetDateTime(reader.GetOrdinal("SupportDate")),
                    CompanyOrIndividual = reader.IsDBNull(reader.GetOrdinal("CompanyOrIndividual")) ? null : reader.GetString(reader.GetOrdinal("CompanyOrIndividual")),
                    Attachments = new List<AttachmentDTO>()
                };

                // Read attachments from second result set
                if (await reader.NextResultAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        support.Attachments.Add(new AttachmentDTO
                        {
                            AttachmentId = reader.GetInt32(reader.GetOrdinal("AttachmentId")),
                            FileName = reader.IsDBNull(reader.GetOrdinal("FileName")) ? null : reader.GetString(reader.GetOrdinal("FileName")),
                            FilePath = reader.IsDBNull(reader.GetOrdinal("FilePath")) ? null : reader.GetString(reader.GetOrdinal("FilePath")),
                            UploadedDate = reader.GetDateTime(reader.GetOrdinal("UploadedDate"))
                        });
                    }
                }

                return Ok(new ApiResponse<SupportDetailDTO>
                {
                    Success = true,
                    Data = support
                });
            }

            return NotFound(new ApiResponse<SupportDetailDTO>
            {
                Success = false,
                Message = "Support entry not found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<SupportDetailDTO>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] CreateSupportDTO request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_CreateSupport", connection);

            command.Parameters.AddWithValue("@CategoryId", request.CategoryId);
            command.Parameters.AddWithValue("@PhotoPath", request.PhotoPath ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@PersonName", request.PersonName ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@Title", request.Title);
            command.Parameters.AddWithValue("@Description", request.Description ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@SupportDate", request.SupportDate ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@CompanyOrIndividual", request.CompanyOrIndividual ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@CreatedBy", userId);

            var supportId = Convert.ToInt32(await command.ExecuteScalarAsync());

            // Send notification
            await NotificationController.CreateContentNotificationAsync(
                _dbContext,
                "Support",
                supportId,
                "New Support Entry",
                $"New support: {request.Title}"
            );

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Support entry created successfully",
                Data = new { SupportId = supportId }
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
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] UpdateSupportDTO request)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateCommand(
                @"UPDATE SupportEntries SET
                    CategoryId = @CategoryId,
                    PhotoPath = @PhotoPath,
                    PersonName = @PersonName,
                    Title = @Title,
                    Description = @Description,
                    SupportDate = @SupportDate,
                    CompanyOrIndividual = @CompanyOrIndividual,
                    UpdatedDate = GETDATE()
                  WHERE SupportId = @SupportId",
                connection);

            command.Parameters.AddWithValue("@SupportId", id);
            command.Parameters.AddWithValue("@CategoryId", request.CategoryId);
            command.Parameters.AddWithValue("@PhotoPath", request.PhotoPath ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@PersonName", request.PersonName ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@Title", request.Title);
            command.Parameters.AddWithValue("@Description", request.Description ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@SupportDate", request.SupportDate ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@CompanyOrIndividual", request.CompanyOrIndividual ?? (object)DBNull.Value);

            var rowsAffected = await command.ExecuteNonQueryAsync();

            return Ok(new ApiResponse<object>
            {
                Success = rowsAffected > 0,
                Message = rowsAffected > 0 ? "Support entry updated successfully" : "Support entry not found"
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
                "DELETE FROM SupportEntries WHERE SupportId = @SupportId",
                connection);

            command.Parameters.AddWithValue("@SupportId", id);

            var rowsAffected = await command.ExecuteNonQueryAsync();

            return Ok(new ApiResponse<object>
            {
                Success = rowsAffected > 0,
                Message = rowsAffected > 0 ? "Support entry deleted successfully" : "Support entry not found"
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
