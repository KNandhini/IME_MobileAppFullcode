-- IME Database - Seed Data
-- Initial data setup for testing

USE IME_DB;
GO

-- Insert Roles
IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'Admin')
BEGIN
    INSERT INTO Roles (RoleName) VALUES ('Admin');
END
GO

IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'Member')
BEGIN
    INSERT INTO Roles (RoleName) VALUES ('Member');
END
GO

-- Insert Default Admin User
-- Password: Admin@123 (hashed with BCrypt)
IF NOT EXISTS (SELECT * FROM Members WHERE Email = 'admin@ime.org')
BEGIN
    INSERT INTO Members (Email, PasswordHash, FullName, PhoneNumber, RoleId, Status)
    VALUES (
        'admin@ime.org',
        '$2a$11$vK8qVJ5yl6jxH3R7zN8qG.T8DfzH7pC1RBxKlqYm7kF9Wj6nH7Zfy', -- Admin@123
        'System Administrator',
        '9876543210',
        1, -- Admin Role
        'Approved'
    );
END
GO

-- Insert Test Member
-- Password: Member@123 (hashed with BCrypt)
IF NOT EXISTS (SELECT * FROM Members WHERE Email = 'member@ime.org')
BEGIN
    INSERT INTO Members (Email, PasswordHash, FullName, PhoneNumber, RoleId, Status)
    VALUES (
        'member@ime.org',
        '$2a$11$XJk7vL6mN9pQ2rS3tU4vW.Y8EfA9hD2sCvE8xF9gH1jK2mL3nO4pQ', -- Member@123
        'Test Member',
        '9876543211',
        2, -- Member Role
        'Approved'
    );
END
GO

-- Insert Support Categories
IF NOT EXISTS (SELECT * FROM SupportCategories WHERE CategoryId = 1)
BEGIN
    INSERT INTO SupportCategories (CategoryName) VALUES 
    ('Technical'),
    ('Legal'),
    ('Health'),
    ('Financial'),
    ('Higher Education');
END
GO

-- Insert Content Pages
IF NOT EXISTS (SELECT * FROM ContentPages WHERE PageKey = 'about')
BEGIN
    INSERT INTO ContentPages (PageKey, PageTitle, Content)
    VALUES (
        'about',
        'About Institution',
        '<h1>About IME</h1><p>The Institution of Municipal Engineering (IME) is a professional body dedicated to advancing the practice of municipal engineering...</p>'
    );
END
GO

IF NOT EXISTS (SELECT * FROM ContentPages WHERE PageKey = 'history')
BEGIN
    INSERT INTO ContentPages (PageKey, PageTitle, Content)
    VALUES (
        'history',
        'Our History',
        '<h1>History of IME</h1><p>Founded in 1950, the Institution of Municipal Engineering has been serving municipal engineers for over 70 years...</p>'
    );
END
GO

-- Insert Current Year Annual Fee
DECLARE @CurrentYear INT = YEAR(GETDATE());
IF NOT EXISTS (SELECT * FROM AnnualFee WHERE Year = @CurrentYear)
BEGIN
    INSERT INTO AnnualFee (Year, FeeAmount, CreatedBy)
    VALUES (@CurrentYear, 5000.00, 1); -- Default fee: ₹5000
END
GO
select * from tbl_Activities
-- Insert Sample Activity
IF NOT EXISTS (SELECT * FROM tbl_Activities WHERE ActivityId = 1)
BEGIN
    INSERT INTO tbl_Activities (ActivityName, Description, ActivityDate, Venue, ChiefGuest, Status, CreatedBy)
    VALUES (
        'Annual General Meeting 2024',
        'Join us for the Annual General Meeting to discuss the year''s achievements and future plans.',
        DATEADD(MONTH, 1, GETDATE()),
        'IME Head Office, Mumbai',
        'Sakthi, IME Head Officer',
        'Upcoming',
        1
    );
END
GO
select * from tbl_MembershipFee
-- Insert Sample News
IF NOT EXISTS (SELECT * FROM News WHERE NewsId = 1)
BEGIN
    INSERT INTO News (Title, Content, ShortDescription, Category, Author, CreatedBy)
    VALUES (
        'Welcome to IME Mobile App',
        'We are excited to announce the launch of the new IME Mobile App. This app brings all IME services to your fingertips.',
        'New mobile app launched for IME members',
        'Announcement',
        'Admin Team',
        1
    );
END
GO

PRINT 'Seed data inserted successfully!';
PRINT 'Default Admin: admin@ime.org / Admin@123';
PRINT 'Default Member: member@ime.org / Member@123';
GO


CREATE OR ALTER PROCEDURE sp_GetCurrentMembershipFee
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 * FROM tbl_MembershipFee
    WHERE IsActive = 1 AND EffectiveFrom <= CAST(GETDATE() AS DATE)
    ORDER BY EffectiveFrom DESC;
END


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
            SELECT -1 AS UserId, 'Email already exists' AS Message;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Inactive until payment completed
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
        SELECT -1 AS UserId, ERROR_MESSAGE() AS Message;
    END CATCH
END
GO


CREATE OR ALTER PROCEDURE sp_GetCurrentMembershipFee
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 * FROM tbl_MembershipFee
    WHERE IsActive = 1 AND EffectiveFrom <= CAST(GETDATE() AS DATE)
    ORDER BY EffectiveFrom DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_GetLatestMembershipFee
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 FeeId, Amount, EffectiveFrom, IsActive
    FROM tbl_MembershipFee
    WHERE IsActive = 1
    ORDER BY EffectiveFrom DESC;
END
GO

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

        UPDATE Members SET tbl_MembershipStatus = 'Active' WHERE MemberId = @MemberId;
        UPDATE Users SET IsActive = 1 WHERE UserId = @UserId;

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