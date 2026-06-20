using System.Data;
using System.Data.SqlClient;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Data;

namespace IME.Infrastructure.Repositories;

public class MemberRepository : IMemberRepository
{
    private readonly DatabaseContext _dbContext;

    public MemberRepository(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Member?> GetMemberProfileAsync(int memberId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetMemberProfile", connection);

        command.Parameters.AddWithValue("@MemberId", memberId);

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return new Member
            {
                MemberId = reader.GetInt32(reader.GetOrdinal("MemberId")),
                UserId = reader.GetInt32(reader.GetOrdinal("UserId")),

                Email = reader.GetString(reader.GetOrdinal("Email")),
                FullName = reader.GetString(reader.GetOrdinal("FullName")),

                Address = reader.IsDBNull(reader.GetOrdinal("Address"))
                    ? null
                    : reader.GetString(reader.GetOrdinal("Address")),

                ContactNumber = reader.IsDBNull(reader.GetOrdinal("ContactNumber"))
                    ? null
                    : reader.GetString(reader.GetOrdinal("ContactNumber")),

                Gender = reader.IsDBNull(reader.GetOrdinal("Gender"))
                    ? null
                    : reader.GetString(reader.GetOrdinal("Gender")),

                Age = reader.IsDBNull(reader.GetOrdinal("Age"))
                    ? null
                    : reader.GetInt32(reader.GetOrdinal("Age")),

                DateOfBirth = reader.GetDateTime(reader.GetOrdinal("DateOfBirth")),

                Place = reader.IsDBNull(reader.GetOrdinal("Place"))
                    ? null
                    : reader.GetString(reader.GetOrdinal("Place")),

                DesignationId = reader.IsDBNull(reader.GetOrdinal("DesignationId"))
                    ? null
                    : reader.GetInt32(reader.GetOrdinal("DesignationId")),

                // ? NEW FIELDS
                CountryId = reader.IsDBNull(reader.GetOrdinal("CountryId"))
                    ? null
                    : reader.GetInt32(reader.GetOrdinal("CountryId")),

                CountryName = reader.IsDBNull(reader.GetOrdinal("CountryName"))
                    ? null
                    : reader.GetString(reader.GetOrdinal("CountryName")),

                StateId = reader.IsDBNull(reader.GetOrdinal("StateId"))
                    ? null
                    : reader.GetInt32(reader.GetOrdinal("StateId")),

                StateName = reader.IsDBNull(reader.GetOrdinal("StateName"))
                    ? null
                    : reader.GetString(reader.GetOrdinal("StateName")),

                ClubId = reader.IsDBNull(reader.GetOrdinal("ClubId"))
                    ? null
                    : reader.GetString(reader.GetOrdinal("ClubId")),

                ClubName = reader.IsDBNull(reader.GetOrdinal("ClubName"))
                    ? null
                    : reader.GetString(reader.GetOrdinal("ClubName")),

                ProfilePhotoPath = reader.IsDBNull(reader.GetOrdinal("ProfilePhotoPath"))
                    ? null
                    : reader.GetString(reader.GetOrdinal("ProfilePhotoPath")),
                ProfilePhoto = reader.IsDBNull(reader.GetOrdinal("ProfilePhoto"))
    ? null
    : (byte[])reader["ProfilePhoto"],

                MembershipStatus = reader.GetString(reader.GetOrdinal("MembershipStatus")),
                CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate"))
            };
        }

        return null;
    }

    public async Task<bool> UpdateMemberProfileAsync(Member member)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_UpdateMemberProfile", connection);

        command.Parameters.AddWithValue("@MemberId", member.MemberId);
        command.Parameters.AddWithValue("@FullName", member.FullName ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Email", member.Email ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Address", member.Address ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@ContactNumber", member.ContactNumber ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Gender", member.Gender ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Age", (object?)member.Age ?? DBNull.Value);
        command.Parameters.AddWithValue("@DateOfBirth", (object?)member.DateOfBirth ?? DBNull.Value);
        command.Parameters.AddWithValue("@DesignationId", (object?)member.DesignationId ?? DBNull.Value);
        command.Parameters.AddWithValue("@CountryId", (object?)member.CountryId ?? DBNull.Value);
        command.Parameters.AddWithValue("@StateId", (object?)member.StateId ?? DBNull.Value);
        command.Parameters.AddWithValue("@ClubId", (object?)member.ClubId ?? DBNull.Value);
        command.Parameters.AddWithValue("@ProfilePhotoPath", member.ProfilePhotoPath ?? (object)DBNull.Value);

        // ? Fix: specify SqlDbType explicitly so null doesn't get cast to nvarchar
        var photoParam = command.Parameters.Add("@ProfilePhoto", System.Data.SqlDbType.VarBinary, -1);
        photoParam.Value = (object?)member.ProfilePhoto ?? DBNull.Value;

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;

        return false;
    }

