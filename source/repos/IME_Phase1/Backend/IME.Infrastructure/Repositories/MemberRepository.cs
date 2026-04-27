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
                    : reader.GetInt32(reader.GetOrdinal("ClubId")),

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
        command.Parameters.AddWithValue("@FullName", member.FullName);
        command.Parameters.AddWithValue("@Address", member.Address ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@ContactNumber", member.ContactNumber ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Gender", member.Gender ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Age", member.Age ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@Place", member.Place ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@DesignationId", member.DesignationId ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@ProfilePhotoPath", member.ProfilePhotoPath ?? (object)DBNull.Value);

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;
        }

        return false;
    }

    public async Task<List<Member>> GetAllMembersAsync(int pageNumber, int pageSize)
    {
        var members = new List<Member>();

        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetAllMembers", connection);

        command.Parameters.AddWithValue("@PageNumber", pageNumber);
        command.Parameters.AddWithValue("@PageSize", pageSize);

        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            members.Add(new Member
            {
                MemberId = reader.GetInt32(reader.GetOrdinal("MemberId")),

                Email = reader.GetString(reader.GetOrdinal("Email")),
                FullName = reader.GetString(reader.GetOrdinal("FullName")),

                ContactNumber = reader.IsDBNull(reader.GetOrdinal("ContactNumber"))
                    ? null
                    : reader.GetString(reader.GetOrdinal("ContactNumber")),

                Gender = reader.IsDBNull(reader.GetOrdinal("Gender"))
                    ? null
                    : reader.GetString(reader.GetOrdinal("Gender")),

                MembershipStatus = reader.GetString(reader.GetOrdinal("MembershipStatus")),

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
                    : reader.GetInt32(reader.GetOrdinal("ClubId")),

                ClubName = reader.IsDBNull(reader.GetOrdinal("ClubName"))
                    ? null
                    : reader.GetString(reader.GetOrdinal("ClubName")),

                ProfilePhotoPath = reader.IsDBNull(reader.GetOrdinal("ProfilePhotoPath"))
                    ? null
                    : reader.GetString(reader.GetOrdinal("ProfilePhotoPath")),

                ProfilePhoto = reader.IsDBNull(reader.GetOrdinal("ProfilePhoto"))
                    ? null
                    : (byte[])reader["ProfilePhoto"],

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
