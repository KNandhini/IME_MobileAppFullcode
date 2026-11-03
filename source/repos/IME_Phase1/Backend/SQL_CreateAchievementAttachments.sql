-- Run in SQL Server Management Studio against db_a85a40_ime.
USE [db_a85a40_ime];
GO

IF OBJECT_ID(N'dbo.tbl_Achievements', N'U') IS NULL
BEGIN
    THROW 50000, 'dbo.tbl_Achievements was not found in db_a85a40_ime. Check the database before creating achievement attachments.', 1;
END;

IF OBJECT_ID(N'dbo.tbl_AchievementAttachments', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[tbl_AchievementAttachments] (
        [AttachmentId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [AchievementId] INT NOT NULL,
        [FileName] NVARCHAR(255) NULL,
        [FilePath] NVARCHAR(500) NULL,
        [UploadedDate] DATETIME NOT NULL
            CONSTRAINT [DF_tbl_AchievementAttachments_UploadedDate] DEFAULT GETDATE(),
        CONSTRAINT [FK_tbl_AchievementAttachments_Achievements]
            FOREIGN KEY ([AchievementId])
            REFERENCES [dbo].[tbl_Achievements] ([AchievementId])
            ON DELETE CASCADE
    );
    PRINT 'dbo.tbl_AchievementAttachments created.';
END
ELSE
    PRINT 'dbo.tbl_AchievementAttachments already exists.';
GO

SELECT
    DB_NAME() AS CurrentDatabase,
    OBJECT_ID(N'dbo.tbl_AchievementAttachments', N'U') AS AchievementAttachmentsObjectId;
GO