    public async Task<List<Member>> GetAllMembersAsync(int pageNumber, int pageSize)
    {
        var members = new List<Member>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetAllMembers", connection);

        command.Parameters.AddWithValue("@PageNumber", pageNumber);
        command.Parameters.AddWithValue("@PageSize", pageSize);
        //  command.Parameters.AddWithValue("@ClubId", (object?)clubId ?? DBNull.Value); // NEW
        command.CommandTimeout = 300;
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            members.Add(new Member
            {
                MemberId = reader.GetInt32(reader.GetOrdinal("MemberId")),
                Email = reader.GetString(reader.GetOrdinal("Email")),
                FullName = reader.GetString(reader.GetOrdinal("FullName")),
                ContactNumber = reader.IsDBNull(reader.GetOrdinal("ContactNumber")) ? null : reader.GetString(reader.GetOrdinal("ContactNumber")),
                Address = reader.IsDBNull(reader.GetOrdinal("Address")) ? null : reader.GetString(reader.GetOrdinal("Address")),
                Place = reader.IsDBNull(reader.GetOrdinal("Place")) ? null : reader.GetString(reader.GetOrdinal("Place")),
                DateOfBirth = reader.IsDBNull(reader.GetOrdinal("DateOfBirth")) ? null : reader.GetDateTime(reader.GetOrdinal("DateOfBirth")), // NEW

                Age = reader.IsDBNull(reader.GetOrdinal("Age")) ? null : reader.GetInt32(reader.GetOrdinal("Age")),
                Gender = reader.IsDBNull(reader.GetOrdinal("Gender")) ? null : reader.GetString(reader.GetOrdinal("Gender")),
                MembershipStatus = reader.GetString(reader.GetOrdinal("MembershipStatus")), // already computed by SP
                CountryId = reader.IsDBNull(reader.GetOrdinal("CountryId")) ? null : reader.GetInt32(reader.GetOrdinal("CountryId")),
                CountryName = reader.IsDBNull(reader.GetOrdinal("CountryName")) ? null : reader.GetString(reader.GetOrdinal("CountryName")),
                StateId = reader.IsDBNull(reader.GetOrdinal("StateId")) ? null : reader.GetInt32(reader.GetOrdinal("StateId")),
                StateName = reader.IsDBNull(reader.GetOrdinal("StateName")) ? null : reader.GetString(reader.GetOrdinal("StateName")),
                ClubId = reader.IsDBNull(reader.GetOrdinal("ClubId")) ? null : reader.GetString(reader.GetOrdinal("ClubId")),
                ClubName = reader.IsDBNull(reader.GetOrdinal("ClubName")) ? null : reader.GetString(reader.GetOrdinal("ClubName")),
                ProfilePhotoPath = reader.IsDBNull(reader.GetOrdinal("ProfilePhotoPath")) ? null : reader.GetString(reader.GetOrdinal("ProfilePhotoPath")),
               //  ProfilePhoto = reader.IsDBNull(reader.GetOrdinal("ProfilePhoto")) ? null : (byte[])reader["ProfilePhoto"],

                // Do this — convert to base64 string:
    //            ProfilePhotoBase64 = reader.IsDBNull(reader.GetOrdinal("ProfilePhoto"))
    //? null
    //: Convert.ToBase64String((byte[])reader["ProfilePhoto"]),
                GraceExpiryDate = reader.IsDBNull(reader.GetOrdinal("GraceExpiryDate")) ? null : reader.GetDateTime(reader.GetOrdinal("GraceExpiryDate")), // NEW
                CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate"))
            });
        }
        return members;
    }
    public async Task<List<MemberPhoto>> GetAllMemberPhotosAsync(string memberIds)
    {
        var photos = new List<MemberPhoto>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetMemberPhoto", connection);
        command.CommandTimeout = 300;
        command.Parameters.AddWithValue("@MemberIds", memberIds); // ? "1,2,3,5"

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var photoPath = reader.IsDBNull(reader.GetOrdinal("ProfilePhotoPath"))
                ? null
                : reader.GetString(reader.GetOrdinal("ProfilePhotoPath"));

            var photoBase64 = reader.IsDBNull(reader.GetOrdinal("ProfilePhoto"))
                ? null
                : Convert.ToBase64String((byte[])reader["ProfilePhoto"]);

            photos.Add(new MemberPhoto
            {
                MemberId = reader.GetInt32(reader.GetOrdinal("MemberId")),
                ProfilePhotoPath = photoPath,
                ProfilePhotoBase64 = photoBase64,
            });
        }
        return photos;
    }
    // NEW method — club filtered
    public async Task<List<Member>> GetMembersByClubAsync(int pageNumber, int pageSize, int clubId)
    {
        var members = new List<Member>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetMembersByClub", connection);
        command.Parameters.AddWithValue("@PageNumber", pageNumber);
        command.Parameters.AddWithValue("@PageSize", pageSize);
        command.Parameters.AddWithValue("@ClubId", clubId);  // ? only difference
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            members.Add(new Member
            {
                MemberId = reader.GetInt32(reader.GetOrdinal("MemberId")),
                Email = reader.GetString(reader.GetOrdinal("Email")),
                FullName = reader.GetString(reader.GetOrdinal("FullName")),
                ContactNumber = reader.IsDBNull(reader.GetOrdinal("ContactNumber")) ? null : reader.GetString(reader.GetOrdinal("ContactNumber")),
                Address = reader.IsDBNull(reader.GetOrdinal("Address")) ? null : reader.GetString(reader.GetOrdinal("Address")),
                Place = reader.IsDBNull(reader.GetOrdinal("Place")) ? null : reader.GetString(reader.GetOrdinal("Place")),
                DateOfBirth = reader.IsDBNull(reader.GetOrdinal("DateOfBirth")) ? null : reader.GetDateTime(reader.GetOrdinal("DateOfBirth")),
                Age = reader.IsDBNull(reader.GetOrdinal("Age")) ? null : reader.GetInt32(reader.GetOrdinal("Age")),
                Gender = reader.IsDBNull(reader.GetOrdinal("Gender")) ? null : reader.GetString(reader.GetOrdinal("Gender")),
                MembershipStatus = reader.GetString(reader.GetOrdinal("MembershipStatus")),
                CountryId = reader.IsDBNull(reader.GetOrdinal("CountryId")) ? null : reader.GetInt32(reader.GetOrdinal("CountryId")),
                CountryName = reader.IsDBNull(reader.GetOrdinal("CountryName")) ? null : reader.GetString(reader.GetOrdinal("CountryName")),
                StateId = reader.IsDBNull(reader.GetOrdinal("StateId")) ? null : reader.GetInt32(reader.GetOrdinal("StateId")),
                StateName = reader.IsDBNull(reader.GetOrdinal("StateName")) ? null : reader.GetString(reader.GetOrdinal("StateName")),
                ClubId = reader.IsDBNull(reader.GetOrdinal("ClubId")) ? null : reader.GetString(reader.GetOrdinal("ClubId")),
                ClubName = reader.IsDBNull(reader.GetOrdinal("ClubName")) ? null : reader.GetString(reader.GetOrdinal("ClubName")),
                ProfilePhotoPath = reader.IsDBNull(reader.GetOrdinal("ProfilePhotoPath")) ? null : reader.GetString(reader.GetOrdinal("ProfilePhotoPath")),
                //ProfilePhoto = reader.IsDBNull(reader.GetOrdinal("ProfilePhoto")) ? null : (byte[])reader["ProfilePhoto"],
                GraceExpiryDate = reader.IsDBNull(reader.GetOrdinal("GraceExpiryDate")) ? null : reader.GetDateTime(reader.GetOrdinal("GraceExpiryDate")),
                CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate"))
            });
        }
        return members;
    }
    public async Task<bool> UpdateMemberStatusAsync(int memberId, string status, string? reason)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_UpdateMemberStatus", connection);

        command.Parameters.AddWithValue("@MemberId", memberId);
        command.Parameters.AddWithValue("@Status", status);
        command.Parameters.AddWithValue("@Reason", (object?)reason ?? DBNull.Value); 

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;
        }

        return false;
    }
    public async Task<string?> GetPasswordHashAsync(int memberId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();

        using var command = _dbContext.CreateStoredProcCommand(
            "sp_GetPasswordHashByMemberId",
            connection);

        command.Parameters.AddWithValue("@MemberId", memberId);

        var result = await command.ExecuteScalarAsync();

        return result?.ToString();
    }

    public async Task<bool> ChangePasswordAsync(
    int memberId,
    string newPasswordHash)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();

        using var command = _dbContext.CreateStoredProcCommand(
            "sp_ChangePassword",
            connection);

        command.Parameters.AddWithValue("@MemberId", memberId);
        command.Parameters.AddWithValue("@NewPasswordHash", newPasswordHash);

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return reader.GetInt32(
                reader.GetOrdinal("RowsAffected")) > 0;
        }

        return false;
    }
    public async Task<bool> DeleteMemberAsync(int memberId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_DeleteMember", connection);

        command.Parameters.AddWithValue("@MemberId", memberId);

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;
        }

        return false;
    }
}
