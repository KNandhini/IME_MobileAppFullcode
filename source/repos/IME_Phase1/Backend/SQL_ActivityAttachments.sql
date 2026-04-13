-- ============================================================
-- Activity Attachments — Table + Stored Procedures
-- Run this in SSMS on your IME database
-- ============================================================

-- ── 1. tbl_Attachments table ────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tbl_Attachments]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[tbl_Attachments] (
        [AttachmentId]  INT            IDENTITY(1,1) PRIMARY KEY,
        [ModuleName]    NVARCHAR(50)   NOT NULL,
        [ReferenceId]   INT            NOT NULL,
        [FileName]      NVARCHAR(255)  NOT NULL,
        [FilePath]      NVARCHAR(500)  NOT NULL,
        [FileSize]      BIGINT         NULL,
        [FileType]      NVARCHAR(100)  NULL,
        [UploadedBy]    INT            NULL,
        [UploadedDate]  DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_Attachments_UploadedBy FOREIGN KEY ([UploadedBy]) REFERENCES [tbl_Members]([MemberId])
    );
    CREATE INDEX IX_Attachments_Module_Ref ON tbl_Attachments (ModuleName, ReferenceId);
    PRINT 'tbl_Attachments table created.';
END
ELSE
    PRINT 'tbl_Attachments table already exists.';
GO

-- ── 2. sp_AddActivityAttachment ─────────────────────────────
CREATE OR ALTER PROCEDURE sp_AddActivityAttachment
    @ActivityId  INT,
    @FileName    NVARCHAR(255),
    @FilePath    NVARCHAR(500),
    @FileSize    BIGINT,
    @FileType    NVARCHAR(100),
    @UploadedBy  INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO tbl_Attachments (ModuleName, ReferenceId, FileName, FilePath, FileSize, FileType, UploadedBy)
    VALUES ('Activities', @ActivityId, @FileName, @FilePath, @FileSize, @FileType, @UploadedBy);
    SELECT SCOPE_IDENTITY() AS AttachmentId;
END;
GO

-- ── 3. sp_GetActivityAttachments ────────────────────────────
CREATE OR ALTER PROCEDURE sp_GetActivityAttachments
    @ActivityId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        a.AttachmentId,
        a.ReferenceId  AS ActivityId,
        a.FileName,
        a.FilePath,
        a.FileSize,
        a.FileType,
        a.UploadedBy,
        a.UploadedDate,
        COALESCE(m.FullName, 'IME Admin') AS UploadedByName
    FROM tbl_Attachments a
    LEFT JOIN tbl_Members m ON m.MemberId = a.UploadedBy
    WHERE a.ModuleName = 'Activities'
      AND a.ReferenceId = @ActivityId
    ORDER BY a.UploadedDate DESC;
END;
GO

-- ── 4. sp_DeleteActivityAttachment ──────────────────────────
CREATE OR ALTER PROCEDURE sp_DeleteActivityAttachment
    @AttachmentId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT FilePath FROM tbl_Attachments
    WHERE AttachmentId = @AttachmentId AND ModuleName = 'Activities';

    DELETE FROM tbl_Attachments
    WHERE AttachmentId = @AttachmentId AND ModuleName = 'Activities';

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

-- ── Verify ───────────────────────────────────────────────────
SELECT 'tbl_Attachments ready' AS Status;
GO
