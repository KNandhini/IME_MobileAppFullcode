using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class MunicipalCorpController : ControllerBase
{
    private readonly IMunicipalCorpRepository _repo;

    public MunicipalCorpController(IMunicipalCorpRepository repo)
    {
        _repo = repo;
    }

    [HttpGet("districts/{stateId:int}")]
    public async Task<ActionResult<ApiResponse<List<DistrictDTO>>>> GetDistricts(int stateId)
    {
        try
        {
            var data = await _repo.GetDistrictsAsync(stateId);
            return Ok(new ApiResponse<List<DistrictDTO>> { Success = true, Data = data });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<DistrictDTO>> { Success = false, Message = ex.Message });
        }
    }

    [HttpGet("corps/district/{districtId:int}")]
    public async Task<ActionResult<ApiResponse<List<MunicipalCorpDTO>>>> GetCorpsByDistrict(int districtId)
    {
        try
        {
            var data = await _repo.GetMunicipalCorpsAsync(districtId);
            return Ok(new ApiResponse<List<MunicipalCorpDTO>> { Success = true, Data = data });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<MunicipalCorpDTO>> { Success = false, Message = ex.Message });
        }
    }

    [HttpGet("corps/state/{stateId:int}")]
    public async Task<ActionResult<ApiResponse<List<MunicipalCorpDTO>>>> GetCorpsByState(int stateId)
    {
        try
        {
            var data = await _repo.GetMunicipalCorpsByStateAsync(stateId);
            return Ok(new ApiResponse<List<MunicipalCorpDTO>> { Success = true, Data = data });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<MunicipalCorpDTO>> { Success = false, Message = ex.Message });
        }
    }

    [HttpGet("corps/{corpId:int}")]
    public async Task<ActionResult<ApiResponse<MunicipalCorpDTO>>> GetCorpById(int corpId)
    {
        try
        {
            var data = await _repo.GetMunicipalCorpByIdAsync(corpId);
            if (data == null)
                return NotFound(new ApiResponse<MunicipalCorpDTO> { Success = false, Message = "Corporation not found" });

            return Ok(new ApiResponse<MunicipalCorpDTO> { Success = true, Data = data });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<MunicipalCorpDTO> { Success = false, Message = ex.Message });
        }
    }
}
