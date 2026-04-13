-- ============================================================
-- Run this script in SSMS on your IME database
-- ============================================================

-- *** IMMEDIATE FIX: Activate any member whose payment is done but account is still inactive ***
/*
UPDATE u
SET u.IsActive = 1, u.UpdatedDate = GETDATE()
FROM tbl_Users u
WHERE u.Email = 'your@email.com';

UPDATE m
SET m.MembershipStatus = 'Active', m.UpdatedDate = GETDATE()
FROM tbl_Members m
INNER JOIN tbl_Users u ON u.UserId = m.UserId
WHERE u.Email = 'your@email.com';
*/
-- ============================================================

-- 1. Add ProfilePhoto BLOB column to tbl_Members
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'tbl_Members' AND COLUMN_NAME = 'ProfilePhoto'
)
BEGIN
    ALTER TABLE tbl_Members ADD ProfilePhoto VARBINARY(MAX) NULL;
    PRINT 'ProfilePhoto column added to tbl_Members.';
END
ELSE
    PRINT 'ProfilePhoto column already exists.';
GO

-- 2. SP: Store profile photo as BLOB
CREATE OR ALTER PROCEDURE sp_UpdateMemberProfilePhoto
    @MemberId     INT,
    @ProfilePhoto VARBINARY(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE tbl_Members
    SET ProfilePhoto     = @ProfilePhoto,
        ProfilePhotoPath = NULL,
        UpdatedDate      = GETDATE()
    WHERE MemberId = @MemberId;
END;
GO

-- 3. SP: Login
CREATE OR ALTER PROCEDURE sp_UserLogin
    @Email        NVARCHAR(100),
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        u.UserId,
        u.Email,
        u.PasswordHash,
        u.RoleId,
        u.IsActive,
        r.RoleName,
        m.MemberId,
        m.FullName,
        m.ProfilePhotoPath,
        m.ProfilePhoto
    FROM tbl_Users u
    LEFT JOIN tbl_Roles r ON r.RoleId = u.RoleId
    LEFT JOIN tbl_Members m ON m.UserId = u.UserId
    WHERE u.Email = @Email
      AND u.PasswordHash = @PasswordHash
      AND u.IsActive = 1;
END;
GO

-- 4. Ensure tbl_MembershipPayment exists
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tbl_MembershipPayment')
BEGIN
    CREATE TABLE tbl_MembershipPayment (
        PaymentId            INT           IDENTITY(1,1) PRIMARY KEY,
        MemberId             INT           NOT NULL,
        FeeId                INT           NULL,
        Amount               DECIMAL(10,2) NOT NULL,
        PaymentDate          DATETIME      NOT NULL DEFAULT GETDATE(),
        PaymentMode          NVARCHAR(50)  NULL,
        TransactionReference NVARCHAR(255) NULL,
        Status               NVARCHAR(50)  NOT NULL DEFAULT 'Pending',
        CreatedDate          DATETIME      NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_Payment_Member FOREIGN KEY (MemberId) REFERENCES tbl_Members(MemberId)
    );
    PRINT 'tbl_MembershipPayment created.';
END
ELSE
    PRINT 'tbl_MembershipPayment already exists.';
GO

-- 5. SP: Create membership payment
CREATE OR ALTER PROCEDURE sp_CreateMembershipPayment
    @MemberId             INT,
    @FeeId                INT,
    @Amount               DECIMAL(10,2),
    @PaymentMode          NVARCHAR(50),
    @TransactionReference NVARCHAR(255),
    @Status               NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO tbl_MembershipPayment
        (MemberId, FeeId, Amount, PaymentMode, TransactionReference, Status)
    VALUES
        (@MemberId, @FeeId, @Amount, @PaymentMode, @TransactionReference, @Status);
    SELECT SCOPE_IDENTITY() AS PaymentId;
END;
GO

-- 6. SP: Complete registration payment
CREATE OR ALTER PROCEDURE sp_CompleteRegistrationPayment
    @MemberId             INT,
    @UserId               INT,
    @FeeId                INT,
    @Amount               DECIMAL(10,2),
    @PaymentMode          NVARCHAR(50),
    @TransactionReference NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO tbl_MembershipPayment
            (MemberId, FeeId, Amount, PaymentMode, TransactionReference, Status)
        VALUES
            (@MemberId, @FeeId, @Amount, @PaymentMode, @TransactionReference, 'Success');

        UPDATE tbl_Members
        SET MembershipStatus = 'Active',
            UpdatedDate      = GETDATE()
        WHERE MemberId = @MemberId;

        UPDATE tbl_Users
        SET IsActive    = 1,
            UpdatedDate = GETDATE()
        WHERE UserId = @UserId;

        SELECT
            u.Email,
            m.FullName,
            CAST(NULL AS NVARCHAR(255)) AS ErrorMessage
        FROM tbl_Members m
        INNER JOIN tbl_Users u ON u.UserId = m.UserId
        WHERE m.MemberId = @MemberId;

        COMMIT;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        SELECT
            CAST(NULL AS NVARCHAR(100)) AS Email,
            CAST(NULL AS NVARCHAR(255)) AS FullName,
            ERROR_MESSAGE()             AS ErrorMessage;
    END CATCH;
END;
GO
