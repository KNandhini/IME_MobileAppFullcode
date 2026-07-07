// Place in: IME.Infrastructure/Repositories/JobPostingRepository.cs

using System.Data;
using System.Data.SqlClient;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Data;

namespace IME.Infrastructure.Repositories;

public class JobPostingRepository(DatabaseContext dbContext) : IJobPostingRepository
{
    private readonly DatabaseContext _dbContext = dbContext;

    // ── GET ALL (club-scoped) ─────────────────────────────────
    public async Task<List<JobPostingDTOs>> GetAllJobPostingsAsync(int clubId)
    {
        var list = new List<JobPostingDTOs>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetAllJobPostings", connection);
        command.Parameters.AddWithValue("@ClubId", clubId);
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            list.Add(MapJobPostingDTO(reader));
        return list;
    }

    // ── GET BY ID ─────────────────────────────────────────────
    public async Task<JobPostingDetailDTO?> GetJobPostingByIdAsync(int jobPostingId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetJobPostingById", connection);
        command.Parameters.AddWithValue("@JobPostingId", jobPostingId);
        using var reader = await command.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;

        var dto = new JobPostingDetailDTO
        {
            JobPostingId = reader.GetInt32(reader.GetOrdinal("JobPostingId")),
            ClubId = reader.GetInt32(reader.GetOrdinal("ClubId")),
            JobTitle = reader.GetString(reader.GetOrdinal("JobTitle")),
            CompanyName = reader.GetString(reader.GetOrdinal("CompanyName")),
            Location = reader.GetString(reader.GetOrdinal("Location")),
            EmploymentType = reader.GetString(reader.GetOrdinal("EmploymentType")),
            WorkingHours = reader.IsDBNull(reader.GetOrdinal("WorkingHours")) ? null : reader.GetString(reader.GetOrdinal("WorkingHours")),
            WorkMode = reader.GetString(reader.GetOrdinal("WorkMode")),
            AboutRole = reader.IsDBNull(reader.GetOrdinal("AboutRole")) ? null : reader.GetString(reader.GetOrdinal("AboutRole")),
            RequiredSkillsExperience = reader.IsDBNull(reader.GetOrdinal("RequiredSkillsExperience")) ? null : reader.GetString(reader.GetOrdinal("RequiredSkillsExperience")),
            ContactInfo = reader.GetString(reader.GetOrdinal("ContactInfo")),
            VacancyClosingDate = reader.GetDateTime(reader.GetOrdinal("VacancyClosingDate")),
            SalaryPackage = reader.IsDBNull(reader.GetOrdinal("SalaryPackage")) ? null : reader.GetString(reader.GetOrdinal("SalaryPackage")),
            CreatedBy = reader.GetString(reader.GetOrdinal("CreatedBy")),
            CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
            ModifiedBy = reader.IsDBNull(reader.GetOrdinal("ModifiedBy")) ? null : reader.GetString(reader.GetOrdinal("ModifiedBy")),
            ModifiedDate = reader.IsDBNull(reader.GetOrdinal("ModifiedDate")) ? null : reader.GetDateTime(reader.GetOrdinal("ModifiedDate")),
            Attachments = []
        };
        reader.Close();

        var attachments = await GetJobPostingAttachmentsAsync(jobPostingId);
        dto.Attachments = attachments;
        dto.AttachmentPath = attachments.FirstOrDefault()?.FilePath;
        return dto;
    }

