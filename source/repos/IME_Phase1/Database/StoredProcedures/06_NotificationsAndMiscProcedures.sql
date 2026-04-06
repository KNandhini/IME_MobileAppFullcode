-- Notifications, Roles, and Payment Procedures
USE [db_a85a40_ime];
GO

-- =============================================
-- NOTIFICATION PROCEDURES
-- =============================================

CREATE OR ALTER PROCEDURE sp_CreateNotification
    @Title NVARCHAR(200),
    @Message NVARCHAR(500),
    @ModuleName NVARCHAR(50),
    @ReferenceId INT,
    @UserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Notifications (Title, Message, ModuleName, ReferenceId, UserId)
    VALUES (@Title, @Message, @ModuleName, @ReferenceId, @UserId);

    SELECT SCOPE_IDENTITY() AS NotificationId;
END
GO

CREATE OR ALTER PROCEDURE sp_GetUserNotifications
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM Notifications
    WHERE UserId = @UserId OR UserId IS NULL
    ORDER BY SentDate DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_MarkNotificationAsRead
    @NotificationId INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Notifications
    SET IsRead = 1
    WHERE NotificationId = @NotificationId AND (UserId = @UserId OR UserId IS NULL);

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

CREATE OR ALTER PROCEDURE sp_GetUnreadNotificationCount
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(*) AS UnreadCount
    FROM Notifications
    WHERE (UserId = @UserId OR UserId IS NULL) AND IsRead = 0;
END
GO

-- =============================================
-- ROLE PROCEDURES
-- =============================================

CREATE OR ALTER PROCEDURE sp_GetAllRoles
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM Roles ORDER BY RoleName;
END
GO

CREATE OR ALTER PROCEDURE sp_CreateRole
    @RoleName NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM Roles WHERE RoleName = @RoleName)
    BEGIN
        SELECT -1 AS RoleId, 'Role already exists' AS Message;
        RETURN;
    END

    INSERT INTO Roles (RoleName, IsActive)
    VALUES (@RoleName, 1);

    SELECT SCOPE_IDENTITY() AS RoleId, 'Success' AS Message;
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateRole
    @RoleId INT,
    @RoleName NVARCHAR(50),
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Roles
    SET RoleName = @RoleName,
        IsActive = @IsActive,
        UpdatedDate = GETDATE()
    WHERE RoleId = @RoleId;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateUserRole
    @UserId INT,
    @RoleId INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Users
    SET RoleId = @RoleId,
        UpdatedDate = GETDATE()
    WHERE UserId = @UserId;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- =============================================
-- MEMBERSHIP FEE PROCEDURES
-- =============================================

CREATE OR ALTER PROCEDURE sp_GetCurrentMembershipFee
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 * FROM MembershipFee
    WHERE IsActive = 1 AND EffectiveFrom <= CAST(GETDATE() AS DATE)
    ORDER BY EffectiveFrom DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_CreateMembershipFee
    @Amount DECIMAL(10,2),
    @EffectiveFrom DATE,
    @CreatedBy INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- Deactivate previous fees
        UPDATE MembershipFee
        SET IsActive = 0,
            EffectiveTo = @EffectiveFrom
        WHERE IsActive = 1;

        -- Insert new fee
        INSERT INTO MembershipFee (Amount, IsActive, EffectiveFrom, CreatedBy)
        VALUES (@Amount, 1, @EffectiveFrom, @CreatedBy);

        COMMIT TRANSACTION;
        SELECT SCOPE_IDENTITY() AS FeeId, 'Success' AS Message;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT -1 AS FeeId, ERROR_MESSAGE() AS Message;
    END CATCH
END
GO

-- =============================================
-- PAYMENT PROCEDURES
-- =============================================

CREATE OR ALTER PROCEDURE sp_CreateMembershipPayment
    @MemberId INT,
    @FeeId INT,
    @Amount DECIMAL(10,2),
    @PaymentMode NVARCHAR(50),
    @TransactionReference NVARCHAR(200),
    @Status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO MembershipPayment (MemberId, FeeId, Amount, PaymentMode, TransactionReference, Status)
    VALUES (@MemberId, @FeeId, @Amount, @PaymentMode, @TransactionReference, @Status);

    SELECT SCOPE_IDENTITY() AS PaymentId;
END
GO

CREATE OR ALTER PROCEDURE sp_GetAllPayments
    @PageNumber INT = 1,
    @PageSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    SELECT
        mp.PaymentId,
        m.FullName AS MemberName,
        d.DesignationName,
        mp.Amount,
        mp.PaymentDate,
        mp.PaymentMode,
        mp.TransactionReference,
        mp.Status
    FROM MembershipPayment mp
    INNER JOIN Members m ON mp.MemberId = m.MemberId
    LEFT JOIN Designation d ON m.DesignationId = d.DesignationId
    ORDER BY mp.PaymentDate DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

    -- Total count
    SELECT COUNT(*) AS TotalCount FROM MembershipPayment;
