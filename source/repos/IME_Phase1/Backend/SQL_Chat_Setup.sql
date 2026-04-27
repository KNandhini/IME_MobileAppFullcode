-- ============================================================
-- Chat feature: tables + stored procedures
-- Run once in SSMS on your IME database
-- ============================================================

-- ── tbl_chat_conversations ──────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tbl_chat_conversations]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[tbl_chat_conversations] (
        [ConversationId]  INT      IDENTITY(1,1) PRIMARY KEY,
        [Member1Id]       INT      NOT NULL,
        [Member2Id]       INT      NOT NULL,
        [CreatedDate]     DATETIME NOT NULL DEFAULT GETDATE(),
        [LastMessageDate] DATETIME NULL,
        CONSTRAINT UQ_Conversation   UNIQUE (Member1Id, Member2Id),
        CONSTRAINT FK_Conv_Member1   FOREIGN KEY (Member1Id) REFERENCES tbl_Members(MemberId),
        CONSTRAINT FK_Conv_Member2   FOREIGN KEY (Member2Id) REFERENCES tbl_Members(MemberId)
    );
    PRINT 'tbl_chat_conversations created.';
END
ELSE
    PRINT 'tbl_chat_conversations already exists.';
GO

-- ── tbl_chat_messages ───────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tbl_chat_messages]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[tbl_chat_messages] (
        [MessageId]      INT           IDENTITY(1,1) PRIMARY KEY,
        [ConversationId] INT           NOT NULL,
        [SenderId]       INT           NOT NULL,
        [MessageText]    NVARCHAR(MAX) NOT NULL,
        [SentDate]       DATETIME      NOT NULL DEFAULT GETDATE(),
        [IsRead]         BIT           NOT NULL DEFAULT 0,
        CONSTRAINT FK_Msg_Conv   FOREIGN KEY (ConversationId) REFERENCES tbl_chat_conversations(ConversationId) ON DELETE CASCADE,
        CONSTRAINT FK_Msg_Sender FOREIGN KEY (SenderId)       REFERENCES tbl_Members(MemberId)
    );
    PRINT 'tbl_chat_messages created.';
END
ELSE
    PRINT 'tbl_chat_messages already exists.';
GO

-- ── sp_GetOrCreateConversation ──────────────────────────────
-- Given two member IDs, returns (or creates) their conversation.
-- Always stores Member1Id < Member2Id to guarantee uniqueness.
CREATE OR ALTER PROCEDURE sp_GetOrCreateConversation
    @MyMemberId    INT,
    @OtherMemberId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @M1 INT = IIF(@MyMemberId < @OtherMemberId, @MyMemberId, @OtherMemberId);
    DECLARE @M2 INT = IIF(@MyMemberId < @OtherMemberId, @OtherMemberId, @MyMemberId);

    DECLARE @ConvId INT;
    SELECT @ConvId = ConversationId
    FROM tbl_chat_conversations
    WHERE Member1Id = @M1 AND Member2Id = @M2;

    IF @ConvId IS NULL
    BEGIN
        INSERT INTO tbl_chat_conversations (Member1Id, Member2Id, CreatedDate)
        VALUES (@M1, @M2, GETDATE());
        SET @ConvId = SCOPE_IDENTITY();
    END

    SELECT
        c.ConversationId,
        c.Member1Id,
        c.Member2Id,
        m1.FullName AS Member1Name,
        m2.FullName AS Member2Name,
        u1.Email    AS Member1Email,
        u2.Email    AS Member2Email,
        c.LastMessageDate
    FROM tbl_chat_conversations c
    INNER JOIN tbl_Members m1 ON m1.MemberId = c.Member1Id
    INNER JOIN tbl_Members m2 ON m2.MemberId = c.Member2Id
    LEFT  JOIN tbl_Users   u1 ON u1.UserId   = m1.UserId
    LEFT  JOIN tbl_Users   u2 ON u2.UserId   = m2.UserId
    WHERE c.ConversationId = @ConvId;
END;
GO

-- ── sp_GetConversationMessages ──────────────────────────────
CREATE OR ALTER PROCEDURE sp_GetConversationMessages
    @ConversationId INT,
    @PageNumber     INT = 1,
    @PageSize       INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    SELECT
        msg.MessageId,
        msg.ConversationId,
        msg.SenderId,
        m.FullName  AS SenderName,
        msg.MessageText,
        msg.SentDate,
        msg.IsRead
    FROM tbl_chat_messages msg
    INNER JOIN tbl_Members m ON m.MemberId = msg.SenderId
    WHERE msg.ConversationId = @ConversationId
    ORDER BY msg.SentDate ASC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- ── sp_SendChatMessage ──────────────────────────────────────
CREATE OR ALTER PROCEDURE sp_SendChatMessage
    @ConversationId INT,
    @SenderId       INT,
    @MessageText    NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Now DATETIME = GETDATE();

    INSERT INTO tbl_chat_messages (ConversationId, SenderId, MessageText, SentDate, IsRead)
    VALUES (@ConversationId, @SenderId, @MessageText, @Now, 0);

    DECLARE @MessageId INT = SCOPE_IDENTITY();

    UPDATE tbl_chat_conversations
    SET LastMessageDate = @Now
    WHERE ConversationId = @ConversationId;

    SELECT @MessageId AS MessageId, @Now AS SentDate;
END;
GO

-- ── sp_GetUserConversations ─────────────────────────────────
CREATE OR ALTER PROCEDURE sp_GetUserConversations
    @MemberId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.ConversationId,
        IIF(c.Member1Id = @MemberId, c.Member2Id, c.Member1Id)   AS OtherMemberId,
        IIF(c.Member1Id = @MemberId, m2.FullName, m1.FullName)   AS OtherMemberName,
        IIF(c.Member1Id = @MemberId, u2.Email, u1.Email)         AS OtherMemberEmail,
        c.LastMessageDate,
        last.MessageText                                          AS LastMessage
    FROM tbl_chat_conversations c
    INNER JOIN tbl_Members m1 ON m1.MemberId = c.Member1Id
    INNER JOIN tbl_Members m2 ON m2.MemberId = c.Member2Id
    LEFT  JOIN tbl_Users   u1 ON u1.UserId   = m1.UserId
    LEFT  JOIN tbl_Users   u2 ON u2.UserId   = m2.UserId
    OUTER APPLY (
        SELECT TOP 1 MessageText
        FROM tbl_chat_messages
        WHERE ConversationId = c.ConversationId
        ORDER BY SentDate DESC
    ) last
    WHERE c.Member1Id = @MemberId OR c.Member2Id = @MemberId
    ORDER BY COALESCE(c.LastMessageDate, c.CreatedDate) DESC;
END;
GO
