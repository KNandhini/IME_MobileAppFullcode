using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Infrastructure.Data;

namespace IME.Infrastructure.Repositories;

public class RoleRepository : IRoleRepository
{
    private readonly DatabaseContext _dbContext;

    public RoleRepository(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<RoleDTO>> GetAllRolesAsync()
    {
        var roles = new List<RoleDTO>();

        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetAllRoles", connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            roles.Add(new RoleDTO
            {
                RoleId   = reader.GetInt32(reader.GetOrdinal("RoleId")),
                RoleName = reader.GetString(reader.GetOrdinal("RoleName")),
                IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
            });
        }
        return roles;
    }
}
