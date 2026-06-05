using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class LocalBodyController : ControllerBase
{
    private readonly ILocalBodyRepository _repo;

    public LocalBodyController(ILocalBodyRepository repo) => _repo = repo;

    // GET /api/LocalBody/search?name=Sankagiri&district=Salem
    // Primary endpoint: used by CorpDetailsScreen to load master data before AI
    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<LocalBodyDTO>>> Search(
        [FromQuery] string name,
        [FromQuery] string? district = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new ApiResponse<LocalBodyDTO> { Success = false, Message = "name is required" });
        try
        {
            var data = await _repo.SearchAsync(name.Trim(), district?.Trim());
            if (data == null)
                return Ok(new ApiResponse<LocalBodyDTO> { Success = false, Message = "Not found in master data" });
            return Ok(new ApiResponse<LocalBodyDTO> { Success = true, Data = data });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<LocalBodyDTO> { Success = false, Message = ex.Message });
        }
    }

    // GET /api/LocalBody/district/Erode
    [HttpGet("district/{districtName}")]
    public async Task<ActionResult<ApiResponse<List<LocalBodyDTO>>>> GetByDistrict(string districtName)
    {
        try
        {
            var data = await _repo.GetByDistrictAsync(Uri.UnescapeDataString(districtName));
            return Ok(new ApiResponse<List<LocalBodyDTO>> { Success = true, Data = data });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<LocalBodyDTO>> { Success = false, Message = ex.Message });
        }
    }

    // GET /api/LocalBody/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<LocalBodyDTO>>> GetById(int id)
    {
        try
        {
            var data = await _repo.GetByIdAsync(id);
            if (data == null)
                return NotFound(new ApiResponse<LocalBodyDTO> { Success = false, Message = "Not found" });
            return Ok(new ApiResponse<LocalBodyDTO> { Success = true, Data = data });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<LocalBodyDTO> { Success = false, Message = ex.Message });
        }
    }

    // GET /api/LocalBody/type/Municipality?state=Tamil%20Nadu
    [HttpGet("type/{localBodyType}")]
    public async Task<ActionResult<ApiResponse<List<LocalBodyDTO>>>> GetByType(
        string localBodyType,
        [FromQuery] string state = "Tamil Nadu")
    {
        try
        {
            var data = await _repo.GetByTypeAsync(Uri.UnescapeDataString(localBodyType), state);
            return Ok(new ApiResponse<List<LocalBodyDTO>> { Success = true, Data = data });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<LocalBodyDTO>> { Success = false, Message = ex.Message });
        }
    }
}
