-- Module Management Stored Procedures (Activities, News, Media, etc.)
USE [db_a85a40_ime];
GO

-- =============================================
-- ACTIVITIES PROCEDURES
-- =============================================

CREATE OR ALTER PROCEDURE sp_GetAllActivities
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    SELECT
        a.ActivityId,
        a.ActivityName,
        a.Description,
        a.ActivityDate,
        a.Venue,
        a.Time,
        a.ChiefGuest,
        a.CreatedDate,
        (SELECT COUNT(*) FROM ActivityAttachments WHERE ActivityId = a.ActivityId) AS AttachmentCount
    FROM Activities a
    ORDER BY a.ActivityDate DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE sp_GetActivityById
    @ActivityId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM Activities WHERE ActivityId = @ActivityId;

    SELECT * FROM ActivityAttachments WHERE ActivityId = @ActivityId;
END
GO

CREATE OR ALTER PROCEDURE sp_CreateActivity
    @ActivityName NVARCHAR(200),
    @Description NVARCHAR(MAX),
    @ActivityDate DATE,
    @Venue NVARCHAR(300),
    @Time NVARCHAR(50),
    @ChiefGuest NVARCHAR(200),
    @CreatedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Activities (ActivityName, Description, ActivityDate, Venue, Time, ChiefGuest, CreatedBy)
    VALUES (@ActivityName, @Description, @ActivityDate, @Venue, @Time, @ChiefGuest, @CreatedBy);

    SELECT SCOPE_IDENTITY() AS ActivityId;
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateActivity
    @ActivityId INT,
    @ActivityName NVARCHAR(200),
    @Description NVARCHAR(MAX),
    @ActivityDate DATE,
    @Venue NVARCHAR(300),
    @Time NVARCHAR(50),
    @ChiefGuest NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Activities
    SET ActivityName = @ActivityName,
        Description = @Description,
        ActivityDate = @ActivityDate,
        Venue = @Venue,
        Time = @Time,
        ChiefGuest = @ChiefGuest,
        UpdatedDate = GETDATE()
    WHERE ActivityId = @ActivityId;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

CREATE OR ALTER PROCEDURE sp_DeleteActivity
    @ActivityId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM Activities WHERE ActivityId = @ActivityId;
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- =============================================
-- NEWS PROCEDURES
-- =============================================

CREATE OR ALTER PROCEDURE sp_GetAllNews
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    SELECT
        n.NewsId,
        n.Title,
        n.ShortDescription,
        n.CoverImagePath,
        n.PublishDate,
        (SELECT COUNT(*) FROM NewsAttachments WHERE NewsId = n.NewsId) AS AttachmentCount
    FROM News n
    ORDER BY n.PublishDate DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE sp_GetNewsById
    @NewsId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM News WHERE NewsId = @NewsId;
    SELECT * FROM NewsAttachments WHERE NewsId = @NewsId;
END
GO

CREATE OR ALTER PROCEDURE sp_CreateNews
    @Title NVARCHAR(300),
    @ShortDescription NVARCHAR(500),
    @FullContent NVARCHAR(MAX),
    @CoverImagePath NVARCHAR(500),
    @CreatedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO News (Title, ShortDescription, FullContent, CoverImagePath, CreatedBy)
    VALUES (@Title, @ShortDescription, @FullContent, @CoverImagePath, @CreatedBy);

    SELECT SCOPE_IDENTITY() AS NewsId;
END
GO

-- =============================================
-- MEDIA PROCEDURES
-- =============================================

CREATE OR ALTER PROCEDURE sp_GetAllMedia
    @MediaType NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        m.MediaId,
        m.Title,
        m.MediaType,
        m.Description,
        m.FilePath,
        m.ThumbnailPath,
        m.EventDate,
        m.CreatedDate
    FROM Media m
    WHERE (@MediaType IS NULL OR m.MediaType = @MediaType)
    ORDER BY m.EventDate DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_CreateMedia
    @Title NVARCHAR(200),
    @MediaType NVARCHAR(50),
    @Description NVARCHAR(500),
    @FilePath NVARCHAR(500),
    @ThumbnailPath NVARCHAR(500),
    @EventDate DATE,
    @CreatedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Media (Title, MediaType, Description, FilePath, ThumbnailPath, EventDate, CreatedBy)
    VALUES (@Title, @MediaType, @Description, @FilePath, @ThumbnailPath, @EventDate, @CreatedBy);

    SELECT SCOPE_IDENTITY() AS MediaId;
END
GO

-- =============================================
-- PODCASTS PROCEDURES
-- =============================================

CREATE OR ALTER PROCEDURE sp_GetAllPodcasts
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM Podcasts ORDER BY PublishDate DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_CreatePodcast
    @Title NVARCHAR(200),
    @Speaker NVARCHAR(200),
    @Description NVARCHAR(MAX),
    @MediaFilePath NVARCHAR(500),
    @MediaLink NVARCHAR(500),
    @Duration NVARCHAR(50),
    @CreatedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Podcasts (Title, Speaker, Description, MediaFilePath, MediaLink, Duration, CreatedBy)
    VALUES (@Title, @Speaker, @Description, @MediaFilePath, @MediaLink, @Duration, @CreatedBy);

    SELECT SCOPE_IDENTITY() AS PodcastId;
