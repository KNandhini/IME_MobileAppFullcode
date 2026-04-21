using IME.Core.Models;

namespace IME.Core.Interfaces;

public interface IClubRepository
{
    Task<List<Club>> GetAllClubsAsync(int pageNumber, int pageSize, string? search, bool? isActive);
    Task<Club?> GetClubByIdAsync(int clubId);
    Task<int> CreateClubAsync(Club club);
    Task<bool> UpdateClubAsync(Club club);
    Task<bool> DeleteClubAsync(int clubId, string? modifiedBy);
    Task<bool> UpdateClubLogoAsync(int clubId, string logoPath, string? modifiedBy);
    Task<List<Country>> GetCountriesAsync();
    Task<List<State>> GetStatesByCountryAsync(int countryId);
}
