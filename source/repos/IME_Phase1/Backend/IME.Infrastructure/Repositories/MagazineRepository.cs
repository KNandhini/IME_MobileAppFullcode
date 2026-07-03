// MagazineRepository.cs
// Place in: IME.Infrastructure/Repositories/MagazineRepository.cs

using System.Data.SqlClient;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Data;

namespace IME.Infrastructure.Repositories;

public class MagazineRepository(DatabaseContext dbContext) : IMagazineRepository
{
    private readonly DatabaseContext _dbContext = dbContext;

    // ── GET ALL ───────────────────────────────────────────────
    public async Task<List<MagazineDTO>> GetAllMagazinesAsync()
    {
        var list = new List<MagazineDTO>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetAllMagazines", connection);
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            list.Add(MapMagazine(reader));
        return list;
    }

    // ── GET BY ID ─────────────────────────────────────────────
    public async Task<MagazineDetailDTO?> GetMagazineByIdAsync(int magazineId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetMagazineById", connection);
        command.Parameters.AddWithValue("@MagazineId", magazineId);

        using var reader = await command.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;

        var magazine = new MagazineDetailDTO
        {
            MagazineId = reader.GetInt32(reader.GetOrdinal("MagazineId")),
            Title = reader.GetString(reader.GetOrdinal("Title")),
            Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
            IssueNumber = reader.IsDBNull(reader.GetOrdinal("IssueNumber")) ? null : reader.GetString(reader.GetOrdinal("IssueNumber")),
            PublishedDate = reader.GetDateTime(reader.GetOrdinal("PublishedDate")),
            AuthorName = reader.IsDBNull(reader.GetOrdinal("AuthorName")) ? null : reader.GetString(reader.GetOrdinal("AuthorName")),
            Category = reader.IsDBNull(reader.GetOrdinal("Category")) ? null : reader.GetString(reader.GetOrdinal("Category")),
            CreatedBy = reader.GetInt32(reader.GetOrdinal("CreatedBy")),
            CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
            Attachments = []
        };
        reader.Close();

        var attachments = await GetMagazineAttachmentsAsync(magazineId);
        magazine.Attachments = attachments;
        magazine.AttachmentPath = attachments.FirstOrDefault()?.FilePath;
        return magazine;
    }

