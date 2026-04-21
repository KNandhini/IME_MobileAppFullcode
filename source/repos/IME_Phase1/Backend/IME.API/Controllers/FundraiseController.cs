using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Services;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FundraiseController : ControllerBase
{
    private readonly IFundraiseRepository _repository;
    private readonly FileStorageService _fileStorageService;

    private static readonly string[] AllowedImageTypes = { ".jpg", ".jpeg", ".png" };
    private static readonly string[] AllowedDocTypes   = { ".pdf" };

    public FundraiseController(
        IFundraiseRepository repository,
        FileStorageService fileStorageService)
    {
        _repository = repository;
        _fileStorageService = fileStorageService;
    }

    // ✅ GET ALL
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<Fundraise>>>> GetAll()
    {
        var data = await _repository.GetAllFundraiseAsync();
        return Ok(new ApiResponse<List<Fundraise>> { Success = true, Data = data });
    }

    // ✅ GET BY ID
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<Fundraise>>> GetById(int id)
    {
        var data = await _repository.GetFundraiseByIdAsync(id);
        if (data == null)
            return NotFound(new ApiResponse<Fundraise> { Success = false, Message = "Not found" });

        return Ok(new ApiResponse<Fundraise> { Success = true, Data = data });
    }

    // ✅ CREATE
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] FundraiseDto request)
    {
        try
        {
            var fundraise = new Fundraise
            {
                FullName             = request.FullName,
                Age                  = request.Age,
                Gender               = request.Gender,
                Place                = request.Place,
                Address              = request.Address,
                ContactNumber        = request.ContactNumber,
                RelationToCommunity  = request.RelationToCommunity,
                FundTitle            = request.FundTitle,
                FundCategory         = request.FundCategory,
                Description          = request.Description,
                TargetAmount         = request.TargetAmount,
                CollectedAmount      = request.CollectedAmount,
                UrgencyLevel         = request.UrgencyLevel,
                StartDate            = request.StartDate,
                EndDate              = request.EndDate,
                SupportingDocumentUrl = request.SupportingDocumentUrl,
                BeneficiaryPhotoUrl  = request.BeneficiaryPhotoUrl,
                AccountHolderName    = request.AccountHolderName,
                BankAccountNumber    = request.BankAccountNumber,
                IFSCCode             = request.IFSCCode,
                UPIId                = request.UPIId,
                Status               = request.Status,
                CreatedBy            = request.CreatedBy,
                CreatedDate          = DateTime.UtcNow,
                MinimumAmount        = request.MinimumAmount,
                BalanceAmount        = request.TargetAmount - request.CollectedAmount
            };

            var id = await _repository.CreateFundraiseAsync(fundraise);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Created successfully",
                Data    = new { Id = id }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = ex.Message });
        }
    }

    // ✅ UPDATE
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] FundraiseDto request)
    {
        var existing = await _repository.GetFundraiseByIdAsync(id);
        if (existing == null)
            return NotFound();
        existing.FullName = request.FullName;
        existing.Age = request.Age;
        existing.Gender = request.Gender;
        existing.Place = request.Place;
        existing.Address = request.Address;
        existing.ContactNumber = request.ContactNumber;
        existing.RelationToCommunity = request.RelationToCommunity;

        existing.FundTitle = request.FundTitle;
        existing.FundCategory = request.FundCategory;
        existing.Description = request.Description;
        existing.TargetAmount = request.TargetAmount;
        existing.CollectedAmount = request.CollectedAmount;
        existing.UrgencyLevel = request.UrgencyLevel;

        existing.StartDate = request.StartDate;
        existing.EndDate = request.EndDate;

        existing.AccountHolderName = request.AccountHolderName;
        existing.BankAccountNumber = request.BankAccountNumber;
        existing.IFSCCode = request.IFSCCode;
        existing.UPIId = request.UPIId;

        existing.Status = request.Status;
        existing.ModifiedBy = request.ModifiedBy;
        existing.ModifiedDate = DateTime.UtcNow;

        existing.MinimumAmount = request.MinimumAmount;
        existing.BalanceAmount = request.BalanceAmount;

        var success = await _repository.UpdateFundraiseAsync(existing);

        return Ok(new ApiResponse<object>
        {
            Success = success,
            Message = success ? "Updated" : "Failed"
        });
    }

    // ✅ DELETE — also deletes folder and clears DB paths
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        // 1. Load record to get file paths before deleting
        var fundraise = await _repository.GetFundraiseByIdAsync(id);
        if (fundraise != null)
        {
            // 2. Delete the entire folder: Fundraise-{id}
            var folderName = $"Fundraise-{id}";
            var folderPath = _fileStorageService.GetFullPath(folderName);

            if (Directory.Exists(folderPath))
            {
                Directory.Delete(folderPath, recursive: true);
            }
        }

        // 3. Delete DB record
        var success = await _repository.DeleteFundraiseAsync(id);

        return Ok(new ApiResponse<object>
        {
            Success = success,
            Message = success ? "Deleted" : "Failed"
        });
    }

    // ✅ UPLOAD — multiple images AND multiple docs, appended to existing paths
    [HttpPost("{id}/attachments")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> UploadFiles(int id, [FromForm] List<IFormFile> files)
    {
        try
        {
            var fundraise = await _repository.GetFundraiseByIdAsync(id);
            if (fundraise == null)
                return NotFound();

            // Start from existing comma-separated paths
            var photoPaths = ParsePaths(fundraise.BeneficiaryPhotoUrl);
            var docPaths   = ParsePaths(fundraise.SupportingDocumentUrl);

            foreach (var file in files)
            {
                if (file.Length == 0) continue;

                var ext = Path.GetExtension(file.FileName).ToLower();

                if (AllowedImageTypes.Contains(ext))
                {
                    var filePath = await _fileStorageService.SaveFileAsync(
                        file.OpenReadStream(), "Fundraise", id, file.FileName);
                    photoPaths.Add(filePath);
                }
                else if (AllowedDocTypes.Contains(ext))
                {
                    var filePath = await _fileStorageService.SaveFileAsync(
                        file.OpenReadStream(), "Fundraise", id, file.FileName);
                    docPaths.Add(filePath);
                }
                // silently skip unsupported types
            }

            // Save updated comma-separated paths to DB
            var photoUrlString = photoPaths.Count > 0 ? string.Join(",", photoPaths) : null;
            var docUrlString   = docPaths.Count > 0   ? string.Join(",", docPaths)   : null;

            await _repository.UpdateFilePathsAsync(id, photoUrlString, docUrlString);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Files uploaded successfully",
                Data    = new
                {
                    Photos    = photoPaths,
                    Documents = docPaths
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = ex.Message });
        }
    }

    [HttpDelete("{id}/file")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteSingleFile(int id, [FromQuery] string path)
    {
        try
        {
            var fundraise = await _repository.GetFundraiseByIdAsync(id);
            if (fundraise == null)
                return NotFound();

            // Delete from disk
            var deleted = _fileStorageService.DeleteFile(path);

            // Remove path from DB lists
            var photoPaths = ParsePaths(fundraise.BeneficiaryPhotoUrl);
            var docPaths = ParsePaths(fundraise.SupportingDocumentUrl);

            photoPaths.Remove(path);
            docPaths.Remove(path);

            var photoUrlString = photoPaths.Count > 0 ? string.Join(",", photoPaths) : null;
            var docUrlString = docPaths.Count > 0 ? string.Join(",", docPaths) : null;

            // ⬇️ Capture result and return it so you can see if DB update failed
            var dbUpdated = await _repository.UpdateFilePathsAsync(id, photoUrlString, docUrlString);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = $"File deleted from disk: {deleted}, DB updated: {dbUpdated}",
                Data = new
                {
                    RemainingPhotos = photoPaths,
                    RemainingDocuments = docPaths
                }
            });
        }
        catch (Exception ex)
        {
            // ⬇️ This will show you the real error
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    // ✅ DOWNLOAD a file
    [HttpGet("file")]
    public IActionResult GetFile([FromQuery] string path)
    {
        if (!_fileStorageService.FileExists(path))
            return NotFound();

        var fullPath = _fileStorageService.GetFullPath(path);
        var bytes    = System.IO.File.ReadAllBytes(fullPath);

        return File(bytes, "application/octet-stream", Path.GetFileName(path));
    }

    // 🔧 Helper — split stored comma-separated paths into a mutable list
    private static List<string> ParsePaths(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return new List<string>();

        return raw.Split(',', StringSplitOptions.RemoveEmptyEntries)
                  .Select(p => p.Trim())
                  .ToList();
    }
}