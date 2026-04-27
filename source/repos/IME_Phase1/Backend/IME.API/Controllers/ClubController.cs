using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Services;
using System.Security.Claims;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClubController : ControllerBase
{
    private readonly IClubRepository _clubRepository;
    private readonly FileStorageService _fileStorageService;

    private static readonly string[] AllowedImageTypes = { ".jpg", ".jpeg", ".png", ".webp" };

    public ClubController(IClubRepository clubRepository, FileStorageService fileStorageService)
    {
        _clubRepository = clubRepository;
        _fileStorageService = fileStorageService;
    }

    [HttpGet("all")]
    //[Authorize(Roles = "Admin")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<ClubDTO>>>> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null)
    {
        try
        {
            var clubs = await _clubRepository.GetAllClubsAsync(pageNumber, pageSize, search, isActive);
            return Ok(new ApiResponse<List<ClubDTO>> { Success = true, Data = clubs.Select(MapToDTO).ToList() });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<ClubDTO>> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpGet("{id:int}")]
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

            var userName = GetCurrentUser();
            var club = MapFromDTO(request);
            club.CreatedBy = userName;

            var newId = await _clubRepository.CreateClubAsync(club);
            return Ok(new ApiResponse<object> { Success = true, Data = new { ClubId = newId }, Message = "Club created successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] UpdateClubDTO request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.ClubName))
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Club name is required" });

            var userName = GetCurrentUser();
            var club = MapFromDTO(request);
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

    [HttpPost("{id:int}/logo")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> UploadLogo(int id, [FromForm] IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest(new ApiResponse<object> { Success = false, Message = "No file provided" });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedImageTypes.Contains(ext))
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Only JPG, PNG, WEBP images are allowed" });

            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Image must be under 5 MB" });

            var club = await _clubRepository.GetClubByIdAsync(id);
            if (club == null)
                return NotFound(new ApiResponse<object> { Success = false, Message = "Club not found" });

            if (!string.IsNullOrEmpty(club.LogoPath))
                _fileStorageService.DeleteFile(club.LogoPath);

            var logoPath = await _fileStorageService.SaveFileAsync(file.OpenReadStream(), "Clubs", id, file.FileName);
            var userName = GetCurrentUser();
            await _clubRepository.UpdateClubLogoAsync(id, logoPath, userName);

            return Ok(new ApiResponse<object> { Success = true, Data = new { LogoPath = logoPath }, Message = "Logo uploaded successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        try
        {
            var userName = GetCurrentUser();
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

    [HttpGet("next-code")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> GetNextCode()
    {
        try
        {
            var code = await _clubRepository.GetNextClubCodeAsync();
            return Ok(new ApiResponse<object> { Success = true, Data = new { Code = code } });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    [HttpGet("countries")]
    // [Authorize]
    [AllowAnonymous]
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
    //  [Authorize]
    [AllowAnonymous]
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

    private string GetCurrentUser() =>
        User.FindFirst(ClaimTypes.Name)?.Value
        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? "Admin";

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
        AdminMemberIds     = c.AdminMemberIds,
        AdminMemberNames   = c.AdminMemberNames,
        RegistrationNumber = c.RegistrationNumber,
        LogoPath           = c.LogoPath,
        IsActive           = c.IsActive,
        CreatedBy          = c.CreatedBy,
        CreatedDate        = c.CreatedDate,
        ModifiedBy         = c.ModifiedBy,
        ModifiedDate       = c.ModifiedDate,
    };

    private static Club MapFromDTO(CreateClubDTO d) => new()
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
        AdminMemberIds     = d.AdminMemberIds,
        AdminMemberNames   = d.AdminMemberNames,
        RegistrationNumber = d.RegistrationNumber,
        IsActive           = d.IsActive,
    };
}
