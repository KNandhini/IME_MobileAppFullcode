namespace IME.Core.DTOs;

public class ConversationDTO
{
    public int       ConversationId   { get; set; }
    public int       OtherMemberId    { get; set; }
    public string    OtherMemberName  { get; set; } = string.Empty;
    public string?   OtherMemberEmail { get; set; }
    public DateTime? LastMessageDate  { get; set; }
    public string?   LastMessage      { get; set; }
}

public class ChatMessageDTO
{
    public int      MessageId      { get; set; }
    public int      ConversationId { get; set; }
    public int      SenderId       { get; set; }
    public string?  SenderName     { get; set; }
    public string   MessageText    { get; set; } = string.Empty;
    public DateTime SentDate       { get; set; }
    public bool     IsRead         { get; set; }
    public bool     IsOwn          { get; set; }
}

public class SendMessageDTO
{
    public string MessageText { get; set; } = string.Empty;
}