    // ── CREATE ────────────────────────────────────────────────
    public async Task<int> CreateJobPostingAsync(JobPosting jp)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_CreateJobPosting", connection);
        command.Parameters.AddWithValue("@ClubId", jp.ClubId);
        command.Parameters.AddWithValue("@JobTitle", jp.JobTitle);
        command.Parameters.AddWithValue("@CompanyName", jp.CompanyName);
        command.Parameters.AddWithValue("@Location", jp.Location);
        command.Parameters.AddWithValue("@EmploymentType", jp.EmploymentType);
        command.Parameters.AddWithValue("@WorkingHours", (object?)jp.WorkingHours ?? DBNull.Value);
        command.Parameters.AddWithValue("@WorkMode", jp.WorkMode);
        command.Parameters.AddWithValue("@AboutRole", (object?)jp.AboutRole ?? DBNull.Value);
        command.Parameters.AddWithValue("@RequiredSkillsExperience", (object?)jp.RequiredSkillsExperience ?? DBNull.Value);
        command.Parameters.AddWithValue("@ContactInfo", jp.ContactInfo);
        command.Parameters.AddWithValue("@VacancyClosingDate", jp.VacancyClosingDate);
        command.Parameters.AddWithValue("@SalaryPackage", (object?)jp.SalaryPackage ?? DBNull.Value);
        command.Parameters.AddWithValue("@CreatedBy", jp.CreatedBy);
        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    // ── UPDATE ────────────────────────────────────────────────
    public async Task<bool> UpdateJobPostingAsync(JobPosting jp)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_UpdateJobPosting", connection);
        command.Parameters.AddWithValue("@JobPostingId", jp.JobPostingId);
        command.Parameters.AddWithValue("@JobTitle", jp.JobTitle);
        command.Parameters.AddWithValue("@CompanyName", jp.CompanyName);
        command.Parameters.AddWithValue("@Location", jp.Location);
        command.Parameters.AddWithValue("@EmploymentType", jp.EmploymentType);
        command.Parameters.AddWithValue("@WorkingHours", (object?)jp.WorkingHours ?? DBNull.Value);
        command.Parameters.AddWithValue("@WorkMode", jp.WorkMode);
        command.Parameters.AddWithValue("@AboutRole", (object?)jp.AboutRole ?? DBNull.Value);
        command.Parameters.AddWithValue("@RequiredSkillsExperience", (object?)jp.RequiredSkillsExperience ?? DBNull.Value);
        command.Parameters.AddWithValue("@ContactInfo", jp.ContactInfo);
        command.Parameters.AddWithValue("@VacancyClosingDate", jp.VacancyClosingDate);
        command.Parameters.AddWithValue("@SalaryPackage", (object?)jp.SalaryPackage ?? DBNull.Value);
        command.Parameters.AddWithValue("@ModifiedBy", jp.ModifiedBy ?? string.Empty);
        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;
        return false;
    }

    // ── DELETE ────────────────────────────────────────────────
    public async Task<bool> DeleteJobPostingAsync(int jobPostingId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_DeleteJobPosting", connection);
        command.Parameters.AddWithValue("@JobPostingId", jobPostingId);
        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;
        return false;
    }

    // ── GET ATTACHMENTS ───────────────────────────────────────
    public async Task<List<AttachmentDTO>> GetJobPostingAttachmentsAsync(int jobPostingId)
    {
        var list = new List<AttachmentDTO>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetJobPostingAttachments", connection);
        command.Parameters.AddWithValue("@JobPostingId", jobPostingId);
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new AttachmentDTO
            {
                AttachmentId = reader.GetInt32(reader.GetOrdinal("AttachmentId")),
                FileName = reader.IsDBNull(reader.GetOrdinal("FileName")) ? null : reader.GetString(reader.GetOrdinal("FileName")),
                FilePath = reader.IsDBNull(reader.GetOrdinal("FilePath")) ? null : reader.GetString(reader.GetOrdinal("FilePath")),
                UploadedDate = reader.GetDateTime(reader.GetOrdinal("UploadedDate")),
            });
        }
        return list;
    }

    // ── ADD ATTACHMENT ────────────────────────────────────────
    // Uses SP directly — same fix as AchievementRepository to avoid silent failures.
    public async Task<AttachmentDTO> AddJobPostingAttachmentAsync(
        int jobPostingId, string fileName, string filePath, int uploadedBy)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_AddJobPostingAttachment", connection);
        command.Parameters.AddWithValue("@JobPostingId", jobPostingId);
        command.Parameters.AddWithValue("@FileName", fileName);
        command.Parameters.AddWithValue("@FilePath", filePath);
        command.Parameters.AddWithValue("@FileSize", 0);
        command.Parameters.AddWithValue("@FileType", Path.GetExtension(fileName).TrimStart('.'));
        command.Parameters.AddWithValue("@UploadedBy", uploadedBy);
        var attachmentId = Convert.ToInt32(await command.ExecuteScalarAsync());
        return new AttachmentDTO
        {
            AttachmentId = attachmentId,
            FileName = fileName,
            FilePath = filePath,
            UploadedDate = DateTime.Now,
        };
    }

    // ── DELETE ATTACHMENT ─────────────────────────────────────
    public async Task<bool> DeleteJobPostingAttachmentAsync(int attachmentId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_DeleteJobPostingAttachment", connection);
        command.Parameters.AddWithValue("@AttachmentId", attachmentId);
        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;
        return false;
    }

    // ── MAPPER ────────────────────────────────────────────────
    private static JobPostingDTOs MapJobPostingDTO(SqlDataReader r)
    {
        return new JobPostingDTOs
        {
            JobPostingId = r.GetInt32(r.GetOrdinal("JobPostingId")),
            ClubId = r.GetInt32(r.GetOrdinal("ClubId")),
            JobTitle = r.GetString(r.GetOrdinal("JobTitle")),
            CompanyName = r.GetString(r.GetOrdinal("CompanyName")),
            Location = r.GetString(r.GetOrdinal("Location")),
            EmploymentType = r.GetString(r.GetOrdinal("EmploymentType")),
            WorkingHours = r.IsDBNull(r.GetOrdinal("WorkingHours")) ? null : r.GetString(r.GetOrdinal("WorkingHours")),
            WorkMode = r.GetString(r.GetOrdinal("WorkMode")),
            SalaryPackage = r.IsDBNull(r.GetOrdinal("SalaryPackage")) ? null : r.GetString(r.GetOrdinal("SalaryPackage")),
            VacancyClosingDate = r.GetDateTime(r.GetOrdinal("VacancyClosingDate")),
            CreatedBy = r.GetString(r.GetOrdinal("CreatedBy")),
            CreatedDate = r.GetDateTime(r.GetOrdinal("CreatedDate")),
            AttachmentPath = r.IsDBNull(r.GetOrdinal("AttachmentPath")) ? null : r.GetString(r.GetOrdinal("AttachmentPath")),
        };
    }
}