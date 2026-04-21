using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Services;
using System.Data.SqlClient;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
//[Authorize]
public class MemberController : ControllerBase
{
    private readonly IMemberRepository _memberRepository;
    private readonly EmailService _emailService;
    private readonly PasswordService _passwordService;
    private readonly IME.Infrastructure.Data.DatabaseContext _dbContext;

    public MemberController(IMemberRepository memberRepository, EmailService emailService,
        PasswordService passwordService, IME.Infrastructure.Data.DatabaseContext dbContext)
    {
        _memberRepository = memberRepository;
        _emailService = emailService;
        _passwordService = passwordService;
        _dbContext = dbContext;
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
                Email = member.Email,
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
    /*public async Task<ActionResult<ApiResponse<object>>> UpdateMemberStatus(int memberId, [FromBody] string status)
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
    }*/
    public async Task<ActionResult<ApiResponse<object>>> UpdateMemberStatus(
    int memberId,
    [FromBody] UpdateMemberStatusRequest request)
    {
        try
        {
            var success = await _memberRepository.UpdateMemberStatusAsync(
                memberId,
                request.Status,
                request.Reason   // ? pass reason
            );

            if (success)
            {
                // ? GET MEMBER EMAIL
                var member = await _memberRepository.GetMemberProfileAsync(memberId);

                if (member != null)
                {
                    string subject = "Membership Status Update";
                    string body = "";

                    if (request.Status == "Active")
                    {
                        body = $"Hello {member.FullName},\n\nYour membership has been APPROVED.";
                    }
                    else if (request.Status == "Rejected")
                    {
                        body = body = $@"Hi {member.FullName},Thank you for your interest in becoming a member. After careful review, we are sorry to inform you that your membership has been rejected. 
                        Reason:{request.Reason} You are welcome to reapply after addressing the above concern. If you have any questions, please reach out to us.
                        Best regards,  
                        Team IME";
                    }

                    await _emailService.SendEmailAsync(member.Email, subject, body);
                }

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
    [HttpDelete("{memberId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteMember(int memberId)
    {
        try
        {
            var success = await _memberRepository.DeleteMemberAsync(memberId);

            if (success)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Member deleted successfully"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = false,
                Message = "Failed to delete member"
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

    [HttpPost("{memberId}/change-password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> ChangePassword(
        int memberId, [FromBody] ChangePasswordRequest request)
    {
        try
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();

            // Get current password hash
            using var selectCmd = _dbContext.CreateCommand(
                "SELECT u.PasswordHash FROM tbl_Users u " +
                "INNER JOIN tbl_Members m ON m.UserId = u.UserId " +
                "WHERE m.MemberId = @MemberId", connection);
            selectCmd.Parameters.AddWithValue("@MemberId", memberId);
            var hash = (await selectCmd.ExecuteScalarAsync())?.ToString();

            if (string.IsNullOrEmpty(hash) || !_passwordService.VerifyPassword(request.CurrentPassword, hash))
                return Ok(new ApiResponse<object> { Success = false, Message = "Current password is incorrect." });

            var newHash = _passwordService.HashPassword(request.NewPassword);

            using var updateCmd = _dbContext.CreateCommand(
                "UPDATE u SET u.PasswordHash = @NewHash " +
                "FROM tbl_Users u INNER JOIN tbl_Members m ON m.UserId = u.UserId " +
                "WHERE m.MemberId = @MemberId", connection);
            updateCmd.Parameters.AddWithValue("@NewHash", newHash);
            updateCmd.Parameters.AddWithValue("@MemberId", memberId);
            await updateCmd.ExecuteNonQueryAsync();

            return Ok(new ApiResponse<object> { Success = true, Message = "Password changed successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }
}
