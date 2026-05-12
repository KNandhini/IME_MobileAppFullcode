// LawBotDTOs.cs
// Place in: IME.Core/DTOs/LawBotDTOs.cs

namespace IME.Core.DTOs;

public class LawBotRequestDTO
{
    public string Question { get; set; } = string.Empty;
}

public class LawBotResponseDTO
{
    public bool Success { get; set; }
    public string? Answer { get; set; }
    public string? Message { get; set; }
}