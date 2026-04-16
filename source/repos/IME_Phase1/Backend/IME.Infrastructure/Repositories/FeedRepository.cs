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

    public async Task<FeedResponseDTO> GetFeedAsync(int pageNumber, int pageSize)
    {
        var items = new List<FeedItemDTO>();

        using var connection = await _dbContext.CreateOpenConnectionAsync();

        // ── Step 1: Get paged feed ────────────────────────────────
        using (var command = _dbContext.CreateStoredProcCommand("sp_GetFeed", connection))
        {
            command.Parameters.AddWithValue("@PageNumber", pageNumber);
            command.Parameters.AddWithValue("@PageSize",   pageSize);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                items.Add(new FeedItemDTO
                {
                    Id          = reader.GetInt32(reader.GetOrdinal("Id")),
                    Type        = reader.GetString(reader.GetOrdinal("Type")),
                    MemberName  = reader.IsDBNull(reader.GetOrdinal("MemberName"))  ? "IME Admin" : reader.GetString(reader.GetOrdinal("MemberName")),
                    Title       = reader.IsDBNull(reader.GetOrdinal("Title"))       ? string.Empty : reader.GetString(reader.GetOrdinal("Title")),
                    Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                    HasImage    = reader.GetBoolean(reader.GetOrdinal("HasImage")),
                    ImagePath   = reader.IsDBNull(reader.GetOrdinal("ImagePath"))   ? null : reader.GetString(reader.GetOrdinal("ImagePath")),
                    PostedDate  = reader.GetDateTime(reader.GetOrdinal("PostedDate")),
                });
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
                    MediaId   = mediaReader.GetInt32(mediaReader.GetOrdinal("MediaId")),
                    FilePath  = mediaReader.GetString(mediaReader.GetOrdinal("FilePath")),
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
            Items      = items,
            PageNumber = pageNumber,
            PageSize   = pageSize,
            HasMore    = items.Count == pageSize,
        };
    }

    public async Task<int> CreatePostAsync(int memberId, string? content, DateTime? postedDate = null)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command    = _dbContext.CreateStoredProcCommand("sp_CreatePost", connection);

        command.Parameters.AddWithValue("@MemberId",   memberId);
        command.Parameters.AddWithValue("@Content",    (object?)content ?? DBNull.Value);
        command.Parameters.AddWithValue("@PostedDate", (object?)(postedDate ?? DateTime.UtcNow));

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result ?? 0);
    }

    public async Task<FeedMediaDTO> AddPostMediaAsync(int postId, string filePath, string mediaType, int sortOrder)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command    = _dbContext.CreateStoredProcCommand("sp_AddPostMedia", connection);

        command.Parameters.AddWithValue("@PostId",    postId);
        command.Parameters.AddWithValue("@FilePath",  filePath);
        command.Parameters.AddWithValue("@MediaType", mediaType);
        command.Parameters.AddWithValue("@SortOrder", sortOrder);

        var result  = await command.ExecuteScalarAsync();
        var mediaId = Convert.ToInt32(result ?? 0);

        return new FeedMediaDTO
        {
            MediaId   = mediaId,
            FilePath  = filePath,
            MediaType = mediaType,
            SortOrder = sortOrder,
        };
    }
}
