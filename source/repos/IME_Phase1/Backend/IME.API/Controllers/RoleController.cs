using IME.Core.DTOs;
using IME.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoleController : ControllerBase
{
    private readonly IRoleRepository _roleRepository;

    public RoleController(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository;
    }

    // GET /api/role/all
    // Public — the signup screen needs this before the user has logged in.
    [HttpGet("all")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<RoleDTO>>>> GetAllRoles()
    {
        try
        {
            var roles = await _roleRepository.GetAllRolesAsync();
            return Ok(new ApiResponse<List<RoleDTO>> { Success = true, Data = roles });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<RoleDTO>> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }
}
