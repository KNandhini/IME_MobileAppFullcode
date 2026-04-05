using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using System.Data.SqlClient;
using IME.Infrastructure.Data;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly DatabaseContext _dbContext;

    public NotificationController(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<ApiResponse<List<NotificationDTO>>>> GetUserNotifications(int userId)
    {
        try
        {
            var notifications = new List<NotificationDTO>();

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetUserNotifications", connection);

            command.Parameters.AddWithValue("@UserId", userId);

            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                notifications.Add(new NotificationDTO
                {
                    NotificationId = reader.GetInt32(reader.GetOrdinal("NotificationId")),
                    Title = reader.GetString(reader.GetOrdinal("Title")),
                    Message = reader.GetString(reader.GetOrdinal("Message")),
                    ModuleName = reader.IsDBNull(reader.GetOrdinal("ModuleName")) ? null : reader.GetString(reader.GetOrdinal("ModuleName")),
                    ReferenceId = reader.IsDBNull(reader.GetOrdinal("ReferenceId")) ? null : reader.GetInt32(reader.GetOrdinal("ReferenceId")),
                    IsRead = reader.GetBoolean(reader.GetOrdinal("IsRead")),
                    SentDate = reader.GetDateTime(reader.GetOrdinal("SentDate"))
                });
            }

            return Ok(new ApiResponse<List<NotificationDTO>>
            {
                Success = true,
                Data = notifications
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<NotificationDTO>>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPut("{notificationId}/read")]
    public async Task<ActionResult<ApiResponse<object>>> MarkAsRead(int notificationId)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_MarkNotificationAsRead", connection);

            command.Parameters.AddWithValue("@NotificationId", notificationId);
            command.Parameters.AddWithValue("@UserId", userId);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var rowsAffected = reader.GetInt32(reader.GetOrdinal("RowsAffected"));

                return Ok(new ApiResponse<object>
                {
                    Success = rowsAffected > 0,
                    Message = rowsAffected > 0 ? "Marked as read" : "Notification not found"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = false,
                Message = "Failed to mark as read"
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

    [HttpGet("unread-count/{userId}")]
    public async Task<ActionResult<ApiResponse<object>>> GetUnreadCount(int userId)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetUnreadNotificationCount", connection);

            command.Parameters.AddWithValue("@UserId", userId);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var count = reader.GetInt32(reader.GetOrdinal("UnreadCount"));

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Data = new { UnreadCount = count }
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Data = new { UnreadCount = 0 }
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

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> CreateNotification([FromBody] CreateNotificationDTO request)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_CreateNotification", connection);

            command.Parameters.AddWithValue("@Title", request.Title);
            command.Parameters.AddWithValue("@Message", request.Message);
            command.Parameters.AddWithValue("@ModuleName", request.ModuleName ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@ReferenceId", request.ReferenceId ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@UserId", request.UserId ?? (object)DBNull.Value);

            var notificationId = await command.ExecuteScalarAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Notification created successfully",
                Data = new { NotificationId = notificationId }
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

    [HttpPost("send-to-all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> SendToAllUsers([FromBody] CreateNotificationDTO request)
    {
        try
        {
            // Create notification with UserId = NULL (broadcasts to all)
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_CreateNotification", connection);

            command.Parameters.AddWithValue("@Title", request.Title);
            command.Parameters.AddWithValue("@Message", request.Message);
            command.Parameters.AddWithValue("@ModuleName", request.ModuleName ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@ReferenceId", request.ReferenceId ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@UserId", DBNull.Value); // NULL = broadcast to all

            var notificationId = await command.ExecuteScalarAsync();

            // Here you would also trigger push notifications to all devices
            // await _pushNotificationService.SendToAllAsync(request.Title, request.Message);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Notification sent to all users",
                Data = new { NotificationId = notificationId }
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

    [HttpDelete("{notificationId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteNotification(int notificationId)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateCommand(
                "DELETE FROM Notifications WHERE NotificationId = @NotificationId",
                connection);

            command.Parameters.AddWithValue("@NotificationId", notificationId);

            var rowsAffected = await command.ExecuteNonQueryAsync();

            return Ok(new ApiResponse<object>
            {
                Success = rowsAffected > 0,
                Message = rowsAffected > 0 ? "Notification deleted" : "Notification not found"
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

    // Helper method to create notification after content creation
    // Can be called from other controllers
    public static async Task CreateContentNotificationAsync(
        DatabaseContext dbContext,
        string moduleName,
        int referenceId,
        string title,
        string message)
    {
        try
        {
            using var connection = await dbContext.CreateOpenConnectionAsync();
            using var command = dbContext.CreateStoredProcCommand("sp_CreateNotification", connection);

            command.Parameters.AddWithValue("@Title", title);
            command.Parameters.AddWithValue("@Message", message);
            command.Parameters.AddWithValue("@ModuleName", moduleName);
            command.Parameters.AddWithValue("@ReferenceId", referenceId);
            command.Parameters.AddWithValue("@UserId", DBNull.Value); // Broadcast to all

            await command.ExecuteScalarAsync();

            // TODO: Integrate with Expo Push Notification Service here
            // await PushNotificationService.SendToAllAsync(title, message, moduleName, referenceId);
        }
        catch
        {
            // Log error but don't fail the main operation
        }
    }
}
