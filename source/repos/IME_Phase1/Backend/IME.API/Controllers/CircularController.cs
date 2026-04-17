using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using System.Data.SqlClient;
using IME.Infrastructure.Data;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CircularController : ControllerBase
{
    private readonly DatabaseContext _dbContext;

    public CircularController(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<CircularDTO>>>> GetAll()
    {
        try
        {
            var circulars = new List<CircularDTO>();

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetAllCirculars", connection);

            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                circulars.Add(new CircularDTO
                {
                    CircularId = reader.GetInt32(reader.GetOrdinal("CircularId")),
                    Title = reader.GetString(reader.GetOrdinal("Title")),
                    Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                    CircularNumber = reader.IsDBNull(reader.GetOrdinal("CircularNumber")) ? null : reader.GetString(reader.GetOrdinal("CircularNumber")),
                    PublishDate = reader.GetDateTime(reader.GetOrdinal("PublishDate")),
                    AttachmentCount = reader.GetInt32(reader.GetOrdinal("AttachmentCount"))
                });
            }

            return Ok(new ApiResponse<List<CircularDTO>>
            {
                Success = true,
                Data = circulars
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<CircularDTO>>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<CircularDetailDTO>>> GetById(int id)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateCommand(
                "SELECT * FROM tbl_GOCircular WHERE CircularId = @CircularId",
                connection);

            command.Parameters.AddWithValue("@CircularId", id);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var circular = new CircularDetailDTO
                {
                    CircularId = reader.GetInt32(reader.GetOrdinal("CircularId")),
                    Title = reader.GetString(reader.GetOrdinal("Title")),
                    Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                    CircularNumber = reader.IsDBNull(reader.GetOrdinal("CircularNumber")) ? null : reader.GetString(reader.GetOrdinal("CircularNumber")),
                    PublishDate = reader.GetDateTime(reader.GetOrdinal("PublishDate")),
                    CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                    Attachments = new List<AttachmentDTO>()
                };

                reader.Close();

                // Get attachments
                using var attachCommand = _dbContext.CreateCommand(
                    "SELECT * FROM tbl_GOCircularAttachments WHERE CircularId = @CircularId",
                    connection);
                attachCommand.Parameters.AddWithValue("@CircularId", id);

                using var attachReader = await attachCommand.ExecuteReaderAsync();
                while (await attachReader.ReadAsync())
                {
                    circular.Attachments.Add(new AttachmentDTO
                    {
                        AttachmentId = attachReader.GetInt32(attachReader.GetOrdinal("AttachmentId")),
                        FileName = attachReader.IsDBNull(attachReader.GetOrdinal("FileName")) ? null : attachReader.GetString(attachReader.GetOrdinal("FileName")),
                        FilePath = attachReader.IsDBNull(attachReader.GetOrdinal("FilePath")) ? null : attachReader.GetString(attachReader.GetOrdinal("FilePath")),
                        UploadedDate = attachReader.GetDateTime(attachReader.GetOrdinal("UploadedDate"))
                    });
                }

                return Ok(new ApiResponse<CircularDetailDTO>
                {
                    Success = true,
                    Data = circular
                });
            }

            return NotFound(new ApiResponse<CircularDetailDTO>
            {
                Success = false,
                Message = "Circular not found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<CircularDetailDTO>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] CreateCircularDTO request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_CreateCircular", connection);

            command.Parameters.AddWithValue("@Title", request.Title);
            command.Parameters.AddWithValue("@Description", request.Description ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@CircularNumber", request.CircularNumber ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@PublishDate", request.PublishDate);
            command.Parameters.AddWithValue("@CreatedBy", userId);
            command.Parameters.AddWithValue("@CreatedDate", (object?)(request.CreatedDate?.ToUniversalTime() ?? DateTime.UtcNow));

            var circularId = Convert.ToInt32(await command.ExecuteScalarAsync());

            // Send notification
            await NotificationController.CreateContentNotificationAsync(
                _dbContext,
                "Circular",
                circularId,
                "New GO & Circular",
                $"New circular: {request.Title}"
            );

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Circular created successfully",
                Data = new { CircularId = circularId }
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
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] UpdateCircularDTO request)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();

            using var command = _dbContext.CreateStoredProcCommand("sp_UpdateCircular", connection);

            command.Parameters.AddWithValue("@CircularId", id);
            command.Parameters.AddWithValue("@Title", request.Title);
            command.Parameters.AddWithValue("@Description", request.Description ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@CircularNumber", request.CircularNumber ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@PublishDate", request.PublishDate);

            await command.ExecuteNonQueryAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Circular updated successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
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

            using var command = _dbContext.CreateStoredProcCommand("sp_DeleteCircular", connection);

            command.Parameters.AddWithValue("@CircularId", id);

            await command.ExecuteNonQueryAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Circular deleted successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }
}
