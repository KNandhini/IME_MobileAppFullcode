// Place in: IME.API/Controllers/JobPostingsController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.API.Requests;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Services;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class JobPostingsController : ControllerBase
{
    private readonly IJobPostingRepository _jobPostingRepository;
    private readonly FileStorageService _fileStorageService;

    private static readonly string[] AllowedAttachmentTypes =
        { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".doc", ".docx" };

    public JobPostingsController(
        IJobPostingRepository jobPostingRepository,
        FileStorageService fileStorageService)
    {
        _jobPostingRepository = jobPostingRepository;
        _fileStorageService = fileStorageService;
    }

    // ── helper: build full URL from relative upload path ─────
    private string BuildFileUrl(string? relativePath)
    {
        if (string.IsNullOrEmpty(relativePath)) return string.Empty;
        return $"{Request.Scheme}://{Request.Host}/uploads/{relativePath.Replace('\\', '/')}";
    }

    // ── helper: userId from JWT ───────────────────────────────
    private int GetUserId() =>
        int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    // ── GET /api/jobpostings?clubId=5 ─────────────────────────
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<JobPostingDTOs>>>> GetAll([FromQuery] int clubId)
    {
        try
        {
            var list = await _jobPostingRepository.GetAllJobPostingsAsync(clubId);
            foreach (var jp in list)
                jp.AttachmentPath = BuildFileUrl(jp.AttachmentPath);

            return Ok(new ApiResponse<List<JobPostingDTOs>> { Success = true, Data = list });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<JobPostingDTOs>>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── GET /api/jobpostings/{id} ─────────────────────────────
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<JobPostingDetailDTO>>> GetById(int id)
    {
        try
        {
            var jp = await _jobPostingRepository.GetJobPostingByIdAsync(id);
            if (jp == null)
                return NotFound(new ApiResponse<JobPostingDetailDTO>
                { Success = false, Message = "Job posting not found" });

            foreach (var att in jp.Attachments ?? [])
                att.FilePath = BuildFileUrl(att.FilePath);
            jp.AttachmentPath = jp.Attachments?.FirstOrDefault()?.FilePath;

            return Ok(new ApiResponse<JobPostingDetailDTO> { Success = true, Data = jp });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<JobPostingDetailDTO>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── POST /api/jobpostings ─────────────────────────────────
    private async Task<ActionResult<ApiResponse<object>>> SaveNewJobPostingAsync(JobPostingCreateRequest request)
    {
        try
        {
            var jp = new JobPosting
            {
                ClubId = request.ClubId,
                JobTitle = request.JobTitle,
                CompanyName = request.CompanyName,
                Location = request.Location,
                EmploymentType = request.EmploymentType,
                WorkingHours = request.WorkingHours,
                WorkMode = request.WorkMode,
                AboutRole = request.AboutRole,
                RequiredSkillsExperience = request.RequiredSkillsExperience,
                ContactInfo = request.ContactInfo,
                VacancyClosingDate = DateTime.TryParse(request.VacancyClosingDate, out var dt) ? dt : DateTime.Now,
                SalaryPackage = request.SalaryPackage,
                CreatedBy = request.CreatedBy,
            };

            var jobPostingId = await _jobPostingRepository.CreateJobPostingAsync(jp);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Job posting created successfully",
                Data = new { JobPostingId = jobPostingId }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message} | {ex.InnerException?.Message}" });
        }
    }

    // ── PUT /api/jobpostings/{id} ─────────────────────────────
    private async Task<ActionResult<ApiResponse<object>>> SaveJobPostingUpdateAsync(
        int id,
        JobPostingUpdateRequest request)
    {
        try
        {
            var success = await _jobPostingRepository.UpdateJobPostingAsync(new JobPosting
            {
                JobPostingId = id,
                JobTitle = request.JobTitle,
                CompanyName = request.CompanyName,
                Location = request.Location,
                EmploymentType = request.EmploymentType,
                WorkingHours = request.WorkingHours,
                WorkMode = request.WorkMode,
                AboutRole = request.AboutRole,
                RequiredSkillsExperience = request.RequiredSkillsExperience,
                ContactInfo = request.ContactInfo,
                VacancyClosingDate = DateTime.TryParse(request.VacancyClosingDate, out var dt) ? dt : DateTime.Now,
                SalaryPackage = request.SalaryPackage,
                ModifiedBy = request.ModifiedBy,
                ModifiedDate = DateTime.Now,
            });

            return Ok(new ApiResponse<object>
            {
                Success = success,
                Message = success ? "Job posting updated successfully" : "Job posting not found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message} | {ex.InnerException?.Message}" });
        }
    }

    // ── DELETE /api/jobpostings/{id} ──────────────────────────
    [HttpPost]
    public Task<ActionResult<ApiResponse<object>>> Create([FromBody] JobPostingCreateRequest request) =>
        SaveNewJobPostingAsync(request);

    [HttpPut("{id}")]
    public Task<ActionResult<ApiResponse<object>>> Update(
        int id,
        [FromBody] JobPostingUpdateRequest request) =>
        SaveJobPostingUpdateAsync(id, request);

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        try
        {
            var success = await _jobPostingRepository.DeleteJobPostingAsync(id);
            return Ok(new ApiResponse<object>
            {
                Success = success,
                Message = success ? "Job posting deleted successfully" : "Job posting not found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── GET /api/jobpostings/{id}/attachments ─────────────────
    [HttpGet("{id}/attachments")]
    public async Task<ActionResult<ApiResponse<List<AttachmentDTO>>>> GetAttachments(int id)
    {
        try
        {
            var attachments = await _jobPostingRepository.GetJobPostingAttachmentsAsync(id);
            foreach (var att in attachments)
                att.FilePath = BuildFileUrl(att.FilePath);

            return Ok(new ApiResponse<List<AttachmentDTO>> { Success = true, Data = attachments });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<AttachmentDTO>>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── POST /api/jobpostings/{id}/attachments ─────────────────
    // Mirrors POST /api/achievements/{id}/attachments exactly
    [HttpPost("{id}/attachments")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<List<AttachmentDTO>>>> UploadAttachments(
        int id, [FromForm] List<IFormFile> files)
    {
        try
        {
            if (files == null || files.Count == 0)
                return Ok(new ApiResponse<List<AttachmentDTO>>
                { Success = false, Message = "No files provided." });

            var jp = await _jobPostingRepository.GetJobPostingByIdAsync(id);
            if (jp == null)
                return NotFound(new ApiResponse<List<AttachmentDTO>>
                { Success = false, Message = "Job posting not found." });

            var userId = GetUserId();
            var saved = new List<AttachmentDTO>();

            foreach (var file in files)
            {
                if (file.Length == 0) continue;
                if (file.Length > 50 * 1024 * 1024) continue;   // skip > 50 MB

                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!AllowedAttachmentTypes.Contains(ext)) continue;

                var filePath = await _fileStorageService.SaveFileAsync(
                    file.OpenReadStream(), "JobPostings", id, file.FileName);

                var att = await _jobPostingRepository.AddJobPostingAttachmentAsync(
                    id, file.FileName, filePath, userId);

                att.FilePath = BuildFileUrl(att.FilePath);
                saved.Add(att);
            }

            if (saved.Count == 0)
                return Ok(new ApiResponse<List<AttachmentDTO>>
                { Success = false, Message = "No valid files were uploaded." });

            return Ok(new ApiResponse<List<AttachmentDTO>>
            {
                Success = true,
                Message = $"{saved.Count} file(s) uploaded successfully.",
                Data = saved
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<AttachmentDTO>>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── DELETE /api/jobpostings/attachments/{attachmentId} ────
    [HttpDelete("attachments/{attachmentId}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteAttachment(int attachmentId)
    {
        try
        {
            var deleted = await _jobPostingRepository.DeleteJobPostingAttachmentAsync(attachmentId);
            if (!deleted)
                return NotFound(new ApiResponse<object>
                { Success = false, Message = "Attachment not found." });

            return Ok(new ApiResponse<object>
            { Success = true, Message = "Attachment deleted successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }
}
