namespace IME.Core.Interfaces;

public interface IAIUrlResolverService
{
    /// <summary>Returns URLs from the static registry (CSV-derived). No AI call, no async.</summary>
    string[] GetRegistryUrls(string corpName, string stateName);

    /// <summary>Calls AI to discover URLs. Only used when registry has no entry or all registry URLs failed.</summary>
    Task<string[]> ResolveUrlsAsync(string corpName, string stateName);
}
