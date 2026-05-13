-- 08_ActivityCircularVisibility.sql
-- Run once in SSMS: adds ClubId + Visibility to Activity/Circular tables
-- and updates all related stored procedures.
USE [db_a85a40_ime];
GO

-- ══ ALTER TABLES ══════════════════════════════════════════════════════════════

-- Activities (used by CRUD SPs)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Activities') AND name='ClubId')
    ALTER TABLE Activities ADD ClubId INT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Activities') AND name='Visibility')
    ALTER TABLE Activities ADD Visibility NVARCHAR(20) NOT NULL CONSTRAINT DF_Activities_Visibility DEFAULT 'All';
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Activities') AND name='Coordinator')
    ALTER TABLE Activities ADD Coordinator NVARCHAR(200) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Activities') AND name='Status')
    ALTER TABLE Activities ADD Status NVARCHAR(50) NOT NULL CONSTRAINT DF_Activities_Status DEFAULT 'Upcoming';
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Activities') AND name='RegistrationDeadline')
    ALTER TABLE Activities ADD RegistrationDeadline DATE NULL;
GO

-- tbl_Activities (used by feed SP — add if this variant exists in your DB)
IF OBJECT_ID('tbl_Activities','U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('tbl_Activities') AND name='ClubId')
        ALTER TABLE tbl_Activities ADD ClubId INT NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('tbl_Activities') AND name='Visibility')
        ALTER TABLE tbl_Activities ADD Visibility NVARCHAR(20) NOT NULL CONSTRAINT DF_tblActivities_Visibility DEFAULT 'All';
END
GO

-- GOCircular (used by CRUD SPs)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('GOCircular') AND name='ClubId')
    ALTER TABLE GOCircular ADD ClubId INT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('GOCircular') AND name='Visibility')
    ALTER TABLE GOCircular ADD Visibility NVARCHAR(20) NOT NULL CONSTRAINT DF_GOCircular_Visibility DEFAULT 'All';
GO

-- tbl_Circular (used by feed SP — add if this variant exists in your DB)
IF OBJECT_ID('tbl_Circular','U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('tbl_Circular') AND name='ClubId')
        ALTER TABLE tbl_Circular ADD ClubId INT NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('tbl_Circular') AND name='Visibility')
        ALTER TABLE tbl_Circular ADD Visibility NVARCHAR(20) NOT NULL CONSTRAINT DF_tblCircular_Visibility DEFAULT 'All';
END
GO

-- Add ClubId to Members table (if it doesn't already exist)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Members') AND name='ClubId')
    ALTER TABLE Members ADD ClubId INT NULL;
GO

-- ══ sp_GetAllActivities ═══════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE sp_GetAllActivities
    @PageNumber INT = 1,
    @PageSize   INT = 20,
    @ClubId     INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    SELECT
        a.ActivityId, a.ActivityName, a.Description, a.ActivityDate,
        a.Venue, a.Time, a.ChiefGuest, a.Coordinator, a.Status, a.RegistrationDeadline,
        a.ClubId, a.Visibility, a.CreatedBy, a.CreatedDate,
        (SELECT COUNT(*) FROM ActivityAttachments WHERE ActivityId = a.ActivityId) AS AttachmentCount
    FROM Activities a
    WHERE @ClubId IS NULL OR a.ClubId = @ClubId
    ORDER BY a.ActivityDate DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

-- ══ sp_CreateActivity ═════════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE sp_CreateActivity
    @ActivityName         NVARCHAR(200),
    @Description          NVARCHAR(MAX)  = NULL,
    @ActivityDate         DATE           = NULL,
    @Venue                NVARCHAR(300)  = NULL,
    @Time                 NVARCHAR(50)   = NULL,
    @ChiefGuest           NVARCHAR(200)  = NULL,
    @Coordinator          NVARCHAR(200)  = NULL,
    @Status               NVARCHAR(50)   = 'Upcoming',
    @RegistrationDeadline DATE           = NULL,
    @ClubId               INT            = NULL,
    @Visibility           NVARCHAR(20)   = 'All',
    @CreatedBy            INT,
    @CreatedDate          DATETIME       = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Activities
        (ActivityName, Description, ActivityDate, Venue, Time, ChiefGuest,
         Coordinator, Status, RegistrationDeadline, ClubId, Visibility, CreatedBy, CreatedDate)
    VALUES
        (@ActivityName, @Description, @ActivityDate, @Venue, @Time, @ChiefGuest,
         @Coordinator, @Status, @RegistrationDeadline, @ClubId, @Visibility, @CreatedBy,
         COALESCE(@CreatedDate, GETDATE()));
    SELECT SCOPE_IDENTITY() AS ActivityId;
END
GO

