using IME.Core.DTOs;
namespace IME.Core.Interfaces;
public interface IFeedRepository
{
    Task<FeedResponseDTO> GetFeedAsync(int pageNumber, int pageSize, int? viewerUserId = null);
    Task<FeedResponseDTO> GetMemberFeedAsync(int memberId, int pageNumber, int pageSize, int? viewerId = null);
    Task<int> CreatePostAsync(int memberId, string? content, DateTime? postedDate = null, int clubId = 0);
    Task<FeedMediaDTO> AddPostMediaAsync(int postId, string filePath, string mediaType, int sortOrder);

    // ?? New: delete a post (and its media) owned by memberId ??
    Task<(bool Success, List<string> DeletedFilePaths)> DeletePostAsync(int postId, int memberId);
    Task<LikeToggleResultDTO> ToggleLikeAsync(string itemType, int itemId, int memberId);
    Task<PostCommentDTO> AddCommentAsync(string itemType, int itemId, int memberId, string commentDetails);
    Task<List<PostCommentDTO>> GetPostCommentsAsync(string itemType, int itemId);

}