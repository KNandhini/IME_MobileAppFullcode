// ?????????????????????????????????????????????????????????????????????????????
// FILE: IME.API/Controllers/OrganisationController.cs
// Replace your existing OrganisationController.cs with this file.
// ?????????????????????????????????????????????????????????????????????????????
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Infrastructure.Data;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrganisationController : ControllerBase
{
    private readonly IOrganisationRepository _organisationRepository;

    public OrganisationController(IOrganisationRepository organisationRepository)
    {
        _organisationRepository = organisationRepository;
    }

    // GET api/Organisation/club-admins/5
    [HttpGet("club-admins/{clubId}")]
    public async Task<ActionResult<ApiResponse<List<ClubAdminMemberDTO>>>> GetClubAdminMembers(int clubId)
    {
        try
        {
            var members = await _organisationRepository.GetClubAdminMembersAsync(clubId);

            var result = members.Select(m => new ClubAdminMemberDTO
            {
                MemberId = m.MemberId,
                FullName = m.FullName,
                Email = m.Email,
                ContactNumber = m.ContactNumber,
                ProfilePhotoPath = m.ProfilePhotoPath,
               // ProfilePhotoBase64 = m.ProfilePhotoBase64,
                RoleName = m.RoleName,
                ClubId = m.ClubId.ToString(),
                ClubName = m.ClubName,
            }).ToList();

            return Ok(new ApiResponse<List<ClubAdminMemberDTO>>
            {
                Success = true,
                Data = result
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<ClubAdminMemberDTO>>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }
}