-- ══ sp_UpdateActivity ═════════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE sp_UpdateActivity
    @ActivityId           INT,
    @ActivityName         NVARCHAR(200),
    @Description          NVARCHAR(MAX)  = NULL,
    @ActivityDate         DATE           = NULL,
    @Venue                NVARCHAR(300)  = NULL,
    @Time                 NVARCHAR(50)   = NULL,
    @ChiefGuest           NVARCHAR(200)  = NULL,
    @Coordinator          NVARCHAR(200)  = NULL,
    @Status               NVARCHAR(50)   = NULL,
    @RegistrationDeadline DATE           = NULL,
    @Visibility           NVARCHAR(20)   = NULL,
    @UpdatedDate          DATETIME       = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Activities
    SET ActivityName         = @ActivityName,
        Description          = @Description,
        ActivityDate         = @ActivityDate,
        Venue                = @Venue,
        Time                 = @Time,
        ChiefGuest           = @ChiefGuest,
        Coordinator          = ISNULL(@Coordinator, Coordinator),
        Status               = ISNULL(@Status, Status),
        RegistrationDeadline = ISNULL(@RegistrationDeadline, RegistrationDeadline),
        Visibility           = ISNULL(@Visibility, Visibility),
        UpdatedDate          = COALESCE(@UpdatedDate, GETDATE())
    WHERE ActivityId = @ActivityId;
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ══ sp_GetAllCirculars ════════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE sp_GetAllCirculars
    @ClubId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        c.CircularId, c.Title, c.Description, c.CircularNumber, c.PublishDate,
        c.ClubId, c.Visibility, c.CreatedDate,
        (SELECT COUNT(*) FROM GOCircularAttachments WHERE CircularId = c.CircularId) AS AttachmentCount
    FROM GOCircular c
    WHERE @ClubId IS NULL OR c.ClubId = @ClubId
    ORDER BY c.PublishDate DESC;
END
GO

-- ══ sp_CreateCircular ═════════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE sp_CreateCircular
    @Title          NVARCHAR(300),
    @Description    NVARCHAR(MAX)  = NULL,
    @CircularNumber NVARCHAR(100)  = NULL,
    @PublishDate    DATE,
    @ClubId         INT            = NULL,
    @Visibility     NVARCHAR(20)   = 'All',
    @CreatedBy      INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO GOCircular (Title, Description, CircularNumber, PublishDate, ClubId, Visibility, CreatedBy)
    VALUES (@Title, @Description, @CircularNumber, @PublishDate, @ClubId, @Visibility, @CreatedBy);
    SELECT SCOPE_IDENTITY() AS CircularId;
END
GO

-- ══ sp_UpdateCircular (new) ═══════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE sp_UpdateCircular
    @CircularId     INT,
    @Title          NVARCHAR(300),
    @Description    NVARCHAR(MAX)  = NULL,
    @CircularNumber NVARCHAR(100)  = NULL,
    @PublishDate    DATE,
    @Visibility     NVARCHAR(20)   = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE GOCircular
    SET Title          = @Title,
        Description    = @Description,
        CircularNumber = @CircularNumber,
        PublishDate    = @PublishDate,
        Visibility     = ISNULL(@Visibility, Visibility),
        UpdatedDate    = GETDATE()
    WHERE CircularId = @CircularId;
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ══ sp_GetCircularById (updated to return new fields) ════════════════════════
CREATE OR ALTER PROCEDURE sp_GetCircularById
    @CircularId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT c.CircularId, c.Title, c.Description, c.CircularNumber,
           c.PublishDate, c.ClubId, c.Visibility, c.CreatedDate
    FROM GOCircular c
    WHERE c.CircularId = @CircularId;

    SELECT a.AttachmentId, a.CircularId, a.FileName, a.FilePath, a.UploadedDate
    FROM GOCircularAttachments a
    WHERE a.CircularId = @CircularId;
END
GO

