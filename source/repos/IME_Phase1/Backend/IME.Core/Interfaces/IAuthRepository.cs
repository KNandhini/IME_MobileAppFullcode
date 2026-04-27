using IME.Core.Models;

namespace IME.Core.Interfaces;

public interface IAuthRepository
{
    Task<User?> GetUserByEmailAsync(string email);
    Task<User?> ValidateUserCredentialsAsync(string email, string passwordHash);
    Task<(int userId, int memberId, string message, string? countryName, string? stateName, string? clubName)> CreateUserAsync(User user, Member member);
    Task<User?> ValidateUserForPasswordResetAsync(string email, DateTime dateOfBirth);
    Task<bool> ResetPasswordAsync(int userId, string newPasswordHash);
}
