using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Infrastructure.Data;

namespace IME.Infrastructure.Repositories;

public class NewsRepository(DatabaseContext dbContext) : INewsRepository
{
    private readonly DatabaseContext _dbContext = dbContext;

    // ── GET ALL ───────────────────────────────────────────────
    public async Task<List<NewsDTO>> GetAllNewsAsync(int pageNumber, int pageSize)
    {
        var list = new List<NewsDTO>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetAllNews", connection);
        command.Parameters.AddWithValue("@PageNumber", pageNumber);
        command.Parameters.AddWithValue("@PageSize", pageSize);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new NewsDTO
            {
                NewsId = reader.GetInt32(reader.GetOrdinal("NewsId")),
                Title = reader.GetString(reader.GetOrdinal("Title")),
                ShortDescription = reader.IsDBNull(reader.GetOrdinal("ShortDescription")) ? null : reader.GetString(reader.GetOrdinal("ShortDescription")),
                CoverImagePath = reader.IsDBNull(reader.GetOrdinal("CoverImagePath")) ? null : reader.GetString(reader.GetOrdinal("CoverImagePath")),
                PublishDate = reader.GetDateTime(reader.GetOrdinal("PublishDate")),
                AttachmentCount = reader.GetInt32(reader.GetOrdinal("AttachmentCount")),
            });
        }
        return list;
    }

    // ── GET BY ID ─────────────────────────────────────────────
    public async Task<NewsDetailDTO?> GetNewsByIdAsync(int newsId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetNewsById", connection);
        command.Parameters.AddWithValue("@NewsId", newsId);

        using var reader = await command.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;

        var news = new NewsDetailDTO
        {
            NewsId = reader.GetInt32(reader.GetOrdinal("NewsId")),
            Title = reader.GetString(reader.GetOrdinal("Title")),
            ShortDescription = reader.IsDBNull(reader.GetOrdinal("ShortDescription")) ? null : reader.GetString(reader.GetOrdinal("ShortDescription")),
            FullContent = reader.IsDBNull(reader.GetOrdinal("FullContent")) ? null : reader.GetString(reader.GetOrdinal("FullContent")),
            CoverImagePath = reader.IsDBNull(reader.GetOrdinal("CoverImagePath")) ? null : reader.GetString(reader.GetOrdinal("CoverImagePath")),
            PublishDate = reader.GetDateTime(reader.GetOrdinal("PublishDate")),
            Attachments = new List<AttachmentDTO>(),
        };
        reader.Close();

        news.Attachments = await GetNewsAttachmentsAsync(newsId);
        return news;
    }

    // ── CREATE ────────────────────────────────────────────────
    public async Task<int> CreateNewsAsync(
        string title, string? shortDescription, string? fullContent,
        string? coverImagePath, int createdBy, DateTime? createdDate)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_CreateNews", connection);
        command.Parameters.AddWithValue("@Title", title);
        command.Parameters.AddWithValue("@ShortDescription", (object?)shortDescription ?? DBNull.Value);
        command.Parameters.AddWithValue("@FullContent", (object?)fullContent ?? DBNull.Value);
        command.Parameters.AddWithValue("@CoverImagePath", (object?)coverImagePath ?? DBNull.Value);
        command.Parameters.AddWithValue("@CreatedBy", createdBy);
        command.Parameters.AddWithValue("@CreatedDate", (object?)(createdDate?.ToUniversalTime() ?? DateTime.UtcNow));

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    // ── UPDATE ────────────────────────────────────────────────
    public async Task<bool> UpdateNewsAsync(
        int newsId, string title, string? shortDescription,
        string? fullContent, string? coverImagePath, DateTime? updatedDate)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateCommand(
            @"UPDATE News SET
                Title            = @Title,
                ShortDescription = @ShortDescription,
                FullContent      = @FullContent,
                CoverImagePath   = @CoverImagePath,
                UpdatedDate      = @UpdatedDate
              WHERE NewsId = @NewsId",
            connection);

        command.Parameters.AddWithValue("@NewsId", newsId);
        command.Parameters.AddWithValue("@Title", title);
        command.Parameters.AddWithValue("@ShortDescription", (object?)shortDescription ?? DBNull.Value);
        command.Parameters.AddWithValue("@FullContent", (object?)fullContent ?? DBNull.Value);
        command.Parameters.AddWithValue("@CoverImagePath", (object?)coverImagePath ?? DBNull.Value);
        command.Parameters.AddWithValue("@UpdatedDate", (object?)(updatedDate?.ToUniversalTime() ?? DateTime.UtcNow));

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    // ── DELETE ────────────────────────────────────────────────
    public async Task<bool> DeleteNewsAsync(int newsId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateCommand(
            "DELETE FROM News WHERE NewsId = @NewsId",
            connection);

        command.Parameters.AddWithValue("@NewsId", newsId);
        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    // ── GET ATTACHMENTS ───────────────────────────────────────
    public async Task<List<AttachmentDTO>> GetNewsAttachmentsAsync(int newsId)
    {
        var list = new List<AttachmentDTO>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetNewsAttachments", connection);
        command.Parameters.AddWithValue("@NewsId", newsId);

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
    public async Task<AttachmentDTO> AddNewsAttachmentAsync(
        int newsId, string fileName, string filePath)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_AddNewsAttachment", connection);
        command.Parameters.AddWithValue("@NewsId", newsId);
        command.Parameters.AddWithValue("@FileName", fileName);
        command.Parameters.AddWithValue("@FilePath", filePath);
        await command.ExecuteNonQueryAsync();

        return new AttachmentDTO
        {
            FileName = fileName,
            FilePath = filePath,
            UploadedDate = DateTime.UtcNow,
        };
    }

    // ── DELETE ATTACHMENT ─────────────────────────────────────
    public async Task DeleteNewsAttachmentAsync(int attachmentId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_DeleteNewsAttachment", connection);
        command.Parameters.AddWithValue("@AttachmentId", attachmentId);
        await command.ExecuteNonQueryAsync();
    }
}