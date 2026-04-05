using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MemberController : ControllerBase
{
    private readonly IMemberRepository _memberRepository;

    public MemberController(IMemberRepository memberRepository)
    {
        _memberRepository = memberRepository;
    }

    [HttpGet("profile/{memberId}")]
    public async Task<ActionResult<ApiResponse<MemberProfileDTO>>> GetProfile(int memberId)
    {
        try
        {
            var member = await _memberRepository.GetMemberProfileAsync(memberId);

            if (member == null)
            {
                return NotFound(new ApiResponse<MemberProfileDTO>
                {
                    Success = false,
                    Message = "Member not found"
                });
            }

            var profileDTO = new MemberProfileDTO
            {
                MemberId = member.MemberId,
                UserId = member.UserId,
                FullName = member.FullName,
                Address = member.Address,
                ContactNumber = member.ContactNumber,
                Gender = member.Gender,
                Age = member.Age,
                DateOfBirth = member.DateOfBirth,
                Place = member.Place,
                DesignationId = member.DesignationId,
                ProfilePhotoPath = member.ProfilePhotoPath,
                MembershipStatus = member.MembershipStatus,
                CreatedDate = member.CreatedDate
            };

            return Ok(new ApiResponse<MemberProfileDTO>
            {
                Success = true,
                Data = profileDTO
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<MemberProfileDTO>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPut("profile/{memberId}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateProfile(int memberId, [FromBody] UpdateMemberProfileDTO request)
    {
        try
        {
            var member = new Member
            {
                MemberId = memberId,
                FullName = request.FullName,
                Address = request.Address,
                ContactNumber = request.ContactNumber,
                Gender = request.Gender,
                Age = request.Age,
                Place = request.Place,
                DesignationId = request.DesignationId,
                ProfilePhotoPath = request.ProfilePhotoPath
            };

            var success = await _memberRepository.UpdateMemberProfileAsync(member);

            if (success)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Profile updated successfully"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = false,
                Message = "Failed to update profile"
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

    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<Member>>>> GetAllMembers([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50)
    {
        try
        {
            var members = await _memberRepository.GetAllMembersAsync(pageNumber, pageSize);

            return Ok(new ApiResponse<List<Member>>
            {
                Success = true,
                Data = members
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<Member>>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPut("{memberId}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateMemberStatus(int memberId, [FromBody] string status)
    {
        try
        {
            var success = await _memberRepository.UpdateMemberStatusAsync(memberId, status);

            if (success)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Status updated successfully"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = false,
                Message = "Failed to update status"
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
