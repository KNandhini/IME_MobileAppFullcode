namespace IME.Core.DTOs;

public class LoginRequestDTO
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponseDTO
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public int? MemberId { get; set; }
    public string? FullName { get; set; }
    public string? ProfilePhotoPath { get; set; }
    public string Token { get; set; } = string.Empty;
}

public class SignupRequestDTO
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string ContactNumber { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public int Age { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string Place { get; set; } = string.Empty;
    public int DesignationId { get; set; }
    public string? ProfilePhotoPath { get; set; }
    public int? CountryId { get; set; }
  
    public int? StateId { get; set; }
  
    public int? ClubId { get; set; }
  
}

public class ForgotPasswordRequestDTO
{
    public string Email { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
}

public class ResetPasswordRequestDTO
{
    public int UserId { get; set; }
    public string NewPassword { get; set; } = string.Empty;
}
