using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using System.Data.SqlClient;
using IME.Infrastructure.Data;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AchievementsController : ControllerBase
{
    private readonly DatabaseContext _dbContext;

    public AchievementsController(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<AchievementDTO>>>> GetAll()
    {
        try
        {
            var achievements = new List<AchievementDTO>();

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetAllAchievements", connection);

            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                achievements.Add(new AchievementDTO
                {
                    AchievementId = reader.GetInt32(reader.GetOrdinal("AchievementId")),
                    MemberName = reader.GetString(reader.GetOrdinal("MemberName")),
                    PhotoPath = reader.IsDBNull(reader.GetOrdinal("PhotoPath")) ? null : reader.GetString(reader.GetOrdinal("PhotoPath")),
                    Title = reader.GetString(reader.GetOrdinal("Title")),
                    Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                    AchievementDate = reader.IsDBNull(reader.GetOrdinal("AchievementDate")) ? null : reader.GetDateTime(reader.GetOrdinal("AchievementDate")),
                    CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate"))
                });
            }

            return Ok(new ApiResponse<List<AchievementDTO>>
            {
                Success = true,
                Data = achievements
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<AchievementDTO>>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<AchievementDetailDTO>>> GetById(int id)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateCommand(
                "SELECT * FROM Achievements WHERE AchievementId = @AchievementId",
                connection);

            command.Parameters.AddWithValue("@AchievementId", id);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var achievement = new AchievementDetailDTO
                {
                    AchievementId = reader.GetInt32(reader.GetOrdinal("AchievementId")),
                    MemberName = reader.GetString(reader.GetOrdinal("MemberName")),
                    PhotoPath = reader.IsDBNull(reader.GetOrdinal("PhotoPath")) ? null : reader.GetString(reader.GetOrdinal("PhotoPath")),
                    Title = reader.GetString(reader.GetOrdinal("Title")),
                    Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                    AchievementDate = reader.IsDBNull(reader.GetOrdinal("AchievementDate")) ? null : reader.GetDateTime(reader.GetOrdinal("AchievementDate")),
                    CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                    Attachments = new List<AttachmentDTO>()
                };

                reader.Close();

                // Get attachments
                using var attachCommand = _dbContext.CreateCommand(
                    "SELECT * FROM AchievementAttachments WHERE AchievementId = @AchievementId",
                    connection);
                attachCommand.Parameters.AddWithValue("@AchievementId", id);

                using var attachReader = await attachCommand.ExecuteReaderAsync();
                while (await attachReader.ReadAsync())
                {
                    achievement.Attachments.Add(new AttachmentDTO
                    {
                        AttachmentId = attachReader.GetInt32(attachReader.GetOrdinal("AttachmentId")),
                        FileName = attachReader.IsDBNull(attachReader.GetOrdinal("FileName")) ? null : attachReader.GetString(attachReader.GetOrdinal("FileName")),
                        FilePath = attachReader.IsDBNull(attachReader.GetOrdinal("FilePath")) ? null : attachReader.GetString(attachReader.GetOrdinal("FilePath")),
                        UploadedDate = attachReader.GetDateTime(attachReader.GetOrdinal("UploadedDate"))
                    });
                }

                return Ok(new ApiResponse<AchievementDetailDTO>
                {
                    Success = true,
                    Data = achievement
                });
            }

            return NotFound(new ApiResponse<AchievementDetailDTO>
            {
                Success = false,
                Message = "Achievement not found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<AchievementDetailDTO>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] CreateAchievementDTO request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_CreateAchievement", connection);

            command.Parameters.AddWithValue("@MemberName", request.MemberName);
            command.Parameters.AddWithValue("@PhotoPath", request.PhotoPath ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@Title", request.Title);
            command.Parameters.AddWithValue("@Description", request.Description ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@AchievementDate", request.AchievementDate ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@CreatedBy", userId);

            var achievementId = Convert.ToInt32(await command.ExecuteScalarAsync());

            // Send notification
            await NotificationController.CreateContentNotificationAsync(
                _dbContext,
                "Achievements",
                achievementId,
                "New Achievement",
                $"{request.MemberName}: {request.Title}"
            );

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Achievement created successfully",
                Data = new { AchievementId = achievementId }
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
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] UpdateAchievementDTO request)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateCommand(
                @"UPDATE Achievements SET
                    MemberName = @MemberName,
                    PhotoPath = @PhotoPath,
                    Title = @Title,
                    Description = @Description,
                    AchievementDate = @AchievementDate,
                    UpdatedDate = GETDATE()
                  WHERE AchievementId = @AchievementId",
                connection);

            command.Parameters.AddWithValue("@AchievementId", id);
            command.Parameters.AddWithValue("@MemberName", request.MemberName);
            command.Parameters.AddWithValue("@PhotoPath", request.PhotoPath ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@Title", request.Title);
            command.Parameters.AddWithValue("@Description", request.Description ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@AchievementDate", request.AchievementDate ?? (object)DBNull.Value);

            var rowsAffected = await command.ExecuteNonQueryAsync();

            return Ok(new ApiResponse<object>
            {
                Success = rowsAffected > 0,
                Message = rowsAffected > 0 ? "Achievement updated successfully" : "Achievement not found"
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
                "DELETE FROM Achievements WHERE AchievementId = @AchievementId",
                connection);

            command.Parameters.AddWithValue("@AchievementId", id);

            var rowsAffected = await command.ExecuteNonQueryAsync();

            return Ok(new ApiResponse<object>
            {
                Success = rowsAffected > 0,
                Message = rowsAffected > 0 ? "Achievement deleted successfully" : "Achievement not found"
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
