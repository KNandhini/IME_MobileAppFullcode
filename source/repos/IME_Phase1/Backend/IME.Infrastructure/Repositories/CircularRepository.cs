using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Infrastructure.Data;

namespace IME.Infrastructure.Repositories;

public class CircularRepository(DatabaseContext dbContext) : ICircularRepository
{
    private readonly DatabaseContext _dbContext = dbContext;

    // ── GET ALL ───────────────────────────────────────────────
    public async Task<List<CircularDTO>> GetAllCircularsAsync()
        => await FetchCircularsAsync(null);

    public async Task<List<CircularDTO>> GetCircularsByClubAsync(int clubId)
        => await FetchCircularsAsync(clubId);

    private async Task<List<CircularDTO>> FetchCircularsAsync(int? clubId)
    {
        var list = new List<CircularDTO>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetAllCirculars", connection);
        if (clubId.HasValue)
            command.Parameters.AddWithValue("@ClubId", clubId.Value);
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            int? rowClubId = null;
            string rowVisibility = "All";
            try { var o = reader.GetOrdinal("ClubId");     if (!reader.IsDBNull(o)) rowClubId    = reader.GetInt32(o);  } catch { }
            try { var o = reader.GetOrdinal("Visibility"); if (!reader.IsDBNull(o)) rowVisibility = reader.GetString(o); } catch { }

            list.Add(new CircularDTO
            {
                CircularId      = reader.GetInt32(reader.GetOrdinal("CircularId")),
                Title           = reader.GetString(reader.GetOrdinal("Title")),
                Description     = reader.IsDBNull(reader.GetOrdinal("Description"))    ? null : reader.GetString(reader.GetOrdinal("Description")),
                CircularNumber  = reader.IsDBNull(reader.GetOrdinal("CircularNumber")) ? null : reader.GetString(reader.GetOrdinal("CircularNumber")),
                PublishDate     = reader.GetDateTime(reader.GetOrdinal("PublishDate")),
                AttachmentCount = reader.GetInt32(reader.GetOrdinal("AttachmentCount")),
                ClubId          = rowClubId,
                Visibility      = rowVisibility,
            });
        }
        return list;
    }

    // ── GET BY ID ─────────────────────────────────────────────
    public async Task<CircularDetailDTO?> GetCircularByIdAsync(int circularId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetCircularById", connection);
        command.Parameters.AddWithValue("@CircularId", circularId);

        using var reader = await command.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;

        int? detailClubId = null;
        string detailVisibility = "All";
        try { var o = reader.GetOrdinal("ClubId");     if (!reader.IsDBNull(o)) detailClubId    = reader.GetInt32(o);  } catch { }
        try { var o = reader.GetOrdinal("Visibility"); if (!reader.IsDBNull(o)) detailVisibility = reader.GetString(o); } catch { }

        var circular = new CircularDetailDTO
        {
            CircularId     = reader.GetInt32(reader.GetOrdinal("CircularId")),
            Title          = reader.GetString(reader.GetOrdinal("Title")),
            Description    = reader.IsDBNull(reader.GetOrdinal("Description"))    ? null : reader.GetString(reader.GetOrdinal("Description")),
            CircularNumber = reader.IsDBNull(reader.GetOrdinal("CircularNumber")) ? null : reader.GetString(reader.GetOrdinal("CircularNumber")),
            PublishDate    = reader.GetDateTime(reader.GetOrdinal("PublishDate")),
            CreatedDate    = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
            ClubId         = detailClubId,
            Visibility     = detailVisibility,
            Attachments    = new List<AttachmentDTO>(),
        };
        reader.Close();

        circular.Attachments = await GetCircularAttachmentsAsync(circularId);
        return circular;
    }

    // ── CREATE ────────────────────────────────────────────────
    public async Task<int> CreateCircularAsync(
        string title, string? description, string? circularNumber,
        DateTime publishDate, int createdBy, int? clubId = null, string visibility = "Public(All Clubs)")
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_CreateCircular", connection);
        command.Parameters.AddWithValue("@Title",          title);
        command.Parameters.AddWithValue("@Description",    (object?)description    ?? DBNull.Value);
        command.Parameters.AddWithValue("@CircularNumber", (object?)circularNumber ?? DBNull.Value);
        command.Parameters.AddWithValue("@PublishDate",    publishDate);
        command.Parameters.AddWithValue("@CreatedBy",      createdBy);
        command.Parameters.AddWithValue("@ClubId",         (object?)clubId ?? DBNull.Value);
        command.Parameters.AddWithValue("@Visibility",     visibility ?? "Public(All Clubs)");
        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    // ── UPDATE ────────────────────────────────────────────────
    public async Task UpdateCircularAsync(
        int circularId, string title, string? description,
        string? circularNumber, DateTime publishDate, string? visibility = null)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_UpdateCircular", connection);
        command.Parameters.AddWithValue("@CircularId",     circularId);
        command.Parameters.AddWithValue("@Title",          title);
        command.Parameters.AddWithValue("@Description",    (object?)description    ?? DBNull.Value);
        command.Parameters.AddWithValue("@CircularNumber", (object?)circularNumber ?? DBNull.Value);
        command.Parameters.AddWithValue("@PublishDate",    publishDate);
        command.Parameters.AddWithValue("@Visibility",     (object?)visibility ?? DBNull.Value);
        await command.ExecuteNonQueryAsync();
    }

    // ── DELETE ────────────────────────────────────────────────
    public async Task DeleteCircularAsync(int circularId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_DeleteCircular", connection);
        command.Parameters.AddWithValue("@CircularId", circularId);
        await command.ExecuteNonQueryAsync();
    }

    // ── GET ATTACHMENTS ───────────────────────────────────────
    public async Task<List<AttachmentDTO>> GetCircularAttachmentsAsync(int circularId)
    {
        var list = new List<AttachmentDTO>();
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetCircularAttachments", connection);
        command.Parameters.AddWithValue("@CircularId", circularId);
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
    public async Task<AttachmentDTO> AddCircularAttachmentAsync(
        int circularId, string fileName, string filePath)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_AddCircularAttachment", connection);
        command.Parameters.AddWithValue("@CircularId", circularId);
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
    public async Task DeleteCircularAttachmentAsync(int attachmentId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_DeleteCircularAttachment", connection);
        command.Parameters.AddWithValue("@AttachmentId", attachmentId);
        await command.ExecuteNonQueryAsync();
    }
}