END
GO

-- =============================================
-- SUPPORT PROCEDURES
-- =============================================

CREATE OR ALTER PROCEDURE sp_GetSupportByCategory
    @CategoryId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.SupportId,
        s.PhotoPath,
        s.PersonName,
        s.Title,
        s.Description,
        s.SupportDate,
        s.CompanyOrIndividual,
        sc.CategoryName,
        s.CreatedDate
    FROM SupportEntries s
    INNER JOIN SupportCategory sc ON s.CategoryId = sc.CategoryId
    WHERE s.CategoryId = @CategoryId
    ORDER BY s.SupportDate DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_GetSupportById
    @SupportId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM SupportEntries WHERE SupportId = @SupportId;
    SELECT * FROM SupportAttachments WHERE SupportId = @SupportId;
END
GO

CREATE OR ALTER PROCEDURE sp_CreateSupport
    @CategoryId INT,
    @PhotoPath NVARCHAR(500),
    @PersonName NVARCHAR(200),
    @Title NVARCHAR(200),
    @Description NVARCHAR(MAX),
    @SupportDate DATE,
    @CompanyOrIndividual NVARCHAR(200),
    @CreatedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO SupportEntries (CategoryId, PhotoPath, PersonName, Title, Description, SupportDate, CompanyOrIndividual, CreatedBy)
    VALUES (@CategoryId, @PhotoPath, @PersonName, @Title, @Description, @SupportDate, @CompanyOrIndividual, @CreatedBy);

    SELECT SCOPE_IDENTITY() AS SupportId;
END
GO

-- =============================================
-- GO & CIRCULAR PROCEDURES
-- =============================================

CREATE OR ALTER PROCEDURE sp_GetAllCirculars
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.CircularId,
        c.Title,
        c.Description,
        c.CircularNumber,
        c.PublishDate,
        (SELECT COUNT(*) FROM GOCircularAttachments WHERE CircularId = c.CircularId) AS AttachmentCount
    FROM GOCircular c
    ORDER BY c.PublishDate DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_CreateCircular
    @Title NVARCHAR(300),
    @Description NVARCHAR(MAX),
    @CircularNumber NVARCHAR(100),
    @PublishDate DATE,
    @CreatedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO GOCircular (Title, Description, CircularNumber, PublishDate, CreatedBy)
    VALUES (@Title, @Description, @CircularNumber, @PublishDate, @CreatedBy);

    SELECT SCOPE_IDENTITY() AS CircularId;
END
GO

-- =============================================
-- ACHIEVEMENTS PROCEDURES
-- =============================================

CREATE OR ALTER PROCEDURE sp_GetAllAchievements
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM Achievements ORDER BY AchievementDate DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_CreateAchievement
    @MemberName NVARCHAR(200),
    @PhotoPath NVARCHAR(500),
    @Title NVARCHAR(300),
    @Description NVARCHAR(MAX),
    @AchievementDate DATE,
    @CreatedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Achievements (MemberName, PhotoPath, Title, Description, AchievementDate, CreatedBy)
    VALUES (@MemberName, @PhotoPath, @Title, @Description, @AchievementDate, @CreatedBy);

    SELECT SCOPE_IDENTITY() AS AchievementId;
END
GO

-- =============================================
-- STATIC CONTENT PROCEDURES
-- =============================================

CREATE OR ALTER PROCEDURE sp_GetContentByKey
    @PageKey NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM StaticContentPages WHERE PageKey = @PageKey;
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateContent
    @PageKey NVARCHAR(100),
    @PageTitle NVARCHAR(200),
    @Content NVARCHAR(MAX),
    @UpdatedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE StaticContentPages
    SET PageTitle = @PageTitle,
        Content = @Content,
        UpdatedDate = GETDATE(),
        CreatedBy = @UpdatedBy
    WHERE PageKey = @PageKey;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- =============================================
-- DESIGNATION PROCEDURES
-- =============================================

CREATE OR ALTER PROCEDURE sp_GetAllDesignations
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM Designation WHERE IsActive = 1 ORDER BY DesignationName;
END
GO

CREATE OR ALTER PROCEDURE sp_CreateDesignation
    @DesignationName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM Designation WHERE DesignationName = @DesignationName)
    BEGIN
        SELECT -1 AS DesignationId, 'Designation already exists' AS Message;
        RETURN;
    END

    INSERT INTO Designation (DesignationName, IsActive)
    VALUES (@DesignationName, 1);

    SELECT SCOPE_IDENTITY() AS DesignationId, 'Success' AS Message;
END
GO

PRINT 'Module procedures created successfully';
