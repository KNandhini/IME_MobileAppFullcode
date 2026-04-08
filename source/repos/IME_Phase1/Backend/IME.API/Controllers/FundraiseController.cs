using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.Models;
using IME.Core.Interfaces;
using IME.Core.DTOs;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FundraiseController : ControllerBase
{
    private readonly IFundraiseRepository _repository;

    public FundraiseController(IFundraiseRepository repository)
    {
        _repository = repository;
    }

    // ✅ GET ALL
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<Fundraise>>>> GetAll()
    {
        try
        {
            var data = await _repository.GetAllFundraiseAsync();

            return Ok(new ApiResponse<List<Fundraise>>
            {
                Success = true,
                Data = data
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<Fundraise>>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    // ✅ GET BY ID
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<Fundraise>>> GetById(int id)
    {
        try
        {
            var data = await _repository.GetFundraiseByIdAsync(id);

            if (data == null)
            {
                return NotFound(new ApiResponse<Fundraise>
                {
                    Success = false,
                    Message = "Fundraise not found"
                });
            }

            return Ok(new ApiResponse<Fundraise>
            {
                Success = true,
                Data = data
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<Fundraise>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    // ✅ CREATE
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] Fundraise request)
    {
        try
        {
            request.CreatedDate = DateTime.UtcNow;

            var id = await _repository.CreateFundraiseAsync(request);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Fundraise created successfully",
                Data = new { Id = id }
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

    // ✅ UPDATE
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] Fundraise request)
    {
        try
        {
            request.Id = id;
            request.ModifiedDate = DateTime.UtcNow;

            var success = await _repository.UpdateFundraiseAsync(request);

            if (success)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Fundraise updated successfully"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = false,
                Message = "Failed to update fundraise"
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

    // ✅ DELETE
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        try
        {
            var success = await _repository.DeleteFundraiseAsync(id);

            if (success)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Fundraise deleted successfully"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = false,
                Message = "Failed to delete fundraise"
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