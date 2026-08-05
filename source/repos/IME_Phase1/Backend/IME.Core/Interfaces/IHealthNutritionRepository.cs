// IHealthNutritionRepository.cs
// Place in: IME.Core/Interfaces/IHealthNutritionRepository.cs

using IME.Core.DTOs;
using IME.Core.Models;

namespace IME.Core.Interfaces;

public interface IHealthNutritionRepository
{
    Task<List<HealthNutritionDTO>> GetAllAsync();
    Task<HealthNutritionDetailDTO?> GetByIdAsync(long id);

    Task<HealthNutrition> CreateAsync(HealthNutrition item);

    /// <summary>
    /// Updates the record. Pass null for Attachment to keep the existing file,
    /// or a new relative path to replace it. Returns the previous attachment
    /// path ONLY when it was actually replaced (so the caller can delete the old file) —
    /// otherwise returns null.
    /// </summary>
    Task<(bool Success, string? OldAttachment)> UpdateAsync(HealthNutrition item);

    /// <summary>
    /// Deletes the record and returns its attachment path (so the caller can delete the file).
    /// </summary>
    Task<(bool Success, string? Attachment)> DeleteAsync(long id);
}