    // ── CREATE ────────────────────────────────────────────────
    public async Task<int> CreateMagazineAsync(Magazine magazine)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_CreateMagazine", connection);
        command.Parameters.AddWithValue("@Title", magazine.Title);
        command.Parameters.AddWithValue("@Description", (object?)magazine.Description ?? DBNull.Value);
        command.Parameters.AddWithValue("@IssueNumber", (object?)magazine.IssueNumber ?? DBNull.Value);
        command.Parameters.AddWithValue("@PublishedDate", magazine.PublishedDate);
        command.Parameters.AddWithValue("@AuthorName", (object?)magazine.AuthorName ?? DBNull.Value);
        command.Parameters.AddWithValue("@Category", (object?)magazine.Category ?? DBNull.Value);
        command.Parameters.AddWithValue("@CreatedBy", magazine.CreatedBy);
        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }
    // ── UPDATE ────────────────────────────────────────────────
    public async Task<bool> UpdateMagazineAsync(Magazine magazine)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_UpdateMagazine", connection);
        command.Parameters.AddWithValue("@MagazineId", magazine.MagazineId);
        command.Parameters.AddWithValue("@Title", magazine.Title);
        command.Parameters.AddWithValue("@Description", (object?)magazine.Description ?? DBNull.Value);
        command.Parameters.AddWithValue("@IssueNumber", (object?)magazine.IssueNumber ?? DBNull.Value);
        command.Parameters.AddWithValue("@PublishedDate", magazine.PublishedDate);
        command.Parameters.AddWithValue("@AuthorName", (object?)magazine.AuthorName ?? DBNull.Value);
        command.Parameters.AddWithValue("@Category", (object?)magazine.Category ?? DBNull.Value);
        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;
        return false;
    }

    // ── DELETE ────────────────────────────────────────────────
    public async Task<bool> DeleteMagazineAsync(int magazineId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_DeleteMagazine", connection);
        command.Parameters.AddWithValue("@MagazineId", magazineId);
        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;
        return false;
    }

    // ── GET ATTACHMENTS ───────────────────────────────────────
    public async Task<List<MagazineAttachmentDTO>> GetMagazineAttachmentsAsync(int magazineId)
    {
        var list = new List<MagazineAttachmentDTO>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetMagazineAttachments", connection);
        command.Parameters.AddWithValue("@MagazineId", magazineId);
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new MagazineAttachmentDTO
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
    public async Task<MagazineAttachmentDTO> AddMagazineAttachmentAsync(
        int magazineId, string fileName, string filePath, int uploadedBy)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_AddMagazineAttachment", connection);
        command.Parameters.AddWithValue("@MagazineId", magazineId);
        command.Parameters.AddWithValue("@FileName", fileName);
        command.Parameters.AddWithValue("@FilePath", filePath);
        command.Parameters.AddWithValue("@FileSize", 0);
        command.Parameters.AddWithValue("@FileType", Path.GetExtension(fileName).TrimStart('.'));
        command.Parameters.AddWithValue("@UploadedBy", uploadedBy);
        var attachmentId = Convert.ToInt32(await command.ExecuteScalarAsync());
        return new MagazineAttachmentDTO
        {
            AttachmentId = attachmentId,
            FileName = fileName,
            FilePath = filePath,
            UploadedDate = DateTime.UtcNow,
        };
    }

    // ── DELETE ATTACHMENT ─────────────────────────────────────
    public async Task<bool> DeleteMagazineAttachmentAsync(int attachmentId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_DeleteMagazineAttachment", connection);
        command.Parameters.AddWithValue("@AttachmentId", attachmentId);
        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;
        return false;
    }



    // ── MAPPER ────────────────────────────────────────────────
    private static MagazineDTO MapMagazine(SqlDataReader r) => new()
    {
        MagazineId = r.GetInt32(r.GetOrdinal("MagazineId")),
        Title = r.GetString(r.GetOrdinal("Title")),
        Description = r.IsDBNull(r.GetOrdinal("Description")) ? null : r.GetString(r.GetOrdinal("Description")),
        IssueNumber = r.IsDBNull(r.GetOrdinal("IssueNumber")) ? null : r.GetString(r.GetOrdinal("IssueNumber")),
        PublishedDate = r.GetDateTime(r.GetOrdinal("PublishedDate")),
        AuthorName = r.IsDBNull(r.GetOrdinal("AuthorName")) ? null : r.GetString(r.GetOrdinal("AuthorName")),
        Category = r.IsDBNull(r.GetOrdinal("Category")) ? null : r.GetString(r.GetOrdinal("Category")),
        AttachmentPath = r.IsDBNull(r.GetOrdinal("AttachmentPath")) ? null : r.GetString(r.GetOrdinal("AttachmentPath")),
        CreatedBy = r.GetInt32(r.GetOrdinal("CreatedBy")),
        CreatedDate = r.GetDateTime(r.GetOrdinal("CreatedDate")),
    };
    // ── GET FORUM DISCUSSION ───────────────────────────────────
    public async Task<List<ForumDiscussionDto>> GetForumDiscussionAsync(int magazineId)
    {
        var list = new List<ForumDiscussionDto>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_ForumDiscussion_GetByMagazine", connection);
        command.Parameters.AddWithValue("@MagazineId", magazineId);
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            list.Add(MapDiscussion(reader));
        return list;
    }

    // ── ADD FORUM DISCUSSION ────────────────────────────────────
    public async Task<ForumDiscussionDto> AddForumDiscussionAsync(
        int magazineId, int memberId, string memberName, string comment)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_ForumDiscussion_Insert", connection);
        command.Parameters.AddWithValue("@MagazineId", magazineId);
        command.Parameters.AddWithValue("@MemberId", memberId);
        command.Parameters.AddWithValue("@MemberName", memberName);
        command.Parameters.AddWithValue("@Comment", comment);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return MapDiscussion(reader);

        throw new InvalidOperationException("Failed to insert forum discussion.");
    }
    private static ForumDiscussionDto MapDiscussion(SqlDataReader r) => new()
    {
        DiscussionId = r.GetInt32(r.GetOrdinal("DiscussionId")),
        MagazineId = r.GetInt32(r.GetOrdinal("MagazineId")),
        MemberId = r.GetInt32(r.GetOrdinal("MemberId")),
        MemberName = r.IsDBNull(r.GetOrdinal("MemberName")) ? string.Empty : r.GetString(r.GetOrdinal("MemberName")),
        Comment = r.IsDBNull(r.GetOrdinal("Comment")) ? string.Empty : r.GetString(r.GetOrdinal("Comment")),
        CreatedDate = r.GetDateTime(r.GetOrdinal("CreatedDate")),
    };
}