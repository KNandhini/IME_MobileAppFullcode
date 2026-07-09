// Place in: IME.Core/Interfaces/IJobPostingRepository.cs

using IME.Core.DTOs;
using IME.Core.Models;

namespace IME.Core.Interfaces;

public interface IJobPostingRepository
{
    Task<List<JobPostingDTOs>> GetAllJobPostingsAsync(int clubId);
    Task<JobPostingDetailDTO?> GetJobPostingByIdAsync(int jobPostingId);
    Task<int> CreateJobPostingAsync(JobPosting jobPosting);
    Task<bool> UpdateJobPostingAsync(JobPosting jobPosting);
    Task<bool> DeleteJobPostingAsync(int jobPostingId, string modifiedBy);
    Task<List<AttachmentDTO>> GetJobPostingAttachmentsAsync(int jobPostingId);

    Task<AttachmentDTO> AddJobPostingAttachmentAsync(
                                     int jobPostingId,
                                     string fileName,
                                     string filePath,
                                     long fileSize);

    Task<bool> DeleteJobPostingAttachmentAsync(int attachmentId);
}