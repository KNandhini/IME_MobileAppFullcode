using IME.Core.DTOs;

namespace IME.Core.Interfaces;

public interface IRoleRepository
{
    Task<List<RoleDTO>> GetAllRolesAsync();
}
