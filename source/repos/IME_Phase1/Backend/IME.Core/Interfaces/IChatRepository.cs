using IME.Core.DTOs;
using IME.Core.Models;

namespace IME.Core.Interfaces;

public interface IChatRepository
{
    Task<ChatConversation?> GetOrCreateConversationAsync(int myMemberId, int otherMemberId);
    Task<List<ChatMessage>> GetConversationMessagesAsync(int conversationId, int pageNumber, int pageSize);
    Task<(int MessageId, DateTime SentDate)> SendMessageAsync(int conversationId, int senderId, string text);
    Task<List<ConversationDTO>> GetUserConversationsAsync(int memberId);
}
