-- ============================================================
-- Run this in SSMS on your IME database
-- Adds optional @CreatedDate / @UpdatedDate / @PostedDate
-- parameters to insert/update stored procedures so the mobile
-- client's local datetime is stored instead of GETDATE().
-- ============================================================

-- ── sp_CreatePost ────────────────────────────────────────────
CREATE OR ALTER PROCEDURE sp_CreatePost
    @MemberId   INT,
    @Content    NVARCHAR(MAX) = NULL,
    @PostedDate DATETIME      = NULL          -- mobile datetime; falls back to GETDATE()
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Now DATETIME = ISNULL(@PostedDate, GETDATE());

    INSERT INTO tbl_Posts (MemberId, Content, PostedDate, HasMedia)
    VALUES (@MemberId, @Content, @Now, 0);

    SELECT SCOPE_IDENTITY() AS PostId;
END;
GO

-- ── sp_CreateNews ────────────────────────────────────────────
CREATE OR ALTER PROCEDURE sp_CreateNews
    @Title            NVARCHAR(500),
    @ShortDescription NVARCHAR(1000) = NULL,
    @FullContent      NVARCHAR(MAX)  = NULL,
    @CoverImagePath   NVARCHAR(500)  = NULL,
    @CreatedBy        INT,
    @CreatedDate      DATETIME       = NULL   -- mobile datetime; falls back to GETDATE()
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Now DATETIME = ISNULL(@CreatedDate, GETDATE());

    INSERT INTO News (Title, ShortDescription, FullContent, CoverImagePath, CreatedBy, PublishDate, CreatedDate)
    VALUES (@Title, @ShortDescription, @FullContent, @CoverImagePath, @CreatedBy, @Now, @Now);

    SELECT SCOPE_IDENTITY() AS NewsId;
END;
GO

-- ── sp_CreateCircular ────────────────────────────────────────
CREATE OR ALTER PROCEDURE sp_CreateCircular
    @Title          NVARCHAR(500),
    @Description    NVARCHAR(MAX)  = NULL,
    @CircularNumber NVARCHAR(100)  = NULL,
    @PublishDate    DATETIME,
    @CreatedBy      INT,
    @CreatedDate    DATETIME       = NULL     -- mobile datetime; falls back to GETDATE()
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Now DATETIME = ISNULL(@CreatedDate, GETDATE());

    INSERT INTO GOCircular (Title, Description, CircularNumber, PublishDate, CreatedBy, CreatedDate)
    VALUES (@Title, @Description, @CircularNumber, @PublishDate, @CreatedBy, @Now);

    SELECT SCOPE_IDENTITY() AS CircularId;
END;
GO

-- ── sp_CreateActivity ────────────────────────────────────────
CREATE OR ALTER PROCEDURE sp_CreateActivity
    @ActivityName NVARCHAR(500),
    @Description  NVARCHAR(MAX)  = NULL,
    @ActivityDate DATETIME       = NULL,
    @Venue        NVARCHAR(500)  = NULL,
    @Time         NVARCHAR(100)  = NULL,
    @ChiefGuest   NVARCHAR(500)  = NULL,
    @CreatedBy    INT            = NULL,
    @CreatedDate  DATETIME       = NULL       -- mobile datetime; falls back to GETDATE()
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Now DATETIME = ISNULL(@CreatedDate, GETDATE());

    INSERT INTO Activities (ActivityName, Description, ActivityDate, Venue, Time, ChiefGuest, CreatedBy, CreatedDate)
    VALUES (@ActivityName, @Description, @ActivityDate, @Venue, @Time, @ChiefGuest, @CreatedBy, @Now);

    SELECT SCOPE_IDENTITY() AS ActivityId;
END;
GO

-- ── sp_UpdateActivity ────────────────────────────────────────
CREATE OR ALTER PROCEDURE sp_UpdateActivity
    @ActivityId   INT,
    @ActivityName NVARCHAR(500),
    @Description  NVARCHAR(MAX)  = NULL,
    @ActivityDate DATETIME       = NULL,
    @Venue        NVARCHAR(500)  = NULL,
    @Time         NVARCHAR(100)  = NULL,
    @ChiefGuest   NVARCHAR(500)  = NULL,
    @UpdatedDate  DATETIME       = NULL       -- mobile datetime; falls back to GETDATE()
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Now DATETIME = ISNULL(@UpdatedDate, GETDATE());

    UPDATE Activities SET
        ActivityName = @ActivityName,
        Description  = @Description,
        ActivityDate = @ActivityDate,
        Venue        = @Venue,
        Time         = @Time,
        ChiefGuest   = @ChiefGuest,
        UpdatedDate  = @Now
    WHERE ActivityId = @ActivityId;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO
