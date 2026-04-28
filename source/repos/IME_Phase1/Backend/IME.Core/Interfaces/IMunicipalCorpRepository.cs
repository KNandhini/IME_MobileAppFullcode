using IME.Core.DTOs;

namespace IME.Core.Interfaces;

public interface IMunicipalCorpRepository
{
    Task<List<DistrictDTO>> GetDistrictsAsync(int stateId);
    Task<List<MunicipalCorpDTO>> GetMunicipalCorpsAsync(int districtId);
    Task<MunicipalCorpDTO?> GetMunicipalCorpByIdAsync(int corpId);
    Task<List<MunicipalCorpDTO>> GetMunicipalCorpsByStateAsync(int stateId);
}
