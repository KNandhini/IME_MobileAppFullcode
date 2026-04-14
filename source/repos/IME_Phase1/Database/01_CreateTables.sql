-- IME Database Schema - Phase 1
-- Database: IME_DB

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'IME_DB')
BEGIN
    CREATE DATABASE IME_DB;
END
GO

USE IME_DB;
GO

-- =============================================
-- TABLES
-- =============================================

-- Roles Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Roles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Roles] (
        [RoleId] INT IDENTITY(1,1) PRIMARY KEY,
        [RoleName] NVARCHAR(50) NOT NULL UNIQUE,
        [CreatedDate] DATETIME DEFAULT GETDATE()
    );
END
GO

-- Members Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Members]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Members] (
        [MemberId] INT IDENTITY(1,1) PRIMARY KEY,
        [Email] NVARCHAR(255) NOT NULL UNIQUE,
        [PasswordHash] NVARCHAR(MAX) NOT NULL,
        [FullName] NVARCHAR(255) NOT NULL,
        [PhoneNumber] NVARCHAR(20),
        [Address] NVARCHAR(500),
        [City] NVARCHAR(100),
        [State] NVARCHAR(100),
        [Pincode] NVARCHAR(10),
        [Designation] NVARCHAR(100),
        [Department] NVARCHAR(100),
        [PhotoPath] NVARCHAR(500),
        [RoleId] INT NOT NULL DEFAULT 2,
        [Status] NVARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Rejected
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        [ModifiedDate] DATETIME DEFAULT GETDATE(),
        [IsActive] BIT DEFAULT 1,
        FOREIGN KEY ([RoleId]) REFERENCES [Roles]([RoleId])
    );
END
GO

-- Activities Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Activities]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Activities] (
        [ActivityId] INT IDENTITY(1,1) PRIMARY KEY,
        [Title] NVARCHAR(255) NOT NULL,
        [Description] NVARCHAR(MAX),
        [ActivityDate] DATETIME NOT NULL,
        [Venue] NVARCHAR(255),
        [Coordinator] NVARCHAR(100),
        [BannerImage] NVARCHAR(500),
        [RegistrationDeadline] DATETIME,
        [Status] NVARCHAR(20) DEFAULT 'Upcoming', -- Upcoming, Ongoing, Completed, Cancelled
        [CreatedBy] INT,
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        [ModifiedDate] DATETIME DEFAULT GETDATE(),
        [IsActive] BIT DEFAULT 1,
        FOREIGN KEY ([CreatedBy]) REFERENCES [Members]([MemberId])
    );
END
GO

-- Activity Registrations Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ActivityRegistrations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ActivityRegistrations] (
        [RegistrationId] INT IDENTITY(1,1) PRIMARY KEY,
        [ActivityId] INT NOT NULL,
        [MemberId] INT NOT NULL,
        [RegistrationDate] DATETIME DEFAULT GETDATE(),
        [Status] NVARCHAR(20) DEFAULT 'Confirmed', -- Confirmed, Cancelled
        [IsActive] BIT DEFAULT 1,
        FOREIGN KEY ([ActivityId]) REFERENCES [Activities]([ActivityId]),
        FOREIGN KEY ([MemberId]) REFERENCES [Members]([MemberId])
    );
END
GO

-- News Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[News]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[News] (
        [NewsId] INT IDENTITY(1,1) PRIMARY KEY,
        [Title] NVARCHAR(255) NOT NULL,
        [Content] NVARCHAR(MAX),
        [ShortDescription] NVARCHAR(500),
        [CoverImagePath] NVARCHAR(500),
        [Category] NVARCHAR(100),
        [Author] NVARCHAR(100),
        [PublishDate] DATETIME DEFAULT GETDATE(),
        [ExternalLink] NVARCHAR(500),
        [Tags] NVARCHAR(500),
        [CreatedBy] INT,
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        [IsActive] BIT DEFAULT 1,
        FOREIGN KEY ([CreatedBy]) REFERENCES [Members]([MemberId])
    );
END
GO

-- Media Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Media]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Media] (
        [MediaId] INT IDENTITY(1,1) PRIMARY KEY,
        [Title] NVARCHAR(255),
        [Description] NVARCHAR(MAX),
        [MediaType] NVARCHAR(20), -- Photo, Video
        [ThumbnailPath] NVARCHAR(500),
        [AlbumName] NVARCHAR(100),
        [UploadDate] DATETIME DEFAULT GETDATE(),
        [ExternalLink] NVARCHAR(500),
        [Tags] NVARCHAR(500),
        [CreatedBy] INT,
        [IsActive] BIT DEFAULT 1,
        FOREIGN KEY ([CreatedBy]) REFERENCES [Members]([MemberId])
    );
END
GO

-- Podcasts Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Podcasts]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Podcasts] (
        [PodcastId] INT IDENTITY(1,1) PRIMARY KEY,
        [Title] NVARCHAR(255) NOT NULL,
        [Description] NVARCHAR(MAX),
        [Speaker] NVARCHAR(100),
        [Category] NVARCHAR(100),
        [Duration] INT, -- in seconds
        [CoverImage] NVARCHAR(500),
        [PublishDate] DATETIME DEFAULT GETDATE(),
        [ExternalLink] NVARCHAR(500),
        [Tags] NVARCHAR(500),
        [CreatedBy] INT,
        [IsActive] BIT DEFAULT 1,
        FOREIGN KEY ([CreatedBy]) REFERENCES [Members]([MemberId])
    );
