using IME.Core.DTOs;

namespace IME.Core.Interfaces;

public interface ILocalBodyRepository
{
    Task<List<LocalBodyDTO>> GetByDistrictAsync(string districtName);
    Task<LocalBodyDTO?> GetByIdAsync(int localBodyId);
    Task<LocalBodyDTO?> SearchAsync(string name, string? districtName = null);
    Task<List<LocalBodyDTO>> GetByTypeAsync(string localBodyType, string stateName = "Tamil Nadu");
}
