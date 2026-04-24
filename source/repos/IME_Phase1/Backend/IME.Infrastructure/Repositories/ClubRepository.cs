using System.Data;
using System.Data.SqlClient;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Data;

namespace IME.Infrastructure.Repositories;

public class ClubRepository : IClubRepository
{
    private readonly DatabaseContext _dbContext;

    public ClubRepository(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Club>> GetAllClubsAsync(int pageNumber, int pageSize, string? search, bool? isActive)
    {
        var clubs = new List<Club>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetAllClubs", connection);

        command.Parameters.AddWithValue("@PageNumber", pageNumber);
        command.Parameters.AddWithValue("@PageSize", pageSize);
        command.Parameters.AddWithValue("@Search", (object?)search ?? DBNull.Value);
        command.Parameters.AddWithValue("@IsActive", isActive.HasValue ? (object)isActive.Value : DBNull.Value);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            clubs.Add(MapClub(reader));

        return clubs;
    }

    public async Task<Club?> GetClubByIdAsync(int clubId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetClubById", connection);
        command.Parameters.AddWithValue("@ClubId", clubId);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return MapClub(reader);

        return null;
    }

    public async Task<int> CreateClubAsync(Club club)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_CreateClub", connection);

        AddClubParameters(command, club);
        command.Parameters.AddWithValue("@CreatedBy", (object?)club.CreatedBy ?? DBNull.Value);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            //return reader.GetInt32(reader.GetOrdinal("NewClubId"));
            return Convert.ToInt32(reader["NewClubId"]);

        return 0;
    }

    public async Task<bool> UpdateClubAsync(Club club)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_UpdateClub", connection);

        command.Parameters.AddWithValue("@ClubId", club.ClubId);
        AddClubParameters(command, club);
        command.Parameters.AddWithValue("@ModifiedBy", (object?)club.ModifiedBy ?? DBNull.Value);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;

