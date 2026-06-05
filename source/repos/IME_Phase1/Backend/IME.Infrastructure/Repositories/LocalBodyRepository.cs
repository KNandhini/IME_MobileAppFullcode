using System.Data;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Infrastructure.Data;

namespace IME.Infrastructure.Repositories;

public class LocalBodyRepository : ILocalBodyRepository
{
    private readonly DatabaseContext _db;

    public LocalBodyRepository(DatabaseContext db) => _db = db;

    public async Task<List<LocalBodyDTO>> GetByDistrictAsync(string districtName)
    {
        var list = new List<LocalBodyDTO>();
        using var conn = await _db.CreateOpenConnectionAsync();
        using var cmd  = _db.CreateStoredProcCommand("sp_GetLocalBodiesByDistrict", conn);
        cmd.Parameters.AddWithValue("@DistrictName", districtName);
        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync()) list.Add(Map(r));
        return list;
    }

    public async Task<LocalBodyDTO?> GetByIdAsync(int localBodyId)
    {
        using var conn = await _db.CreateOpenConnectionAsync();
        using var cmd  = _db.CreateStoredProcCommand("sp_GetLocalBodyById", conn);
        cmd.Parameters.AddWithValue("@LocalBodyId", localBodyId);
        using var r = await cmd.ExecuteReaderAsync();
        return await r.ReadAsync() ? Map(r) : null;
    }

    public async Task<LocalBodyDTO?> SearchAsync(string name, string? districtName = null)
    {
        using var conn = await _db.CreateOpenConnectionAsync();
        using var cmd  = _db.CreateStoredProcCommand("sp_SearchLocalBody", conn);
        cmd.Parameters.AddWithValue("@SearchName",   name);
        cmd.Parameters.AddWithValue("@DistrictName", (object?)districtName ?? DBNull.Value);
        using var r = await cmd.ExecuteReaderAsync();
        return await r.ReadAsync() ? Map(r) : null;
    }

    public async Task<List<LocalBodyDTO>> GetByTypeAsync(string localBodyType, string stateName = "Tamil Nadu")
    {
        var list = new List<LocalBodyDTO>();
        using var conn = await _db.CreateOpenConnectionAsync();
        using var cmd  = _db.CreateStoredProcCommand("sp_GetLocalBodiesByType", conn);
        cmd.Parameters.AddWithValue("@LocalBodyType", localBodyType);
        cmd.Parameters.AddWithValue("@StateName",     stateName);
        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync()) list.Add(Map(r));
        return list;
    }

    private static LocalBodyDTO Map(IDataReader r)
    {
        int  Ord(string n) => r.GetOrdinal(n);
        string? S(string n) => r.IsDBNull(Ord(n)) ? null : r.GetString(Ord(n));
        int?    I(string n) => r.IsDBNull(Ord(n)) ? null : r.GetInt32(Ord(n));

        return new LocalBodyDTO
        {
            LocalBodyId       = r.GetInt32(Ord("LocalBodyId")),
            LocalBodyName     = r.GetString(Ord("LocalBodyName")),
            LocalBodyType     = r.GetString(Ord("LocalBodyType")),
            DistrictName      = r.GetString(Ord("DistrictName")),
            StateName         = r.GetString(Ord("StateName")),
            Pincode           = S("Pincode"),
            Address           = S("Address"),
            ContactNumber     = S("ContactNumber"),
            Email             = S("Email"),
            OfficialWebsiteUrl = S("OfficialWebsiteUrl"),
            TnurbantreeUrl    = S("TnurbantreeUrl"),
            ChairpersonName   = S("ChairpersonName"),
            CommissionerName  = S("CommissionerName"),
            WardCount         = I("WardCount"),
            Population        = S("Population"),
            EstablishedYear   = I("EstablishedYear"),
            AboutDescription  = S("AboutDescription"),
            IsActive          = r.GetBoolean(Ord("IsActive")),
        };
    }
}
