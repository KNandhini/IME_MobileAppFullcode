using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using System.Security.Claims;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatRepository _chatRepository;

    public ChatController(IChatRepository chatRepository)
    {
        _chatRepository = chatRepository;
    }

    // ── GET /api/chat/conversations ───────────────────────────
    [HttpGet("conversations")]
    public async Task<ActionResult<ApiResponse<List<ConversationDTO>>>> GetConversations()
    {
        try
        {
            var memberId = GetCurrentMemberId();
            if (memberId <= 0)
                return Ok(new ApiResponse<List<ConversationDTO>> { Success = false, Message = "Member not found in token." });

            var list = await _chatRepository.GetUserConversationsAsync(memberId);
            return Ok(new ApiResponse<List<ConversationDTO>> { Success = true, Data = list });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<ConversationDTO>> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── GET /api/chat/conversation/{otherMemberId} ────────────
    [HttpGet("conversation/{otherMemberId:int}")]
    public async Task<ActionResult<ApiResponse<object>>> GetOrCreateConversation(int otherMemberId)
    {
        try
        {
            var memberId = GetCurrentMemberId();
            if (memberId <= 0)
                return Ok(new ApiResponse<object> { Success = false, Message = "Member not found in token." });

            var conv = await _chatRepository.GetOrCreateConversationAsync(memberId, otherMemberId);
            if (conv == null)
                return NotFound(new ApiResponse<object> { Success = false, Message = "Could not create conversation." });

            var otherName  = conv.Member1Id == memberId ? conv.Member2Name  : conv.Member1Name;
            var otherEmail = conv.Member1Id == memberId ? conv.Member2Email : conv.Member1Email;

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Data = new
                {
                    conv.ConversationId,
                    OtherMemberId   = otherMemberId,
                    OtherMemberName = otherName,
                    OtherMemberEmail= otherEmail,
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── GET /api/chat/conversation/{conversationId}/messages ──
    [HttpGet("conversation/{conversationId:int}/messages")]
    public async Task<ActionResult<ApiResponse<List<ChatMessageDTO>>>> GetMessages(
        int conversationId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize   = 50)
    {
        try
        {
            var memberId = GetCurrentMemberId();
            if (memberId <= 0)
                return Ok(new ApiResponse<List<ChatMessageDTO>> { Success = false, Message = "Member not found in token." });

            var messages = await _chatRepository.GetConversationMessagesAsync(conversationId, pageNumber, pageSize);
            var dtos = messages.Select(m => new ChatMessageDTO
            {
                MessageId      = m.MessageId,
                ConversationId = m.ConversationId,
                SenderId       = m.SenderId,
                SenderName     = m.SenderName,
                MessageText    = m.MessageText,
                SentDate       = m.SentDate,
                IsRead         = m.IsRead,
                IsOwn          = m.SenderId == memberId,
            }).ToList();

            return Ok(new ApiResponse<List<ChatMessageDTO>> { Success = true, Data = dtos });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<ChatMessageDTO>> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ── POST /api/chat/conversation/{conversationId}/messages ─
    [HttpPost("conversation/{conversationId:int}/messages")]
    public async Task<ActionResult<ApiResponse<object>>> SendMessage(
        int conversationId,
        [FromBody] SendMessageDTO request)
    {
        try
        {
            var memberId = GetCurrentMemberId();
            if (memberId <= 0)
                return Ok(new ApiResponse<object> { Success = false, Message = "Member not found in token." });

            if (string.IsNullOrWhiteSpace(request.MessageText))
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Message cannot be empty." });

            var (messageId, sentDate) = await _chatRepository.SendMessageAsync(conversationId, memberId, request.MessageText);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Data    = new { MessageId = messageId, SentDate = sentDate }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    private int GetCurrentMemberId()
    {
        var claim = User.FindFirst("MemberId")?.Value
                 ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }
}
