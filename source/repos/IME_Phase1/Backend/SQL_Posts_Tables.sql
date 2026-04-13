-- ============================================================
-- Run this in SSMS on your IME database
-- 1. Creates tbl_Posts + tbl_PostMedia tables
-- 2. SPs: sp_CreatePost, sp_AddPostMedia, sp_GetPostMedia
-- 3. Updates sp_GetFeed to include Posts
-- ============================================================

-- ── 1. tbl_Posts table ─────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tbl_Posts]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[tbl_Posts] (
        [PostId]      INT           IDENTITY(1,1) PRIMARY KEY,
        [MemberId]    INT           NOT NULL,
        [Content]     NVARCHAR(MAX) NULL,
        [CreatedDate] DATETIME      NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_Posts_Member FOREIGN KEY ([MemberId]) REFERENCES [tbl_Members]([MemberId])
    );
    PRINT 'tbl_Posts table created.';
END
ELSE
    PRINT 'tbl_Posts table already exists.';
GO

-- ── 2. tbl_PostMedia table ─────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tbl_PostMedia]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[tbl_PostMedia] (
        [MediaId]    INT            IDENTITY(1,1) PRIMARY KEY,
        [PostId]     INT            NOT NULL,
        [FilePath]   NVARCHAR(500)  NOT NULL,
        [MediaType]  NVARCHAR(20)   NOT NULL DEFAULT 'image',  -- 'image' | 'video'
        [SortOrder]  INT            NOT NULL DEFAULT 1,
        CONSTRAINT FK_PostMedia_Post FOREIGN KEY ([PostId]) REFERENCES [tbl_Posts]([PostId]) ON DELETE CASCADE
    );
    PRINT 'tbl_PostMedia table created.';
END
ELSE
    PRINT 'tbl_PostMedia table already exists.';
GO

-- ── 3. sp_CreatePost ───────────────────────────────────────
CREATE OR ALTER PROCEDURE sp_CreatePost
    @MemberId INT,
    @Content  NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO tbl_Posts (MemberId, Content)
    VALUES (@MemberId, @Content);
    SELECT SCOPE_IDENTITY() AS PostId;
END;
GO

-- ── 4. sp_AddPostMedia ─────────────────────────────────────
CREATE OR ALTER PROCEDURE sp_AddPostMedia
    @PostId    INT,
    @FilePath  NVARCHAR(500),
    @MediaType NVARCHAR(20),
    @SortOrder INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO tbl_PostMedia (PostId, FilePath, MediaType, SortOrder)
    VALUES (@PostId, @FilePath, @MediaType, @SortOrder);
    SELECT SCOPE_IDENTITY() AS MediaId;
END;
GO

-- ── 5. sp_GetPostMedia ─────────────────────────────────────
CREATE OR ALTER PROCEDURE sp_GetPostMedia
    @PostIds NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    CREATE TABLE #PostIdList (PostId INT);
    INSERT INTO #PostIdList (PostId)
    SELECT CAST(value AS INT)
    FROM STRING_SPLIT(@PostIds, ',')
    WHERE LTRIM(RTRIM(value)) <> '';

    SELECT
        pm.MediaId,
        pm.PostId,
        pm.FilePath,
        pm.MediaType,
        pm.SortOrder
    FROM tbl_PostMedia pm
    INNER JOIN #PostIdList t ON t.PostId = pm.PostId
    ORDER BY pm.PostId, pm.SortOrder;

    DROP TABLE #PostIdList;
END;
GO

-- ── 6. sp_GetFeed (includes Posts) ────────────────────────
CREATE OR ALTER PROCEDURE sp_GetFeed
    @PageNumber INT = 1,
    @PageSize   INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    SELECT * FROM (

        -- Member-created posts
        SELECT
            p.PostId                                           AS Id,
            'Post'                                             AS [Type],
            COALESCE(m.FullName, 'IME Member')                AS MemberName,
            CAST(NULL AS NVARCHAR(255))                       AS Title,
            p.Content                                         AS Description,
            CASE WHEN EXISTS(SELECT 1 FROM tbl_PostMedia pm WHERE pm.PostId = p.PostId)
                 THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS HasImage,
            CAST(NULL AS NVARCHAR(500))                       AS ImagePath,
            p.CreatedDate                                     AS PostedDate
        FROM tbl_Posts p
        LEFT JOIN tbl_Members m ON m.MemberId = p.MemberId

        UNION ALL

        -- Activities
        SELECT
            a.ActivityId                                       AS Id,
            'Activity'                                         AS [Type],
            COALESCE(m.FullName, 'IME Admin')                 AS MemberName,
            a.ActivityName                                     AS Title,
            a.Description                                     AS Description,
            CAST(0 AS BIT)                                     AS HasImage,
            CAST(NULL AS NVARCHAR(500))                       AS ImagePath,
            COALESCE(a.ActivityDate, a.CreatedDate)           AS PostedDate
        FROM tbl_Activities a
        LEFT JOIN tbl_Members m ON m.MemberId = a.CreatedBy

        UNION ALL

        -- News
        SELECT
            n.NewsId                                           AS Id,
            'News'                                             AS [Type],
            COALESCE(m.FullName, 'IME Admin')                 AS MemberName,
            n.Title                                            AS Title,
            n.ShortDescription                                 AS Description,
            CASE WHEN n.CoverImagePath IS NOT NULL
                 THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS HasImage,
            n.CoverImagePath                                   AS ImagePath,
            n.PublishDate                                      AS PostedDate
        FROM tbl_News n
        LEFT JOIN tbl_Members m ON m.MemberId = n.CreatedBy

        UNION ALL

        -- Circulars
        SELECT
            c.CircularId                                       AS Id,
            'Circular'                                         AS [Type],
            'IME Admin'                                        AS MemberName,
            c.Title                                            AS Title,
            c.Description                                      AS Description,
            CAST(0 AS BIT)                                     AS HasImage,
            CAST(NULL AS NVARCHAR(500))                       AS ImagePath,
            c.PublishDate                                      AS PostedDate
        FROM tbl_Circular c

    ) AS Feed
    ORDER BY Feed.PostedDate DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;

END;
GO