-- ══ sp_GetFeed (updated to support visibility filtering) ═════════════════════
-- @ViewerUserId = NULL → show all (backwards compatible)
-- @ViewerUserId set → filter Visibility='Club' items to matching club only
CREATE OR ALTER PROCEDURE sp_GetFeed
    @PageNumber   INT = 1,
    @PageSize     INT = 10,
    @ViewerUserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset      INT = (@PageNumber - 1) * @PageSize;
    DECLARE @ViewerClubId INT = NULL;

    -- Resolve viewer's club (works with both Members and tbl_Members)
    IF @ViewerUserId IS NOT NULL
    BEGIN
        IF OBJECT_ID('Members','U') IS NOT NULL
            SELECT @ViewerClubId = ClubId FROM Members WHERE UserId = @ViewerUserId;
        ELSE IF OBJECT_ID('tbl_Members','U') IS NOT NULL
            SELECT @ViewerClubId = ClubId FROM tbl_Members WHERE UserId = @ViewerUserId;
    END

    SELECT * FROM (

        -- ── Member Posts (always visible) ────────────────────────
        SELECT
            p.PostId AS Id,
            'Post'   AS [Type],
            p.MemberId,
            COALESCE(m.FullName, 'IME Member') AS MemberName,
            u.Email,
            CAST(NULL AS NVARCHAR(255))        AS Title,
            p.Content                          AS Description,
            CASE WHEN EXISTS(SELECT 1 FROM tbl_PostMedia pm WHERE pm.PostId = p.PostId)
                 THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS HasImage,
            CAST(NULL AS NVARCHAR(500))        AS ImagePath,
            p.CreatedDate                      AS PostedDate
        FROM tbl_Posts p
        LEFT JOIN tbl_Members m ON m.MemberId = p.MemberId
        LEFT JOIN tbl_Users   u ON u.UserId   = m.UserId

        UNION ALL

        -- ── Activities (visibility-filtered) ─────────────────────
        SELECT
            a.ActivityId AS Id,
            'Activity'   AS [Type],
            a.CreatedBy  AS MemberId,
            COALESCE(m.FullName, 'IME Admin') AS MemberName,
            u.Email,
            a.ActivityName AS Title,
            a.Description,
            CAST(0 AS BIT) AS HasImage,
            CAST(NULL AS NVARCHAR(500)) AS ImagePath,
            COALESCE(CAST(a.ActivityDate AS DATETIME), a.CreatedDate) AS PostedDate
        FROM Activities a
        LEFT JOIN Members m ON m.UserId = a.CreatedBy
        LEFT JOIN Users   u ON u.UserId = a.CreatedBy
        WHERE a.Visibility = 'All'
           OR (@ViewerClubId IS NOT NULL AND a.Visibility = 'Club' AND a.ClubId = @ViewerClubId)

        UNION ALL

        -- ── News (always visible) ─────────────────────────────────
        SELECT
            n.NewsId  AS Id,
            'News'    AS [Type],
            n.CreatedBy AS MemberId,
            COALESCE(m.FullName, 'IME Admin') AS MemberName,
            u.Email,
            n.Title,
            n.ShortDescription AS Description,
            CASE WHEN n.CoverImagePath IS NOT NULL THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS HasImage,
            n.CoverImagePath   AS ImagePath,
            CAST(n.PublishDate AS DATETIME) AS PostedDate
        FROM News n
        LEFT JOIN Members m ON m.UserId = n.CreatedBy
        LEFT JOIN Users   u ON u.UserId = n.CreatedBy

        UNION ALL

        -- ── Circulars (visibility-filtered) ──────────────────────
        SELECT
            c.CircularId AS Id,
            'Circular'   AS [Type],
            c.CreatedBy  AS MemberId,
            'IME Admin'  AS MemberName,
            CAST(NULL AS NVARCHAR(255)) AS Email,
            c.Title,
            c.Description,
            CAST(0 AS BIT) AS HasImage,
            CAST(NULL AS NVARCHAR(500)) AS ImagePath,
            CAST(c.PublishDate AS DATETIME) AS PostedDate
        FROM GOCircular c
        WHERE c.Visibility = 'All'
           OR (@ViewerClubId IS NOT NULL AND c.Visibility = 'Club' AND c.ClubId = @ViewerClubId)

    ) AS Feed
    ORDER BY Feed.PostedDate DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

-- ══ sp_UserLogin (updated to return ClubId) ═══════════════════════════════════
-- NOTE: Only run this if your sp_UserLogin does NOT already return ClubId.
-- This preserves the existing ProfilePhoto (binary) and GraceExpiryDate columns.
CREATE OR ALTER PROCEDURE sp_UserLogin
    @Email        NVARCHAR(255),
    @PasswordHash NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        u.UserId, u.Email, u.RoleId, r.RoleName,
        m.MemberId, m.FullName, m.ProfilePhoto,
        m.ClubId,
        u.IsActive,
        m.MembershipStatus,
        m.GraceExpiryDate,
        CASE
            WHEN m.GraceExpiryDate IS NOT NULL AND m.GraceExpiryDate < GETDATE() THEN 'GRACE_EXPIRED'
            WHEN m.MembershipStatus = 'Active'  THEN 'Active'
            WHEN m.MembershipStatus = 'Pending' THEN 'Pending'
            ELSE m.MembershipStatus
        END AS LoginStatus
    FROM Users u
    INNER JOIN Roles r ON u.RoleId = r.RoleId
    LEFT JOIN Members m ON u.UserId = m.UserId
    WHERE u.Email = @Email AND u.PasswordHash = @PasswordHash AND u.IsActive = 1;

    IF @@ROWCOUNT > 0
        UPDATE Users SET LastLoginDate = GETDATE() WHERE Email = @Email;
END
GO
