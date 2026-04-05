using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Services;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthRepository _authRepository;
    private readonly PasswordService _passwordService;
    private readonly JwtService _jwtService;

    public AuthController(
        IAuthRepository authRepository,
        PasswordService passwordService,
        JwtService jwtService)
    {
        _authRepository = authRepository;
        _passwordService = passwordService;
        _jwtService = jwtService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponseDTO>>> Login([FromBody] LoginRequestDTO request)
    {
        try
        {
            var user = await _authRepository.GetUserByEmailAsync(request.Email);

            if (user == null || !_passwordService.VerifyPassword(request.Password, user.PasswordHash))
            {
                return Ok(new ApiResponse<LoginResponseDTO>
                {
                    Success = false,
                    Message = "Invalid email or password"
                });
            }

            if (!user.IsActive)
            {
                return Ok(new ApiResponse<LoginResponseDTO>
                {
                    Success = false,
                    Message = "Account is inactive"
                });
            }

            // Get additional user info with role
            var userWithDetails = await _authRepository.ValidateUserCredentialsAsync(request.Email, user.PasswordHash);

            var fullUser = userWithDetails ?? user;

            // Generate JWT token
            var token = _jwtService.GenerateToken(fullUser.UserId, fullUser.RoleId, fullUser.RoleName, null, fullUser.Email);

            var response = new LoginResponseDTO
            {
                UserId = fullUser.UserId,
                Email = fullUser.Email,
                RoleId = fullUser.RoleId,
                RoleName = fullUser.RoleName,
                MemberId = fullUser.MemberId,
                FullName = fullUser.FullName,
                ProfilePhotoPath = fullUser.ProfilePhotoPath,
                Token = token
            };

            return Ok(new ApiResponse<LoginResponseDTO>
            {
                Success = true,
                Message = "Login successful",
                Data = response
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<LoginResponseDTO>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPost("signup")]
    public async Task<ActionResult<ApiResponse<object>>> Signup([FromBody] SignupRequestDTO request)
    {
        try
        {
            // Check if user already exists
            var existingUser = await _authRepository.GetUserByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Email already registered"
                });
            }

            // Hash password
            var passwordHash = _passwordService.HashPassword(request.Password);

            // Create user and member
            var user = new User
            {
                Email = request.Email,
                PasswordHash = passwordHash,
                RoleId = 2, // Member role
                IsActive = true
            };

            var member = new Member
            {
                FullName = request.FullName,
                Address = request.Address,
                ContactNumber = request.ContactNumber,
                Gender = request.Gender,
                Age = request.Age,
                DateOfBirth = request.DateOfBirth,
                Place = request.Place,
                DesignationId = request.DesignationId,
                ProfilePhotoPath = request.ProfilePhotoPath,
                MembershipStatus = "Pending"
            };

            var (userId, memberId, message) = await _authRepository.CreateUserAsync(user, member);

            if (userId > 0)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Registration successful. Pending admin approval.",
                    Data = new { UserId = userId, MemberId = memberId }
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = false,
                Message = message
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

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ApiResponse<object>>> ForgotPassword([FromBody] ForgotPasswordRequestDTO request)
    {
        try
        {
            var user = await _authRepository.ValidateUserForPasswordResetAsync(request.Email, request.DateOfBirth);

            if (user == null)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Invalid email or date of birth"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Validation successful",
                Data = new { UserId = user.UserId }
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

    [HttpPost("reset-password")]
    public async Task<ActionResult<ApiResponse<object>>> ResetPassword([FromBody] ResetPasswordRequestDTO request)
    {
        try
        {
            var passwordHash = _passwordService.HashPassword(request.NewPassword);
            var success = await _authRepository.ResetPasswordAsync(request.UserId, passwordHash);

            if (success)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Password reset successful"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = false,
                Message = "Failed to reset password"
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
