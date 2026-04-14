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

-- Insert Sample Activity
IF NOT EXISTS (SELECT * FROM Activities WHERE ActivityId = 1)
BEGIN
    INSERT INTO Activities (Title, Description, ActivityDate, Venue, Coordinator, Status, CreatedBy)
    VALUES (
        'Annual General Meeting 2024',
        'Join us for the Annual General Meeting to discuss the year''s achievements and future plans.',
        DATEADD(MONTH, 1, GETDATE()),
        'IME Head Office, Mumbai',
        'System Administrator',
        'Upcoming',
        1
    );
END
GO

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
