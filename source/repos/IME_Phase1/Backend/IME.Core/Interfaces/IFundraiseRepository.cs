using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IME.Core.Models;

namespace IME.Core.Interfaces
{
    public interface IFundraiseRepository
    {
        Task<List<Fundraise>> GetAllFundraiseAsync(int pageNumber = 1, int pageSize = 10, string type = null);
        Task<Fundraise?> GetFundraiseByIdAsync(int id);
        Task<int> CreateFundraiseAsync(Fundraise fundraise);
        Task<bool> UpdateFundraiseAsync(Fundraise fundraise);
        Task<(bool Success, string Message)> DeleteFundraiseAsync(int id);
        Task<bool> UpdateFilePathsAsync(int id, string? photoUrls, string? docUrls); // 🆕

    }
}