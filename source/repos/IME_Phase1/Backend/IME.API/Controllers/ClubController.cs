using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;
using System.Security.Claims;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClubController : ControllerBase
{
    private readonly IClubRepository _clubRepository;

    public ClubController(IClubRepository clubRepository)
    {
        _clubRepository = clubRepository;
    }

    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<ClubDTO>>>> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null)
    {
        try
        {
            var clubs = await _clubRepository.GetAllClubsAsync(pageNumber, pageSize, search, isActive);
            var dtos = clubs.Select(MapToDTO).ToList();
            return Ok(new ApiResponse<List<ClubDTO>> { Success = true, Data = dtos });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<ClubDTO>> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<ClubDTO>>> GetById(int id)
    {
        try
        {
            var club = await _clubRepository.GetClubByIdAsync(id);
            if (club == null)
                return NotFound(new ApiResponse<ClubDTO> { Success = false, Message = "Club not found" });

            return Ok(new ApiResponse<ClubDTO> { Success = true, Data = MapToDTO(club) });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<ClubDTO> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] CreateClubDTO request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.ClubName))
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Club name is required" });

            var userName = User.FindFirst(ClaimTypes.Name)?.Value
                        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? "Admin";

            var club = MapFromCreateDTO(request);
            club.CreatedBy = userName;

            var newId = await _clubRepository.CreateClubAsync(club);
            return Ok(new ApiResponse<object> { Success = true, Data = new { ClubId = newId }, Message = "Club created successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] UpdateClubDTO request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.ClubName))
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Club name is required" });

            var userName = User.FindFirst(ClaimTypes.Name)?.Value
                        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? "Admin";

            var club = MapFromCreateDTO(request);
            club.ClubId = id;
            club.ModifiedBy = userName;

            var updated = await _clubRepository.UpdateClubAsync(club);
            if (!updated)
                return NotFound(new ApiResponse<object> { Success = false, Message = "Club not found" });

            return Ok(new ApiResponse<object> { Success = true, Message = "Club updated successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        try
        {
            var userName = User.FindFirst(ClaimTypes.Name)?.Value
                        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? "Admin";

            var deleted = await _clubRepository.DeleteClubAsync(id, userName);
            if (!deleted)
                return NotFound(new ApiResponse<object> { Success = false, Message = "Club not found" });

            return Ok(new ApiResponse<object> { Success = true, Message = "Club deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpGet("countries")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<List<CountryDTO>>>> GetCountries()
    {
        try
        {
            var list = await _clubRepository.GetCountriesAsync();
            var dtos = list.Select(c => new CountryDTO { CountryId = c.CountryId, CountryName = c.CountryName }).ToList();
            return Ok(new ApiResponse<List<CountryDTO>> { Success = true, Data = dtos });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<CountryDTO>> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpGet("states/{countryId}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<List<StateDTO>>>> GetStates(int countryId)
    {
        try
        {
            var list = await _clubRepository.GetStatesByCountryAsync(countryId);
            var dtos = list.Select(s => new StateDTO { StateId = s.StateId, StateName = s.StateName, CountryId = s.CountryId }).ToList();
            return Ok(new ApiResponse<List<StateDTO>> { Success = true, Data = dtos });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<StateDTO>> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    private static ClubDTO MapToDTO(Club c) => new()
    {
        ClubId             = c.ClubId,
        ClubName           = c.ClubName,
        ClubCode           = c.ClubCode,
        Description        = c.Description,
        CountryId          = c.CountryId,
        CountryName        = c.CountryName,
        StateId            = c.StateId,
        StateName          = c.StateName,
        City               = c.City,
        District           = c.District,
        AddressLine1       = c.AddressLine1,
        AddressLine2       = c.AddressLine2,
        Pincode            = c.Pincode,
        ContactPersonName  = c.ContactPersonName,
        ContactNumber      = c.ContactNumber,
        AlternateNumber    = c.AlternateNumber,
        Email              = c.Email,
        Website            = c.Website,
        ClubType           = c.ClubType,
        EstablishedDate    = c.EstablishedDate,
        TotalMembers       = c.TotalMembers,
        AdminMemberId      = c.AdminMemberId,
        AdminMemberName    = c.AdminMemberName,
        RegistrationNumber = c.RegistrationNumber,
        IsActive           = c.IsActive,
        CreatedBy          = c.CreatedBy,
        CreatedDate        = c.CreatedDate,
        ModifiedBy         = c.ModifiedBy,
        ModifiedDate       = c.ModifiedDate,
    };

    private static Club MapFromCreateDTO(CreateClubDTO d) => new()
    {
        ClubName           = d.ClubName,
        ClubCode           = d.ClubCode,
        Description        = d.Description,
        CountryId          = d.CountryId,
        StateId            = d.StateId,
        City               = d.City,
        District           = d.District,
        AddressLine1       = d.AddressLine1,
        AddressLine2       = d.AddressLine2,
        Pincode            = d.Pincode,
        ContactPersonName  = d.ContactPersonName,
        ContactNumber      = d.ContactNumber,
        AlternateNumber    = d.AlternateNumber,
        Email              = d.Email,
        Website            = d.Website,
        ClubType           = d.ClubType,
        EstablishedDate    = d.EstablishedDate,
        TotalMembers       = d.TotalMembers,
        AdminMemberId      = d.AdminMemberId,
        RegistrationNumber = d.RegistrationNumber,
        IsActive           = d.IsActive,
    };
}
