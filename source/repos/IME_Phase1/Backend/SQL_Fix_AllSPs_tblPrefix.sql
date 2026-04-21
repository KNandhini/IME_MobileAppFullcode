-- ============================================================
-- Fix all 4 SPs: replace bare table names with tbl_ prefix
-- Run this in SSMS on the IME live database (db_a85a40_ime)
-- ============================================================

-- 1. sp_CreateUser
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
        IF EXISTS (SELECT 1 FROM tbl_Users WHERE Email = @Email)
        BEGIN
            SELECT -1 AS UserId, -1 AS MemberId, 'Email already exists' AS Message;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- tbl_Users.UserId is NOT an IDENTITY column, so generate it manually
        DECLARE @NewUserId INT = ISNULL((SELECT MAX(UserId) FROM tbl_Users WITH (UPDLOCK, HOLDLOCK)), 0) + 1;

        INSERT INTO tbl_Users (UserId, Email, PasswordHash, RoleId, IsActive)
        VALUES (@NewUserId, @Email, @PasswordHash, @RoleId, 0);

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

-- 2. sp_CreateMembershipFee
CREATE OR ALTER PROCEDURE sp_CreateMembershipFee
    @Amount DECIMAL(10,2),
    @EffectiveFrom DATE,
    @CreatedBy INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        UPDATE tbl_MembershipFee
        SET IsActive = 0,
            EffectiveTo = @EffectiveFrom
        WHERE IsActive = 1;

        INSERT INTO tbl_MembershipFee (Amount, IsActive, EffectiveFrom, CreatedBy)
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

-- 3. sp_CreateMembershipPayment
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
    INSERT INTO tbl_MembershipPayment (MemberId, FeeId, Amount, PaymentMode, TransactionReference, Status)
    VALUES (@MemberId, @FeeId, @Amount, @PaymentMode, @TransactionReference, @Status);
    SELECT SCOPE_IDENTITY() AS PaymentId;
END
GO

-- 4. sp_CompleteRegistrationPayment
CREATE OR ALTER PROCEDURE sp_CompleteRegistrationPayment
    @MemberId INT,
    @UserId INT,
    @FeeId INT,
    @Amount DECIMAL(10,2),
    @PaymentMode NVARCHAR(50),
    @TransactionReference NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO tbl_MembershipPayment (MemberId, FeeId, Amount, PaymentMode, TransactionReference, Status)
        VALUES (@MemberId, @FeeId, @Amount, @PaymentMode, @TransactionReference, 'Success');

        UPDATE tbl_Members
        SET MembershipStatus = 'Active',
            UpdatedDate      = GETDATE()
        WHERE MemberId = @MemberId;

        UPDATE tbl_Users
        SET IsActive    = 1,
            UpdatedDate = GETDATE()
        WHERE UserId = @UserId;

        COMMIT TRANSACTION;

        SELECT u.Email, m.FullName, '' AS ErrorMessage
        FROM tbl_Users u
        JOIN tbl_Members m ON m.UserId = u.UserId
        WHERE u.UserId = @UserId;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT '' AS Email, '' AS FullName, ERROR_MESSAGE() AS ErrorMessage;
    END CATCH
END
GO

PRINT 'All 4 stored procedures updated successfully.';
