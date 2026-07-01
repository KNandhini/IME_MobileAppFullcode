using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Infrastructure.Data;

namespace IME.Infrastructure.Repositories;

public class FeedRepository : IFeedRepository
{
    private readonly DatabaseContext _dbContext;

    public FeedRepository(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<FeedResponseDTO> GetFeedAsync(int pageNumber, int pageSize, int? viewerUserId = null)
    {
        var items = new List<FeedItemDTO>();

        using var connection = await _dbContext.CreateOpenConnectionAsync();

        // ── Step 1: Get paged feed ────────────────────────────────
        using (var command = _dbContext.CreateStoredProcCommand("sp_GetFeed", connection))
        {
            command.Parameters.AddWithValue("@PageNumber", pageNumber);
            command.Parameters.AddWithValue("@PageSize", pageSize);
            command.Parameters.AddWithValue("@ViewerUserId", (object?)viewerUserId ?? DBNull.Value);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                items.Add(MapFeedItem(reader));
            }
        }

        // ── Step 2: Bulk-fetch media for Post-type items ──────────
        var postIds = items
            .Where(i => i.Type == "Post" && i.HasImage)
            .Select(i => i.Id)
            .ToList();

        if (postIds.Count > 0)
        {
            var postIdsCsv = string.Join(",", postIds);
            using var mediaCmd = _dbContext.CreateStoredProcCommand("sp_GetPostMedia", connection);
            mediaCmd.Parameters.AddWithValue("@PostIds", postIdsCsv);

            var mediaMap = new Dictionary<int, List<FeedMediaDTO>>();
            using var mediaReader = await mediaCmd.ExecuteReaderAsync();
            while (await mediaReader.ReadAsync())
            {
                var postId = mediaReader.GetInt32(mediaReader.GetOrdinal("PostId"));
                if (!mediaMap.ContainsKey(postId))
                    mediaMap[postId] = new List<FeedMediaDTO>();

                mediaMap[postId].Add(new FeedMediaDTO
                {
                    MediaId = mediaReader.GetInt32(mediaReader.GetOrdinal("MediaId")),
                    FilePath = mediaReader.GetString(mediaReader.GetOrdinal("FilePath")),
                    MediaType = mediaReader.GetString(mediaReader.GetOrdinal("MediaType")),
                    SortOrder = mediaReader.GetInt32(mediaReader.GetOrdinal("SortOrder")),
                });
            }

            foreach (var item in items.Where(i => i.Type == "Post"))
            {
                if (mediaMap.TryGetValue(item.Id, out var media))
                    item.MediaItems = media;
            }
        }

        return new FeedResponseDTO
        {
            Items = items,
            PageNumber = pageNumber,
            PageSize = pageSize,
            HasMore = items.Count == pageSize,
        };
    }

    public async Task<FeedResponseDTO> GetMemberFeedAsync(int memberId, int pageNumber, int pageSize, int? viewerId = null)
    {
        var items = new List<FeedItemDTO>();

        using var connection = await _dbContext.CreateOpenConnectionAsync();

        using (var command = _dbContext.CreateStoredProcCommand("sp_GetMemberFeed", connection))
        {
            command.Parameters.AddWithValue("@MemberId", memberId);
            command.Parameters.AddWithValue("@PageNumber", pageNumber);
            command.Parameters.AddWithValue("@PageSize", pageSize);
            command.Parameters.AddWithValue("@ViewerId", (object?)viewerId ?? DBNull.Value);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                items.Add(MapFeedItem(reader));
        }

        var postIds = items.Where(i => i.HasImage).Select(i => i.Id).ToList();
        if (postIds.Count > 0)
        {
            var postIdsCsv = string.Join(",", postIds);
            using var mediaCmd = _dbContext.CreateStoredProcCommand("sp_GetPostMedia", connection);
            mediaCmd.Parameters.AddWithValue("@PostIds", postIdsCsv);

            var mediaMap = new Dictionary<int, List<FeedMediaDTO>>();
            using var mediaReader = await mediaCmd.ExecuteReaderAsync();
            while (await mediaReader.ReadAsync())
            {
                var postId = mediaReader.GetInt32(mediaReader.GetOrdinal("PostId"));
                if (!mediaMap.ContainsKey(postId))
                    mediaMap[postId] = new List<FeedMediaDTO>();

                mediaMap[postId].Add(new FeedMediaDTO
                {
                    MediaId = mediaReader.GetInt32(mediaReader.GetOrdinal("MediaId")),
                    FilePath = mediaReader.GetString(mediaReader.GetOrdinal("FilePath")),
                    MediaType = mediaReader.GetString(mediaReader.GetOrdinal("MediaType")),
                    SortOrder = mediaReader.GetInt32(mediaReader.GetOrdinal("SortOrder")),
                });
            }

            foreach (var item in items)
            {
                if (mediaMap.TryGetValue(item.Id, out var media))
                    item.MediaItems = media;
            }
        }

        return new FeedResponseDTO
        {
            Items = items,
            PageNumber = pageNumber,
            PageSize = pageSize,
            HasMore = items.Count == pageSize,
        };
    }

