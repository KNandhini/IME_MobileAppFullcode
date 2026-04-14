-- IME Phase 1 Database Schema
-- SQL Server Tables Creation Script

USE [db_a85a40_ime];
GO

-- Roles Table
CREATE TABLE Roles (
    RoleId INT PRIMARY KEY IDENTITY(1,1),
    RoleName NVARCHAR(50) NOT NULL UNIQUE,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL
);
GO

-- Designation Table
CREATE TABLE Designation (
    DesignationId INT PRIMARY KEY IDENTITY(1,1),
    DesignationName NVARCHAR(100) NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE()
);
GO

-- Users Table
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(500) NOT NULL,
    RoleId INT NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL,
    LastLoginDate DATETIME NULL,
    FOREIGN KEY (RoleId) REFERENCES Roles(RoleId)
);
GO

-- Members Table
CREATE TABLE Members (
    MemberId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    FullName NVARCHAR(200) NOT NULL,
    Address NVARCHAR(500),
    ContactNumber NVARCHAR(20),
    Gender NVARCHAR(10),
    Age INT,
    DateOfBirth DATE NOT NULL,
    Place NVARCHAR(100),
    DesignationId INT,
    ProfilePhotoPath NVARCHAR(500),
    MembershipStatus NVARCHAR(50) DEFAULT 'Pending',
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (DesignationId) REFERENCES Designation(DesignationId)
);
GO

-- MembershipFee Table
CREATE TABLE MembershipFee (
    FeeId INT PRIMARY KEY IDENTITY(1,1),
    Amount DECIMAL(10,2) NOT NULL,
    IsActive BIT DEFAULT 1,
    EffectiveFrom DATE NOT NULL,
    EffectiveTo DATE NULL,
    CreatedBy INT,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);
GO

-- MembershipPayment Table
CREATE TABLE MembershipPayment (
    PaymentId INT PRIMARY KEY IDENTITY(1,1),
    MemberId INT NOT NULL,
    FeeId INT NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    PaymentDate DATETIME DEFAULT GETDATE(),
    PaymentMode NVARCHAR(50),
    TransactionReference NVARCHAR(200),
    Status NVARCHAR(50) DEFAULT 'Success',
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (MemberId) REFERENCES Members(MemberId),
    FOREIGN KEY (FeeId) REFERENCES MembershipFee(FeeId)
);
GO

-- Activities Table
CREATE TABLE Activities (
    ActivityId INT PRIMARY KEY IDENTITY(1,1),
    ActivityName NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    ActivityDate DATE,
    Venue NVARCHAR(300),
    Time NVARCHAR(50),
    ChiefGuest NVARCHAR(200),
    CreatedBy INT,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);
GO

-- ActivityAttachments Table
CREATE TABLE ActivityAttachments (
    AttachmentId INT PRIMARY KEY IDENTITY(1,1),
    ActivityId INT NOT NULL,
    FileName NVARCHAR(255),
    FilePath NVARCHAR(500),
    FileSize BIGINT,
    UploadedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ActivityId) REFERENCES Activities(ActivityId) ON DELETE CASCADE
);
GO

-- News Table
CREATE TABLE News (
    NewsId INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(300) NOT NULL,
    ShortDescription NVARCHAR(500),
    FullContent NVARCHAR(MAX),
    CoverImagePath NVARCHAR(500),
    PublishDate DATETIME DEFAULT GETDATE(),
    CreatedBy INT,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);
GO

-- NewsAttachments Table
CREATE TABLE NewsAttachments (
    AttachmentId INT PRIMARY KEY IDENTITY(1,1),
    NewsId INT NOT NULL,
    FileName NVARCHAR(255),
    FilePath NVARCHAR(500),
    UploadedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (NewsId) REFERENCES News(NewsId) ON DELETE CASCADE
);
GO

-- Media Table
CREATE TABLE Media (
    MediaId INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(200),
    MediaType NVARCHAR(50), -- Photo or Video
    Description NVARCHAR(500),
    FilePath NVARCHAR(500),
    ThumbnailPath NVARCHAR(500),
    EventDate DATE,
    CreatedBy INT,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);
GO

-- MediaAttachments Table (for albums)
CREATE TABLE MediaAttachments (
    AttachmentId INT PRIMARY KEY IDENTITY(1,1),
    MediaId INT NOT NULL,
    FilePath NVARCHAR(500),
    FileType NVARCHAR(50),
    UploadedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (MediaId) REFERENCES Media(MediaId) ON DELETE CASCADE
);
GO

