using System.Data;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Infrastructure.Data;

namespace IME.Infrastructure.Repositories;

public class MunicipalCorpRepository : IMunicipalCorpRepository
{
    private readonly DatabaseContext _dbContext;

    public MunicipalCorpRepository(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<DistrictDTO>> GetDistrictsAsync(int stateId)
    {
        var list = new List<DistrictDTO>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetDistricts", connection);
        command.Parameters.AddWithValue("@StateId", stateId);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new DistrictDTO
            {
                DistrictId   = reader.GetInt32(reader.GetOrdinal("DistrictId")),
                DistrictName = reader.GetString(reader.GetOrdinal("DistrictName")),
                StateId      = reader.GetInt32(reader.GetOrdinal("StateId")),
            });
        }
        return list;
    }

    public async Task<List<MunicipalCorpDTO>> GetMunicipalCorpsAsync(int districtId)
    {
        var list = new List<MunicipalCorpDTO>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetMunicipalCorps", connection);
        command.Parameters.AddWithValue("@DistrictId", districtId);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            list.Add(MapCorp(reader));

        return list;
    }

    public async Task<MunicipalCorpDTO?> GetMunicipalCorpByIdAsync(int corpId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetMunicipalCorpById", connection);
        command.Parameters.AddWithValue("@CorpId", corpId);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return MapCorp(reader);

        return null;
    }

    public async Task<List<MunicipalCorpDTO>> GetMunicipalCorpsByStateAsync(int stateId)
    {
        var list = new List<MunicipalCorpDTO>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetMunicipalCorpsByState", connection);
        command.Parameters.AddWithValue("@StateId", stateId);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            list.Add(MapCorp(reader));

        return list;
    }

    private static MunicipalCorpDTO MapCorp(IDataReader r)
    {
        int Ord(string n) => r.GetOrdinal(n);
        string? Str(string n) => r.IsDBNull(Ord(n)) ? null : r.GetString(Ord(n));
        int? Int(string n)  => r.IsDBNull(Ord(n)) ? null : r.GetInt32(Ord(n));

        return new MunicipalCorpDTO
        {
            CorpId          = r.GetInt32(Ord("CorpId")),
            CorpName        = r.GetString(Ord("CorpName")),
            CorpCode        = Str("CorpCode"),
            DistrictId      = r.GetInt32(Ord("DistrictId")),
            DistrictName    = r.GetString(Ord("DistrictName")),
            StateId         = r.GetInt32(Ord("StateId")),
            StateName       = r.GetString(Ord("StateName")),
            CountryId       = r.GetInt32(Ord("CountryId")),
            CountryName     = r.GetString(Ord("CountryName")),
            Address         = Str("Address"),
            ContactNumber   = Str("ContactNumber"),
            Email           = Str("Email"),
            Website         = Str("Website"),
            EstablishedYear = Int("EstablishedYear"),
            WardCount       = Int("WardCount"),
            MayorName       = Str("MayorName"),
            Population      = Str("Population"),
            Area            = Str("Area"),
            IsActive        = r.GetBoolean(Ord("IsActive")),
        };
    }
}