        return false;
    }

    public async Task<bool> DeleteClubAsync(int clubId, string? modifiedBy)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_DeleteClub", connection);

        command.Parameters.AddWithValue("@ClubId", clubId);
        command.Parameters.AddWithValue("@ModifiedBy", (object?)modifiedBy ?? DBNull.Value);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;

        return false;
    }

    public async Task<bool> UpdateClubLogoAsync(int clubId, string logoPath, string? modifiedBy)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_UpdateClubLogo", connection);

        command.Parameters.AddWithValue("@ClubId", clubId);
        command.Parameters.AddWithValue("@LogoPath", logoPath);
        command.Parameters.AddWithValue("@ModifiedBy", (object?)modifiedBy ?? DBNull.Value);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;

        return false;
    }

    public async Task<string> GetNextClubCodeAsync()
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetNextClubCode", connection);
        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetString(reader.GetOrdinal("NextCode"));
        return "CLUB001";
    }

    public async Task<List<Country>> GetCountriesAsync()
    {
        var list = new List<Country>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetCountries", connection);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new Country
            {
                CountryId = reader.GetInt32(reader.GetOrdinal("CountryId")),
                CountryName = reader.GetString(reader.GetOrdinal("CountryName")),
            });
        }
        return list;
    }

    public async Task<List<State>> GetStatesByCountryAsync(int countryId)
    {
        var list = new List<State>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetStatesByCountry", connection);
        command.Parameters.AddWithValue("@CountryId", countryId);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new State
            {
                StateId = reader.GetInt32(reader.GetOrdinal("StateId")),
                StateName = reader.GetString(reader.GetOrdinal("StateName")),
                CountryId = countryId,
            });
        }
        return list;
    }

    private static Club MapClub(SqlDataReader r) => new()
    {
        ClubId             = r.GetInt32(r.GetOrdinal("ClubId")),
        ClubName           = r.GetString(r.GetOrdinal("ClubName")),
        ClubCode           = r.IsDBNull(r.GetOrdinal("ClubCode"))           ? null : r.GetString(r.GetOrdinal("ClubCode")),
        Description        = r.IsDBNull(r.GetOrdinal("Description"))        ? null : r.GetString(r.GetOrdinal("Description")),
        CountryId          = r.IsDBNull(r.GetOrdinal("CountryId"))          ? null : r.GetInt32(r.GetOrdinal("CountryId")),
        CountryName        = r.IsDBNull(r.GetOrdinal("CountryName"))        ? null : r.GetString(r.GetOrdinal("CountryName")),
        StateId            = r.IsDBNull(r.GetOrdinal("StateId"))            ? null : r.GetInt32(r.GetOrdinal("StateId")),
        StateName          = r.IsDBNull(r.GetOrdinal("StateName"))          ? null : r.GetString(r.GetOrdinal("StateName")),
        City               = r.IsDBNull(r.GetOrdinal("City"))               ? null : r.GetString(r.GetOrdinal("City")),
        District           = r.IsDBNull(r.GetOrdinal("District"))           ? null : r.GetString(r.GetOrdinal("District")),
        AddressLine1       = r.IsDBNull(r.GetOrdinal("AddressLine1"))       ? null : r.GetString(r.GetOrdinal("AddressLine1")),
        AddressLine2       = r.IsDBNull(r.GetOrdinal("AddressLine2"))       ? null : r.GetString(r.GetOrdinal("AddressLine2")),
        Pincode            = r.IsDBNull(r.GetOrdinal("Pincode"))            ? null : r.GetString(r.GetOrdinal("Pincode")),
        ContactPersonName  = r.IsDBNull(r.GetOrdinal("ContactPersonName"))  ? null : r.GetString(r.GetOrdinal("ContactPersonName")),
        ContactNumber      = r.IsDBNull(r.GetOrdinal("ContactNumber"))      ? null : r.GetString(r.GetOrdinal("ContactNumber")),
        AlternateNumber    = r.IsDBNull(r.GetOrdinal("AlternateNumber"))    ? null : r.GetString(r.GetOrdinal("AlternateNumber")),
        Email              = r.IsDBNull(r.GetOrdinal("Email"))              ? null : r.GetString(r.GetOrdinal("Email")),
        Website            = r.IsDBNull(r.GetOrdinal("Website"))            ? null : r.GetString(r.GetOrdinal("Website")),
        ClubType           = r.IsDBNull(r.GetOrdinal("ClubType"))           ? null : r.GetString(r.GetOrdinal("ClubType")),
        EstablishedDate    = r.IsDBNull(r.GetOrdinal("EstablishedDate"))    ? null : r.GetDateTime(r.GetOrdinal("EstablishedDate")),
        TotalMembers       = r.IsDBNull(r.GetOrdinal("TotalMembers"))       ? 0    : r.GetInt32(r.GetOrdinal("TotalMembers")),
        AdminMemberIds     = r.IsDBNull(r.GetOrdinal("AdminMemberIds"))     ? null : r.GetString(r.GetOrdinal("AdminMemberIds")),
        AdminMemberNames   = r.IsDBNull(r.GetOrdinal("AdminMemberNames"))   ? null : r.GetString(r.GetOrdinal("AdminMemberNames")),
        RegistrationNumber = r.IsDBNull(r.GetOrdinal("RegistrationNumber")) ? null : r.GetString(r.GetOrdinal("RegistrationNumber")),
        LogoPath           = r.IsDBNull(r.GetOrdinal("LogoPath"))           ? null : r.GetString(r.GetOrdinal("LogoPath")),
        IsActive           = r.GetBoolean(r.GetOrdinal("IsActive")),
        IsDeleted          = r.GetBoolean(r.GetOrdinal("IsDeleted")),
        CreatedBy          = r.IsDBNull(r.GetOrdinal("CreatedBy"))          ? null : r.GetString(r.GetOrdinal("CreatedBy")),
        CreatedDate        = r.GetDateTime(r.GetOrdinal("CreatedDate")),
        ModifiedBy         = r.IsDBNull(r.GetOrdinal("ModifiedBy"))         ? null : r.GetString(r.GetOrdinal("ModifiedBy")),
        ModifiedDate       = r.IsDBNull(r.GetOrdinal("ModifiedDate"))       ? null : r.GetDateTime(r.GetOrdinal("ModifiedDate")),
    };

    private static void AddClubParameters(SqlCommand cmd, Club club)
    {
        cmd.Parameters.AddWithValue("@ClubName",           club.ClubName);
        cmd.Parameters.AddWithValue("@ClubCode",           (object?)club.ClubCode           ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Description",        (object?)club.Description        ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@CountryId",          (object?)club.CountryId          ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@StateId",            (object?)club.StateId            ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@City",               (object?)club.City               ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@District",           (object?)club.District           ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@AddressLine1",       (object?)club.AddressLine1       ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@AddressLine2",       (object?)club.AddressLine2       ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Pincode",            (object?)club.Pincode            ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ContactPersonName",  (object?)club.ContactPersonName  ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ContactNumber",      (object?)club.ContactNumber      ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@AlternateNumber",    (object?)club.AlternateNumber    ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Email",              (object?)club.Email              ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Website",            (object?)club.Website            ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ClubType",           (object?)club.ClubType           ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@EstablishedDate",    (object?)club.EstablishedDate     ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@TotalMembers",       club.TotalMembers);
        cmd.Parameters.AddWithValue("@AdminMemberIds",     (object?)club.AdminMemberIds     ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@AdminMemberNames",   (object?)club.AdminMemberNames   ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@RegistrationNumber", (object?)club.RegistrationNumber ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@IsActive",           club.IsActive);
    }
}
