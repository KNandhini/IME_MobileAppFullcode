-- ============================================================
-- Add IDENTITY to tbl_Users.UserId
-- Recreates the table preserving all existing data and FKs
-- Run in SSMS on db_a85a40_ime
-- ============================================================

BEGIN TRANSACTION;
BEGIN TRY

    -- Step 1: Drop all FK constraints referencing tbl_Users
    DECLARE @dropFKs NVARCHAR(MAX) = '';
    SELECT @dropFKs += 'ALTER TABLE ' + QUOTENAME(OBJECT_NAME(parent_object_id))
                     + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';' + CHAR(10)
    FROM sys.foreign_keys
    WHERE referenced_object_id = OBJECT_ID('tbl_Users');

    IF @dropFKs <> ''
        EXEC sp_executesql @dropFKs;

    -- Step 2: Create new table with IDENTITY on UserId
    CREATE TABLE tbl_Users_New (
        UserId        INT           IDENTITY(1,1) NOT NULL,
        Email         NVARCHAR(255) NOT NULL,
        PasswordHash  NVARCHAR(500) NOT NULL,
        RoleId        INT           NOT NULL,
        IsActive      BIT           NULL DEFAULT ((1)),
        CreatedDate   DATETIME      NULL DEFAULT (GETDATE()),
        UpdatedDate   DATETIME      NULL,
        LastLoginDate DATETIME      NULL,
        CONSTRAINT PK_tbl_Users PRIMARY KEY (UserId)
    );

    -- Step 3: Copy existing rows, preserving their UserId values
    SET IDENTITY_INSERT tbl_Users_New ON;
    INSERT INTO tbl_Users_New (UserId, Email, PasswordHash, RoleId, IsActive, CreatedDate, UpdatedDate, LastLoginDate)
    SELECT UserId, Email, PasswordHash, RoleId, IsActive, CreatedDate, UpdatedDate, LastLoginDate
    FROM tbl_Users;
    SET IDENTITY_INSERT tbl_Users_New OFF;

    -- Step 4: Reseed identity so next insert continues from max existing value
    DECLARE @MaxId INT = ISNULL((SELECT MAX(UserId) FROM tbl_Users_New), 0);
    DBCC CHECKIDENT ('tbl_Users_New', RESEED, @MaxId) WITH NO_INFOMSGS;

    -- Step 5: Drop old table
    DROP TABLE tbl_Users;

    -- Step 6: Rename new table
    EXEC sp_rename 'tbl_Users_New', 'tbl_Users';

    -- Step 7: Recreate FK from tbl_Members.UserId -> tbl_Users.UserId
    IF OBJECT_ID('tbl_Members') IS NOT NULL
        ALTER TABLE tbl_Members
            ADD CONSTRAINT FK_tbl_Members_UserId
            FOREIGN KEY (UserId) REFERENCES tbl_Users(UserId);

    COMMIT TRANSACTION;
    PRINT 'SUCCESS: tbl_Users.UserId is now an IDENTITY column.';

END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'FAILED: ' + ERROR_MESSAGE();
END CATCH;
GO

-- ============================================================
-- Update sp_CreateUser to use SCOPE_IDENTITY() (no manual ID)
-- ============================================================

CREATE OR ALTER PROCEDURE sp_CreateUser
    @Email            NVARCHAR(255),
    @PasswordHash     NVARCHAR(500),
    @RoleId           INT,
    @FullName         NVARCHAR(200),
    @Address          NVARCHAR(500),
    @ContactNumber    NVARCHAR(20),
    @Gender           NVARCHAR(10),
    @Age              INT,
    @DateOfBirth      DATE,
    @Place            NVARCHAR(100),
    @DesignationId    INT,
    @ProfilePhotoPath NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM tbl_Users WHERE Email = @Email)
        BEGIN
            SELECT -1 AS UserId, -1 AS MemberId, 'Email already exists' AS Message;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- UserId is now IDENTITY — SQL Server generates it automatically
        INSERT INTO tbl_Users (Email, PasswordHash, RoleId, IsActive)
        VALUES (@Email, @PasswordHash, @RoleId, 0);

        DECLARE @NewUserId INT = SCOPE_IDENTITY();

        INSERT INTO tbl_Members (
            UserId, FullName, Address, ContactNumber, Gender, Age,
            DateOfBirth, Place, DesignationId, ProfilePhotoPath, MembershipStatus
        )
        VALUES (
            @NewUserId, @FullName, @Address, @ContactNumber, @Gender, @Age,
            @DateOfBirth, @Place, @DesignationId, @ProfilePhotoPath, 'Pending'
        );

        DECLARE @NewMemberId INT = SCOPE_IDENTITY();

        COMMIT TRANSACTION;
        SELECT @NewUserId AS UserId, @NewMemberId AS MemberId, 'Success' AS Message;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT -1 AS UserId, -1 AS MemberId, ERROR_MESSAGE() AS Message;
    END CATCH
END
GO

PRINT 'sp_CreateUser updated successfully.';