-- Podcasts Table
CREATE TABLE Podcasts (
    PodcastId INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(200) NOT NULL,
    Speaker NVARCHAR(200),
    Description NVARCHAR(MAX),
    MediaFilePath NVARCHAR(500),
    MediaLink NVARCHAR(500),
    Duration NVARCHAR(50),
    PublishDate DATETIME DEFAULT GETDATE(),
    CreatedBy INT,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);
GO

-- PodcastAttachments Table
CREATE TABLE PodcastAttachments (
    AttachmentId INT PRIMARY KEY IDENTITY(1,1),
    PodcastId INT NOT NULL,
    FileName NVARCHAR(255),
    FilePath NVARCHAR(500),
    UploadedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (PodcastId) REFERENCES Podcasts(PodcastId) ON DELETE CASCADE
);
GO

-- Notifications Table
CREATE TABLE Notifications (
    NotificationId INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(200) NOT NULL,
    Message NVARCHAR(500),
    ModuleName NVARCHAR(50),
    ReferenceId INT,
    UserId INT NULL, -- NULL means sent to all
    IsRead BIT DEFAULT 0,
    SentDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

-- SupportCategory Table
CREATE TABLE SupportCategory (
    CategoryId INT PRIMARY KEY IDENTITY(1,1),
    CategoryName NVARCHAR(100) NOT NULL, -- Technical, Legal, Health, Financial, Higher Education
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE()
);
GO

-- SupportEntries Table
CREATE TABLE SupportEntries (
    SupportId INT PRIMARY KEY IDENTITY(1,1),
    CategoryId INT NOT NULL,
    PhotoPath NVARCHAR(500),
    PersonName NVARCHAR(200),
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    SupportDate DATE,
    CompanyOrIndividual NVARCHAR(200),
    CreatedBy INT,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL,
    FOREIGN KEY (CategoryId) REFERENCES SupportCategory(CategoryId),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);
GO

-- SupportAttachments Table
CREATE TABLE SupportAttachments (
    AttachmentId INT PRIMARY KEY IDENTITY(1,1),
    SupportId INT NOT NULL,
    FileName NVARCHAR(255),
    FilePath NVARCHAR(500),
    UploadedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (SupportId) REFERENCES SupportEntries(SupportId) ON DELETE CASCADE
);
GO

-- GOCircular Table
CREATE TABLE GOCircular (
    CircularId INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(300) NOT NULL,
    Description NVARCHAR(MAX),
    CircularNumber NVARCHAR(100),
    PublishDate DATE DEFAULT GETDATE(),
    CreatedBy INT,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);
GO

-- GOCircularAttachments Table
CREATE TABLE GOCircularAttachments (
    AttachmentId INT PRIMARY KEY IDENTITY(1,1),
    CircularId INT NOT NULL,
    FileName NVARCHAR(255),
    FilePath NVARCHAR(500),
    UploadedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CircularId) REFERENCES GOCircular(CircularId) ON DELETE CASCADE
);
GO

-- Achievements Table
CREATE TABLE Achievements (
    AchievementId INT PRIMARY KEY IDENTITY(1,1),
    MemberName NVARCHAR(200) NOT NULL,
    PhotoPath NVARCHAR(500),
    Title NVARCHAR(300) NOT NULL,
    Description NVARCHAR(MAX),
    AchievementDate DATE,
    CreatedBy INT,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);
GO

-- AchievementAttachments Table
CREATE TABLE AchievementAttachments (
    AttachmentId INT PRIMARY KEY IDENTITY(1,1),
    AchievementId INT NOT NULL,
    FileName NVARCHAR(255),
    FilePath NVARCHAR(500),
    UploadedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (AchievementId) REFERENCES Achievements(AchievementId) ON DELETE CASCADE
);
GO

-- OrganisationMembers Table
CREATE TABLE OrganisationMembers (
    OrgMemberId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(200) NOT NULL,
    PhotoPath NVARCHAR(500),
    Designation NVARCHAR(100),
    Position NVARCHAR(100),
    DisplayOrder INT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedBy INT,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);
GO

-- StaticContentPages Table
CREATE TABLE StaticContentPages (
    PageId INT PRIMARY KEY IDENTITY(1,1),
    PageKey NVARCHAR(100) NOT NULL UNIQUE, -- 'History', 'AboutInstitution'
    PageTitle NVARCHAR(200) NOT NULL,
    Content NVARCHAR(MAX),
    CreatedBy INT,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);
GO

-- AuditLog Table
CREATE TABLE AuditLog (
    LogId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT,
    Action NVARCHAR(200),
    TableName NVARCHAR(100),
    RecordId INT,
    OldValue NVARCHAR(MAX),
    NewValue NVARCHAR(MAX),
    IPAddress NVARCHAR(50),
    LogDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

PRINT 'All tables created successfully';
