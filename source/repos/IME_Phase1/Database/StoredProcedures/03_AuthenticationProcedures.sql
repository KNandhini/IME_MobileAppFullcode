-- Authentication Related Stored Procedures
USE [db_a85a40_ime];
GO

-- SP: User Login
CREATE OR ALTER PROCEDURE sp_UserLogin
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        u.UserId,
        u.Email,
        u.RoleId,
        r.RoleName,
        m.MemberId,
        m.FullName,
        m.ProfilePhotoPath,
        u.IsActive
    FROM Users u
    INNER JOIN Roles r ON u.RoleId = r.RoleId
    LEFT JOIN Members m ON u.UserId = m.UserId
    WHERE u.Email = @Email AND u.PasswordHash = @PasswordHash AND u.IsActive = 1;

    -- Update last login date
    IF @@ROWCOUNT > 0
    BEGIN
        UPDATE Users SET LastLoginDate = GETDATE() WHERE Email = @Email;
    END
END
GO

-- SP: Get User by Email
CREATE OR ALTER PROCEDURE sp_GetUserByEmail
    @Email NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        u.UserId,
        u.Email,
        u.PasswordHash,
        u.RoleId,
        r.RoleName,
        m.MemberId,
        m.DateOfBirth,
        u.IsActive
    FROM Users u
    INNER JOIN Roles r ON u.RoleId = r.RoleId
    LEFT JOIN Members m ON u.UserId = m.UserId
    WHERE u.Email = @Email;
END
GO

-- SP: Validate User for Password Reset
CREATE OR ALTER PROCEDURE sp_ValidateUserForPasswordReset
    @Email NVARCHAR(255),
    @DateOfBirth DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        u.UserId,
        u.Email,
        m.FullName
    FROM Users u
    INNER JOIN Members m ON u.UserId = m.UserId
    WHERE u.Email = @Email AND m.DateOfBirth = @DateOfBirth AND u.IsActive = 1;
END
GO

-- SP: Reset Password
CREATE OR ALTER PROCEDURE sp_ResetPassword
    @UserId INT,
    @NewPasswordHash NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Users
    SET PasswordHash = @NewPasswordHash,
        UpdatedDate = GETDATE()
    WHERE UserId = @UserId;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- SP: Create New User (for Signup)
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
        IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
        BEGIN
            SELECT -1 AS UserId, 'Email already exists' AS Message;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Insert User
        INSERT INTO Users (Email, PasswordHash, RoleId, IsActive)
        VALUES (@Email, @PasswordHash, @RoleId, 1);

        DECLARE @NewUserId INT = SCOPE_IDENTITY();

        -- Insert Member
        INSERT INTO Members (
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
        SELECT -1 AS UserId, ERROR_MESSAGE() AS Message;
    END CATCH
END
GO

PRINT 'Authentication procedures created successfully';
