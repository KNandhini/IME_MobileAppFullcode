using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Data;

namespace IME.Infrastructure.Repositories;

public class ChatRepository : IChatRepository
{
    private readonly DatabaseContext _dbContext;

    public ChatRepository(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ChatConversation?> GetOrCreateConversationAsync(int myMemberId, int otherMemberId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command    = _dbContext.CreateStoredProcCommand("sp_GetOrCreateConversation", connection);

        command.Parameters.AddWithValue("@MyMemberId",    myMemberId);
        command.Parameters.AddWithValue("@OtherMemberId", otherMemberId);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new ChatConversation
            {
                ConversationId  = reader.GetInt32(reader.GetOrdinal("ConversationId")),
                Member1Id       = reader.GetInt32(reader.GetOrdinal("Member1Id")),
                Member2Id       = reader.GetInt32(reader.GetOrdinal("Member2Id")),
                Member1Name     = reader.IsDBNull(reader.GetOrdinal("Member1Name"))  ? null : reader.GetString(reader.GetOrdinal("Member1Name")),
                Member2Name     = reader.IsDBNull(reader.GetOrdinal("Member2Name"))  ? null : reader.GetString(reader.GetOrdinal("Member2Name")),
                Member1Email    = reader.IsDBNull(reader.GetOrdinal("Member1Email")) ? null : reader.GetString(reader.GetOrdinal("Member1Email")),
                Member2Email    = reader.IsDBNull(reader.GetOrdinal("Member2Email")) ? null : reader.GetString(reader.GetOrdinal("Member2Email")),
                LastMessageDate = reader.IsDBNull(reader.GetOrdinal("LastMessageDate")) ? null : reader.GetDateTime(reader.GetOrdinal("LastMessageDate")),
            };
        }
        return null;
    }

    public async Task<List<ChatMessage>> GetConversationMessagesAsync(int conversationId, int pageNumber, int pageSize)
    {
        var messages = new List<ChatMessage>();

        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command    = _dbContext.CreateStoredProcCommand("sp_GetConversationMessages", connection);

        command.Parameters.AddWithValue("@ConversationId", conversationId);
        command.Parameters.AddWithValue("@PageNumber",     pageNumber);
        command.Parameters.AddWithValue("@PageSize",       pageSize);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            messages.Add(new ChatMessage
            {
                MessageId      = reader.GetInt32(reader.GetOrdinal("MessageId")),
                ConversationId = reader.GetInt32(reader.GetOrdinal("ConversationId")),
                SenderId       = reader.GetInt32(reader.GetOrdinal("SenderId")),
                SenderName     = reader.IsDBNull(reader.GetOrdinal("SenderName")) ? null : reader.GetString(reader.GetOrdinal("SenderName")),
                MessageText    = reader.GetString(reader.GetOrdinal("MessageText")),
                SentDate       = reader.GetDateTime(reader.GetOrdinal("SentDate")),
                IsRead         = reader.GetBoolean(reader.GetOrdinal("IsRead")),
            });
        }

        return messages;
    }

    public async Task<(int MessageId, DateTime SentDate)> SendMessageAsync(int conversationId, int senderId, string text)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command    = _dbContext.CreateStoredProcCommand("sp_SendChatMessage", connection);

        command.Parameters.AddWithValue("@ConversationId", conversationId);
        command.Parameters.AddWithValue("@SenderId",       senderId);
        command.Parameters.AddWithValue("@MessageText",    text);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return (
                reader.GetInt32(reader.GetOrdinal("MessageId")),
                reader.GetDateTime(reader.GetOrdinal("SentDate"))
            );
        }

        return (0, DateTime.UtcNow);
    }

    public async Task<List<ConversationDTO>> GetUserConversationsAsync(int memberId)
    {
        var list = new List<ConversationDTO>();

        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command    = _dbContext.CreateStoredProcCommand("sp_GetUserConversations", connection);
        command.Parameters.AddWithValue("@MemberId", memberId);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new ConversationDTO
            {
                ConversationId   = reader.GetInt32(reader.GetOrdinal("ConversationId")),
                OtherMemberId    = reader.GetInt32(reader.GetOrdinal("OtherMemberId")),
                OtherMemberName  = reader.IsDBNull(reader.GetOrdinal("OtherMemberName"))  ? string.Empty : reader.GetString(reader.GetOrdinal("OtherMemberName")),
                OtherMemberEmail = reader.IsDBNull(reader.GetOrdinal("OtherMemberEmail")) ? null          : reader.GetString(reader.GetOrdinal("OtherMemberEmail")),
                LastMessageDate  = reader.IsDBNull(reader.GetOrdinal("LastMessageDate"))  ? null          : reader.GetDateTime(reader.GetOrdinal("LastMessageDate")),
                LastMessage      = reader.IsDBNull(reader.GetOrdinal("LastMessage"))      ? null          : reader.GetString(reader.GetOrdinal("LastMessage")),
            });
        }

        return list;
    }
}
