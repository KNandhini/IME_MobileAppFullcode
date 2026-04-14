using IME.Core.DTOs;

namespace IME.Core.Interfaces;

public interface IFeedRepository
{
    Task<FeedResponseDTO> GetFeedAsync(int pageNumber, int pageSize);
    Task<int> CreatePostAsync(int memberId, string? content);
    Task<FeedMediaDTO> AddPostMediaAsync(int postId, string filePath, string mediaType, int sortOrder);
}
