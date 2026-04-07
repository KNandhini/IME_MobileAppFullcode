-- ============================================================
-- Run this script in SSMS on your IME database
-- ============================================================

-- *** IMMEDIATE FIX: Activate any member whose payment is done but account is still inactive ***
-- Run this first if you already paid and can't login.
-- Replace 'your@email.com' with the registered email.
/*
UPDATE u
SET u.IsActive = 1, u.UpdatedDate = GETDATE()
FROM Users u
WHERE u.Email = 'your@email.com';

UPDATE m
SET m.MembershipStatus = 'Active', m.UpdatedDate = GETDATE()
FROM Members m
INNER JOIN Users u ON u.UserId = m.UserId
WHERE u.Email = 'your@email.com';
*/
-- ============================================================

-- 1. Add ProfilePhoto BLOB column to Members table
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Members' AND COLUMN_NAME = 'ProfilePhoto'
)
BEGIN
    ALTER TABLE Members ADD ProfilePhoto VARBINARY(MAX) NULL;
    PRINT 'ProfilePhoto column added to Members.';
END
ELSE
    PRINT 'ProfilePhoto column already exists.';
GO

-- 2. SP: Store profile photo as BLOB (called by upload-profile-photo endpoint)
CREATE OR ALTER PROCEDURE sp_UpdateMemberProfilePhoto
    @MemberId    INT,
    @ProfilePhoto VARBINARY(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Members
    SET ProfilePhoto    = @ProfilePhoto,
        ProfilePhotoPath = NULL,        -- clear old file path
        UpdatedDate      = GETDATE()
    WHERE MemberId = @MemberId;
END;
GO

-- 3. SP: Login — must return ProfilePhoto blob alongside existing columns
--    Recreate sp_UserLogin adding ProfilePhoto to the SELECT.
--    Adjust the WHERE / JOIN to match your existing SP logic if different.
CREATE OR ALTER PROCEDURE sp_UserLogin
    @Email       NVARCHAR(100),
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
        m.ProfilePhoto          -- BLOB returned to backend
    FROM Users u
    LEFT JOIN Roles r ON r.RoleId = u.RoleId
    LEFT JOIN Members m ON m.UserId = u.UserId
    WHERE u.Email = @Email
      AND u.PasswordHash = @PasswordHash
      AND u.IsActive = 1;
END;
GO

-- 4. Ensure tbl_MembershipPayment exists (payment table)
--    If you previously used a table called 'MembershipPayments', uncomment and run this FIRST:
--    EXEC sp_rename 'MembershipPayments', 'tbl_MembershipPayment';
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
        CONSTRAINT FK_Payment_Member FOREIGN KEY (MemberId) REFERENCES Members(MemberId)
    );
    PRINT 'tbl_MembershipPayment created.';
END
ELSE
    PRINT 'tbl_MembershipPayment already exists.';
GO

-- 5. SP: Create membership payment — inserts into tbl_MembershipPayment
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

-- 6. SP: Complete registration payment (atomic: insert payment + activate member)
--    Adjust to match your existing sp_CompleteRegistrationPayment if it does more.
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

        -- Insert payment into tbl_MembershipPayment
        INSERT INTO tbl_MembershipPayment
            (MemberId, FeeId, Amount, PaymentMode, TransactionReference, Status)
        VALUES
            (@MemberId, @FeeId, @Amount, @PaymentMode, @TransactionReference, 'Success');

        -- Activate the member
        UPDATE Members
        SET MembershipStatus = 'Active',
            UpdatedDate      = GETDATE()
        WHERE MemberId = @MemberId;

        -- Activate the user account
        UPDATE Users
        SET IsActive    = 1,
            UpdatedDate = GETDATE()
        WHERE UserId = @UserId;

        -- Return member email and name for welcome email
        SELECT
            u.Email,
            m.FullName,
            CAST(NULL AS NVARCHAR(255)) AS ErrorMessage
        FROM Members m
        INNER JOIN Users u ON u.UserId = m.UserId
        WHERE m.MemberId = @MemberId;

        COMMIT;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        SELECT
            CAST(NULL AS NVARCHAR(100))  AS Email,
            CAST(NULL AS NVARCHAR(255))  AS FullName,
            ERROR_MESSAGE()              AS ErrorMessage;
    END CATCH;
END;
GO
