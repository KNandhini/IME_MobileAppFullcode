using System.Data;
using System.Data.SqlClient;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Data;

namespace IME.Infrastructure.Repositories;

public class AuthRepository : IAuthRepository
{
    private readonly DatabaseContext _dbContext;

    public AuthRepository(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetUserByEmail", connection);

        command.Parameters.AddWithValue("@Email", email);

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return new User
            {
                UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
                Email = reader.GetString(reader.GetOrdinal("Email")),
                PasswordHash = reader.GetString(reader.GetOrdinal("PasswordHash")),
                RoleId = reader.GetInt32(reader.GetOrdinal("RoleId")),
                IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
            };
        }

        return null;
    }

    public async Task<User?> ValidateUserCredentialsAsync(string email, string passwordHash)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_UserLogin", connection);

        command.Parameters.AddWithValue("@Email", email);
        command.Parameters.AddWithValue("@PasswordHash", passwordHash);

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            string? profilePhotoBase64 = null;
            int photoOrdinal = reader.GetOrdinal("ProfilePhoto");
            if (!reader.IsDBNull(photoOrdinal))
            {
                byte[] photoBytes = (byte[])reader.GetValue(photoOrdinal);
                profilePhotoBase64 = "data:image/jpeg;base64," + Convert.ToBase64String(photoBytes);
            }

            return new User
            {
                UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
                Email = reader.GetString(reader.GetOrdinal("Email")),
                RoleName = reader.IsDBNull(reader.GetOrdinal("RoleName")) ? "" : reader.GetString(reader.GetOrdinal("RoleName")),
                RoleId = reader.GetInt32(reader.GetOrdinal("RoleId")),
                MemberId = reader.IsDBNull(reader.GetOrdinal("MemberId")) ? null : reader.GetInt32(reader.GetOrdinal("MemberId")),
                FullName = reader.IsDBNull(reader.GetOrdinal("FullName")) ? string.Empty : reader.GetString(reader.GetOrdinal("FullName")),
                ProfilePhotoPath = profilePhotoBase64,
                IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
            };
        }

        return null;
    }

    public async Task<(int userId, int memberId, string message, string? countryName, string? stateName, string? clubName)> CreateUserAsync(User user, Member member)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_CreateUser", connection);
        command.Parameters.AddWithValue("@Email", user.Email);
        command.Parameters.AddWithValue("@PasswordHash", user.PasswordHash);
        command.Parameters.AddWithValue("@RoleId", user.RoleId);
        command.Parameters.AddWithValue("@FullName", member.FullName);
        command.Parameters.AddWithValue("@Address", member.Address ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@ContactNumber", member.ContactNumber ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Gender", member.Gender ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Age", member.Age ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@DateOfBirth", member.DateOfBirth);
        command.Parameters.AddWithValue("@Place", member.Place ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@DesignationId", member.DesignationId ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@ProfilePhotoPath", member.ProfilePhotoPath ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@CountryId", member.CountryId ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@StateId", member.StateId ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@ClubId", member.ClubId ?? (object)DBNull.Value);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return (
                reader.GetInt32(reader.GetOrdinal("UserId")),
                reader.GetInt32(reader.GetOrdinal("MemberId")),
                reader.GetString(reader.GetOrdinal("Message")),
                // ? Read joined names back
                reader.IsDBNull(reader.GetOrdinal("CountryName")) ? null : reader.GetString(reader.GetOrdinal("CountryName")),
                reader.IsDBNull(reader.GetOrdinal("StateName")) ? null : reader.GetString(reader.GetOrdinal("StateName")),
                reader.IsDBNull(reader.GetOrdinal("ClubName")) ? null : reader.GetString(reader.GetOrdinal("ClubName"))
            );
        }
        return (-1, -1, "Failed to create user", null, null, null);
    }
    public async Task<User?> ValidateUserForPasswordResetAsync(string email, DateTime dateOfBirth)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_ValidateUserForPasswordReset", connection);

        command.Parameters.AddWithValue("@Email", email);
        command.Parameters.AddWithValue("@DateOfBirth", dateOfBirth);

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return new User
            {
                UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
                Email = reader.GetString(reader.GetOrdinal("Email"))
            };
        }

        return null;
    }

    public async Task<bool> ResetPasswordAsync(int userId, string newPasswordHash)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_ResetPassword", connection);

        command.Parameters.AddWithValue("@UserId", userId);
        command.Parameters.AddWithValue("@NewPasswordHash", newPasswordHash);

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;
        }

        return false;
    }
}
