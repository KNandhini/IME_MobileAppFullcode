-- Fix sp_CreateUser: use tbl_Users / tbl_Members (actual table names in live DB)
-- SCOPE_IDENTITY() returns NULL when inserting through a view, so we must target the real tables.

CREATE OR ALTER PROCEDURE sp_CreateUser
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(500),
    @RoleId INT,
    @FullName NVARCHAR(200),
    @Address NVARCHAR(500),
    @ContactNumber NVARCHAR(20),
    @Gender NVARCHAR(10),
    @Age INT,
    @DateOfBirth DATE,
    @Place NVARCHAR(100),
    @DesignationId INT,
    @ProfilePhotoPath NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- Check if email already exists
        IF EXISTS (SELECT 1 FROM tbl_Users WHERE Email = @Email)
        BEGIN
            SELECT -1 AS UserId, -1 AS MemberId, 'Email already exists' AS Message;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Insert User (inactive until payment completed)
        INSERT INTO tbl_Users (Email, PasswordHash, RoleId, IsActive)
        VALUES (@Email, @PasswordHash, @RoleId, 0);

        DECLARE @NewUserId INT = SCOPE_IDENTITY();

        -- Insert Member
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
