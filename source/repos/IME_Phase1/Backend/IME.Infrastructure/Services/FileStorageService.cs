namespace IME.Infrastructure.Services;

public class FileStorageService
{
    private readonly string _uploadBasePath;

    public FileStorageService(string uploadBasePath)
    {
        _uploadBasePath = uploadBasePath;
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string moduleName, int recordId, string fileName)
    {
        // Create folder path: ModuleName-RecordId
        var folderName = $"{moduleName}-{recordId}";
        var folderPath = Path.Combine(_uploadBasePath, folderName);

        // Create directory if it doesn't exist
        if (!Directory.Exists(folderPath))
        {
            Directory.CreateDirectory(folderPath);
        }

        // Generate unique file name to avoid conflicts
        var fileExtension = Path.GetExtension(fileName);
        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(folderPath, uniqueFileName);

        // Save file
        using (var fileStreamOutput = new FileStream(filePath, FileMode.Create))
        {
            await fileStream.CopyToAsync(fileStreamOutput);
        }

        // Return relative path
        return Path.Combine(folderName, uniqueFileName);
    }

    public bool DeleteFile(string relativePath)
    {
        try
        {
            var fullPath = Path.Combine(_uploadBasePath, relativePath);
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                return true;
            }
            return false;
        }
        catch
        {
            return false;
        }
    }

    public string GetFullPath(string relativePath)
    {
        return Path.Combine(_uploadBasePath, relativePath);
    }

    public bool FileExists(string relativePath)
    {
        var fullPath = Path.Combine(_uploadBasePath, relativePath);
        return File.Exists(fullPath);
    }
}
