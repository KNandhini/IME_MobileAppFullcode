using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using System.Data.SqlClient;
using IME.Infrastructure.Data;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrganisationController : ControllerBase
{
    private readonly DatabaseContext _dbContext;

    public OrganisationController(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<OrganisationMemberDTO>>>> GetAll()
    {
        try
        {
            var members = new List<OrganisationMemberDTO>();

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetAllOrganisationMembers", connection);

            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                members.Add(new OrganisationMemberDTO
                {
                    OrgMemberId = reader.GetInt32(reader.GetOrdinal("OrgMemberId")),
                    Name = reader.GetString(reader.GetOrdinal("Name")),
                    PhotoPath = reader.IsDBNull(reader.GetOrdinal("PhotoPath")) ? null : reader.GetString(reader.GetOrdinal("PhotoPath")),
                    Designation = reader.IsDBNull(reader.GetOrdinal("Designation")) ? null : reader.GetString(reader.GetOrdinal("Designation")),
                    Position = reader.IsDBNull(reader.GetOrdinal("Position")) ? null : reader.GetString(reader.GetOrdinal("Position")),
                    DisplayOrder = reader.GetInt32(reader.GetOrdinal("DisplayOrder")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                });
            }

            return Ok(new ApiResponse<List<OrganisationMemberDTO>>
            {
                Success = true,
                Data = members
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<OrganisationMemberDTO>>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<OrganisationMemberDTO>>> GetById(int id)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateCommand(
                "SELECT * FROM OrganisationMembers WHERE OrgMemberId = @OrgMemberId",
                connection);

            command.Parameters.AddWithValue("@OrgMemberId", id);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var member = new OrganisationMemberDTO
                {
                    OrgMemberId = reader.GetInt32(reader.GetOrdinal("OrgMemberId")),
                    Name = reader.GetString(reader.GetOrdinal("Name")),
                    PhotoPath = reader.IsDBNull(reader.GetOrdinal("PhotoPath")) ? null : reader.GetString(reader.GetOrdinal("PhotoPath")),
                    Designation = reader.IsDBNull(reader.GetOrdinal("Designation")) ? null : reader.GetString(reader.GetOrdinal("Designation")),
                    Position = reader.IsDBNull(reader.GetOrdinal("Position")) ? null : reader.GetString(reader.GetOrdinal("Position")),
                    DisplayOrder = reader.GetInt32(reader.GetOrdinal("DisplayOrder")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                };

                return Ok(new ApiResponse<OrganisationMemberDTO>
                {
                    Success = true,
                    Data = member
                });
            }

            return NotFound(new ApiResponse<OrganisationMemberDTO>
            {
                Success = false,
                Message = "Organisation member not found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<OrganisationMemberDTO>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] CreateOrganisationMemberDTO request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_CreateOrganisationMember", connection);

            command.Parameters.AddWithValue("@Name", request.Name);
            command.Parameters.AddWithValue("@PhotoPath", request.PhotoPath ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@Designation", request.Designation ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@Position", request.Position ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@DisplayOrder", request.DisplayOrder);
            command.Parameters.AddWithValue("@CreatedBy", userId);

            var orgMemberId = Convert.ToInt32(await command.ExecuteScalarAsync());

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Organisation member created successfully",
                Data = new { OrgMemberId = orgMemberId }
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
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] UpdateOrganisationMemberDTO request)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_UpdateOrganisationMember", connection);

            command.Parameters.AddWithValue("@OrgMemberId", id);
            command.Parameters.AddWithValue("@Name", request.Name);
            command.Parameters.AddWithValue("@PhotoPath", request.PhotoPath ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@Designation", request.Designation ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@Position", request.Position ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@DisplayOrder", request.DisplayOrder);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var rowsAffected = reader.GetInt32(reader.GetOrdinal("RowsAffected"));

                return Ok(new ApiResponse<object>
                {
                    Success = rowsAffected > 0,
                    Message = rowsAffected > 0 ? "Organisation member updated successfully" : "Organisation member not found"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = false,
                Message = "Failed to update"
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
            using var command = _dbContext.CreateStoredProcCommand("sp_DeleteOrganisationMember", connection);

            command.Parameters.AddWithValue("@OrgMemberId", id);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var rowsAffected = reader.GetInt32(reader.GetOrdinal("RowsAffected"));

                return Ok(new ApiResponse<object>
                {
                    Success = rowsAffected > 0,
                    Message = rowsAffected > 0 ? "Organisation member deleted successfully" : "Organisation member not found"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = false,
                Message = "Failed to delete"
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
