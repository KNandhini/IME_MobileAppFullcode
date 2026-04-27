namespace IME.Core.Models;

public class ChatConversation
{
    public int       ConversationId   { get; set; }
    public int       Member1Id        { get; set; }
    public int       Member2Id        { get; set; }
    public string?   Member1Name      { get; set; }
    public string?   Member2Name      { get; set; }
    public string?   Member1Email     { get; set; }
    public string?   Member2Email     { get; set; }
    public DateTime  CreatedDate      { get; set; }
    public DateTime? LastMessageDate  { get; set; }
}

public class ChatMessage
{
    public int      MessageId      { get; set; }
    public int      ConversationId { get; set; }
    public int      SenderId       { get; set; }
    public string?  SenderName     { get; set; }
    public string   MessageText    { get; set; } = string.Empty;
    public DateTime SentDate       { get; set; }
    public bool     IsRead         { get; set; }
}