END
GO

-- =============================================
-- ORGANISATION PROCEDURES
-- =============================================

CREATE OR ALTER PROCEDURE sp_GetAllOrganisationMembers
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM OrganisationMembers
    WHERE IsActive = 1
    ORDER BY DisplayOrder, Name;
END
GO

CREATE OR ALTER PROCEDURE sp_CreateOrganisationMember
    @Name NVARCHAR(200),
    @PhotoPath NVARCHAR(500),
    @Designation NVARCHAR(100),
    @Position NVARCHAR(100),
    @DisplayOrder INT,
    @CreatedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO OrganisationMembers (Name, PhotoPath, Designation, Position, DisplayOrder, CreatedBy)
    VALUES (@Name, @PhotoPath, @Designation, @Position, @DisplayOrder, @CreatedBy);

    SELECT SCOPE_IDENTITY() AS OrgMemberId;
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateOrganisationMember
    @OrgMemberId INT,
    @Name NVARCHAR(200),
    @PhotoPath NVARCHAR(500),
    @Designation NVARCHAR(100),
    @Position NVARCHAR(100),
    @DisplayOrder INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE OrganisationMembers
    SET Name = @Name,
        PhotoPath = ISNULL(@PhotoPath, PhotoPath),
        Designation = @Designation,
        Position = @Position,
        DisplayOrder = @DisplayOrder,
        UpdatedDate = GETDATE()
    WHERE OrgMemberId = @OrgMemberId;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

CREATE OR ALTER PROCEDURE sp_DeleteOrganisationMember
    @OrgMemberId INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE OrganisationMembers
    SET IsActive = 0,
        UpdatedDate = GETDATE()
    WHERE OrgMemberId = @OrgMemberId;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- =============================================
-- ATTACHMENT PROCEDURES
-- =============================================

CREATE OR ALTER PROCEDURE sp_AddAttachment
    @TableName NVARCHAR(50),
    @ReferenceId INT,
    @FileName NVARCHAR(255),
    @FilePath NVARCHAR(500),
    @FileSize BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @TableName = 'Activities'
        INSERT INTO ActivityAttachments (ActivityId, FileName, FilePath, FileSize)
        VALUES (@ReferenceId, @FileName, @FilePath, @FileSize);
    ELSE IF @TableName = 'News'
        INSERT INTO NewsAttachments (NewsId, FileName, FilePath)
        VALUES (@ReferenceId, @FileName, @FilePath);
    ELSE IF @TableName = 'Media'
        INSERT INTO MediaAttachments (MediaId, FilePath, FileType)
        VALUES (@ReferenceId, @FilePath, SUBSTRING(@FileName, LEN(@FileName) - 3, 4));
    ELSE IF @TableName = 'Podcasts'
        INSERT INTO PodcastAttachments (PodcastId, FileName, FilePath)
        VALUES (@ReferenceId, @FileName, @FilePath);
    ELSE IF @TableName = 'Support'
        INSERT INTO SupportAttachments (SupportId, FileName, FilePath)
        VALUES (@ReferenceId, @FileName, @FilePath);
    ELSE IF @TableName = 'GOCircular'
        INSERT INTO GOCircularAttachments (CircularId, FileName, FilePath)
        VALUES (@ReferenceId, @FileName, @FilePath);
    ELSE IF @TableName = 'Achievements'
        INSERT INTO AchievementAttachments (AchievementId, FileName, FilePath)
        VALUES (@ReferenceId, @FileName, @FilePath);

    SELECT SCOPE_IDENTITY() AS AttachmentId;
END
GO

-- =============================================
-- AUDIT LOG PROCEDURE
-- =============================================

CREATE OR ALTER PROCEDURE sp_CreateAuditLog
    @UserId INT,
    @Action NVARCHAR(200),
    @TableName NVARCHAR(100),
    @RecordId INT,
    @OldValue NVARCHAR(MAX) = NULL,
    @NewValue NVARCHAR(MAX) = NULL,
    @IPAddress NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO AuditLog (UserId, Action, TableName, RecordId, OldValue, NewValue, IPAddress)
    VALUES (@UserId, @Action, @TableName, @RecordId, @OldValue, @NewValue, @IPAddress);

    SELECT SCOPE_IDENTITY() AS LogId;
END
GO

PRINT 'Notifications and misc procedures created successfully';
