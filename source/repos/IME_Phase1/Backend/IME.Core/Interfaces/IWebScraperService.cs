using IME.Core.DTOs;

namespace IME.Core.Interfaces;

public interface IWebScraperService
{
    Task<CorpScrapeDTO> ScrapeCorpPageAsync(string corpName, string stateName);
}