END
GO

-- Support Categories Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SupportCategories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SupportCategories] (
        [CategoryId] INT IDENTITY(1,1) PRIMARY KEY,
        [CategoryName] NVARCHAR(100) NOT NULL UNIQUE
    );
END
GO

-- Support Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Support]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Support] (
        [SupportId] INT IDENTITY(1,1) PRIMARY KEY,
        [CategoryId] INT NOT NULL,
        [Title] NVARCHAR(255) NOT NULL,
        [Description] NVARCHAR(MAX),
        [PersonName] NVARCHAR(100),
        [CompanyOrIndividual] NVARCHAR(255),
        [PhotoPath] NVARCHAR(500),
        [ContactInfo] NVARCHAR(255),
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        [IsActive] BIT DEFAULT 1,
        FOREIGN KEY ([CategoryId]) REFERENCES [SupportCategories]([CategoryId])
    );
END
GO

-- Circulars Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Circulars]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Circulars] (
        [CircularId] INT IDENTITY(1,1) PRIMARY KEY,
        [CircularNumber] NVARCHAR(50),
        [Title] NVARCHAR(255) NOT NULL,
        [Description] NVARCHAR(MAX),
        [PublishDate] DATETIME DEFAULT GETDATE(),
        [CreatedBy] INT,
        [IsActive] BIT DEFAULT 1,
        FOREIGN KEY ([CreatedBy]) REFERENCES [Members]([MemberId])
    );
END
GO

-- Achievements Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Achievements]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Achievements] (
        [AchievementId] INT IDENTITY(1,1) PRIMARY KEY,
        [MemberName] NVARCHAR(255) NOT NULL,
        [Title] NVARCHAR(255) NOT NULL,
        [Description] NVARCHAR(MAX),
        [AchievementDate] DATETIME,
        [PhotoPath] NVARCHAR(500),
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        [IsActive] BIT DEFAULT 1
    );
END
GO

-- Organisation Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Organisation]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Organisation] (
        [OrgMemberId] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(255) NOT NULL,
        [Position] NVARCHAR(100) NOT NULL,
        [Designation] NVARCHAR(100),
        [PhotoPath] NVARCHAR(500),
        [DisplayOrder] INT DEFAULT 0,
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        [IsActive] BIT DEFAULT 1
    );
END
GO

-- Payments Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Payments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Payments] (
        [PaymentId] INT IDENTITY(1,1) PRIMARY KEY,
        [MemberId] INT NOT NULL,
        [Amount] DECIMAL(10,2) NOT NULL,
        [Year] INT NOT NULL,
        [PaymentMethod] NVARCHAR(50), -- Razorpay, UPI_QR
        [TransactionId] NVARCHAR(255),
        [Status] NVARCHAR(20) DEFAULT 'Pending', -- Pending, Success, Failed
        [PaymentDate] DATETIME DEFAULT GETDATE(),
        [Description] NVARCHAR(500),
        FOREIGN KEY ([MemberId]) REFERENCES [Members]([MemberId])
    );
END
GO

-- Annual Fee Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AnnualFee]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[AnnualFee] (
        [FeeId] INT IDENTITY(1,1) PRIMARY KEY,
        [Year] INT NOT NULL UNIQUE,
        [FeeAmount] DECIMAL(10,2) NOT NULL,
        [EffectiveDate] DATETIME DEFAULT GETDATE(),
        [CreatedBy] INT,
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        FOREIGN KEY ([CreatedBy]) REFERENCES [Members]([MemberId])
    );
END
GO

-- Notifications Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Notifications]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Notifications] (
        [NotificationId] INT IDENTITY(1,1) PRIMARY KEY,
        [UserId] INT,
        [Title] NVARCHAR(255) NOT NULL,
        [Message] NVARCHAR(MAX) NOT NULL,
        [Type] NVARCHAR(50), -- Activity, News, Payment, etc.
        [ReferenceId] INT,
        [IsRead] BIT DEFAULT 0,
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        FOREIGN KEY ([UserId]) REFERENCES [Members]([MemberId])
    );
END
GO

-- Content Pages Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ContentPages]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ContentPages] (
        [PageId] INT IDENTITY(1,1) PRIMARY KEY,
        [PageKey] NVARCHAR(50) NOT NULL UNIQUE, -- about, history, etc.
        [PageTitle] NVARCHAR(255) NOT NULL,
        [Content] NVARCHAR(MAX),
        [ModifiedBy] INT,
        [ModifiedDate] DATETIME DEFAULT GETDATE(),
        FOREIGN KEY ([ModifiedBy]) REFERENCES [Members]([MemberId])
    );
END
GO

-- Attachments Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Attachments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Attachments] (
        [AttachmentId] INT IDENTITY(1,1) PRIMARY KEY,
        [ModuleName] NVARCHAR(50) NOT NULL, -- Activity, News, etc.
        [RecordId] INT NOT NULL,
        [FileName] NVARCHAR(255) NOT NULL,
        [FilePath] NVARCHAR(500) NOT NULL,
        [FileType] NVARCHAR(100),
        [FileSize] BIGINT,
        [UploadedBy] INT,
        [UploadedDate] DATETIME DEFAULT GETDATE(),
        FOREIGN KEY ([UploadedBy]) REFERENCES [Members]([MemberId])
    );
END
GO

PRINT 'All tables created successfully!';
GO
