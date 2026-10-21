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

public class LawBotDocumentDTO
{
    public string Key { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public List<string> SampleQuestions { get; set; } = new();
}