    public async Task<int> CreatePostAsync(int memberId, string? content, DateTime? postedDate = null, int clubId = 0)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_CreatePost", connection);

        command.Parameters.AddWithValue("@MemberId", memberId);
        command.Parameters.AddWithValue("@Content", (object?)content ?? DBNull.Value);
        command.Parameters.AddWithValue("@PostedDate", (object?)(postedDate ?? DateTime.UtcNow));
        command.Parameters.AddWithValue("@ClubId", clubId);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result ?? 0);
    }

    public async Task<FeedMediaDTO> AddPostMediaAsync(int postId, string filePath, string mediaType, int sortOrder)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_AddPostMedia", connection);

        command.Parameters.AddWithValue("@PostId", postId);
        command.Parameters.AddWithValue("@FilePath", filePath);
        command.Parameters.AddWithValue("@MediaType", mediaType);
        command.Parameters.AddWithValue("@SortOrder", sortOrder);

        var result = await command.ExecuteScalarAsync();
        var mediaId = Convert.ToInt32(result ?? 0);

        return new FeedMediaDTO
        {
            MediaId = mediaId,
            FilePath = filePath,
            MediaType = mediaType,
            SortOrder = sortOrder,
        };
    }

    // ── New: delete a post + its media rows; returns the deleted file paths
    //         so the controller can remove the physical files from disk ──
    public async Task<(bool Success, List<string> DeletedFilePaths)> DeletePostAsync(int postId, int memberId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_DeletePost", connection);

        command.Parameters.AddWithValue("@PostId", postId);
        command.Parameters.AddWithValue("@MemberId", memberId);

        var filePaths = new List<string>();
        bool success = false;

        using var reader = await command.ExecuteReaderAsync();

        // First result set: file paths belonging to the post (may be empty if no media)
        while (await reader.ReadAsync())
        {
            if (!reader.IsDBNull(0))
                filePaths.Add(reader.GetString(0));
        }

        // Second result set: RowsAffected / Existed status row
        if (await reader.NextResultAsync() && await reader.ReadAsync())
        {
            success = reader.GetBoolean(reader.GetOrdinal("Existed"));
        }

        return (success, filePaths);
    }

    private static FeedItemDTO MapFeedItem(System.Data.SqlClient.SqlDataReader r) => new()
    {
        Id = r.GetInt32(r.GetOrdinal("Id")),
        Type = r.GetString(r.GetOrdinal("Type")),
        MemberId = r.IsDBNull(r.GetOrdinal("MemberId")) ? null : r.GetInt32(r.GetOrdinal("MemberId")),
        MemberName = r.IsDBNull(r.GetOrdinal("MemberName")) ? "IME Admin" : r.GetString(r.GetOrdinal("MemberName")),
        Email = r.IsDBNull(r.GetOrdinal("Email")) ? null : r.GetString(r.GetOrdinal("Email")),
        Title = r.IsDBNull(r.GetOrdinal("Title")) ? string.Empty : r.GetString(r.GetOrdinal("Title")),
        Description = r.IsDBNull(r.GetOrdinal("Description")) ? null : r.GetString(r.GetOrdinal("Description")),
        HasImage = r.GetBoolean(r.GetOrdinal("HasImage")),
        ImagePath = r.IsDBNull(r.GetOrdinal("ImagePath")) ? null : r.GetString(r.GetOrdinal("ImagePath")),
        PostedDate = r.GetDateTime(r.GetOrdinal("PostedDate")),
        // ADD THESE TWO LINES:
        ClubId = HasColumn(r, "ClubId") && !r.IsDBNull(r.GetOrdinal("ClubId")) ? r.GetInt32(r.GetOrdinal("ClubId")) : null,
        IsSameClub = HasColumn(r, "IsSameClub") && r.GetBoolean(r.GetOrdinal("IsSameClub")),
    };
    private static bool HasColumn(System.Data.SqlClient.SqlDataReader reader, string columnName)
    {
        for (int i = 0; i < reader.FieldCount; i++)
        {
            if (reader.GetName(i).Equals(columnName, StringComparison.OrdinalIgnoreCase))
                return true;
        }
        return false;
    }
}