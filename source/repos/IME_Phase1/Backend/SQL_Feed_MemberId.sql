-- ============================================================
-- Adds MemberId + Email columns to sp_GetFeed result
-- Also creates sp_GetMemberFeed for UserProfile page
-- Run once in SSMS on your IME database
-- NOTE: Email lives on tbl_Users (joined via tbl_Members.UserId)
-- ============================================================

-- ── Updated sp_GetFeed ──────────────────────────────────────
CREATE OR ALTER PROCEDURE sp_GetFeed
    @PageNumber INT = 1,
    @PageSize   INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    SELECT * FROM (

        -- Member posts
        SELECT
            p.PostId                                                    AS Id,
            'Post'                                                      AS [Type],
            p.MemberId                                                  AS MemberId,
            COALESCE(m.FullName, 'IME Member')                         AS MemberName,
            u.Email                                                     AS Email,
            CAST(NULL AS NVARCHAR(255))                                AS Title,
            p.Content                                                   AS Description,
            CASE WHEN EXISTS(SELECT 1 FROM tbl_PostMedia pm WHERE pm.PostId = p.PostId)
                 THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END          AS HasImage,
            CAST(NULL AS NVARCHAR(500))                                AS ImagePath,
            p.CreatedDate                                               AS PostedDate
        FROM tbl_Posts p
        LEFT JOIN tbl_Members m ON m.MemberId = p.MemberId
        LEFT JOIN tbl_Users   u ON u.UserId   = m.UserId

        UNION ALL

        -- Activities
        SELECT
            a.ActivityId                                               AS Id,
            'Activity'                                                 AS [Type],
            a.CreatedBy                                                AS MemberId,
            COALESCE(m.FullName, 'IME Admin')                        AS MemberName,
            u.Email                                                    AS Email,
            a.ActivityName                                             AS Title,
            a.Description                                              AS Description,
            CAST(0 AS BIT)                                             AS HasImage,
            CAST(NULL AS NVARCHAR(500))                               AS ImagePath,
            COALESCE(a.ActivityDate, a.CreatedDate)                   AS PostedDate
        FROM tbl_Activities a
        LEFT JOIN tbl_Members m ON m.MemberId = a.CreatedBy
        LEFT JOIN tbl_Users   u ON u.UserId   = m.UserId

        UNION ALL

        -- News
        SELECT
            n.NewsId                                                   AS Id,
            'News'                                                     AS [Type],
            n.CreatedBy                                                AS MemberId,
            COALESCE(m.FullName, 'IME Admin')                        AS MemberName,
            u.Email                                                    AS Email,
            n.Title                                                    AS Title,
            n.ShortDescription                                         AS Description,
            CASE WHEN n.CoverImagePath IS NOT NULL
                 THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END         AS HasImage,
            n.CoverImagePath                                           AS ImagePath,
            n.PublishDate                                              AS PostedDate
        FROM tbl_News n
        LEFT JOIN tbl_Members m ON m.MemberId = n.CreatedBy
        LEFT JOIN tbl_Users   u ON u.UserId   = m.UserId

        UNION ALL

        -- Circulars (no member author)
        SELECT
            c.CircularId                                               AS Id,
            'Circular'                                                 AS [Type],
            CAST(NULL AS INT)                                          AS MemberId,
            'IME Admin'                                                AS MemberName,
            CAST(NULL AS NVARCHAR(255))                               AS Email,
            c.Title                                                    AS Title,
            c.Description                                              AS Description,
            CAST(0 AS BIT)                                             AS HasImage,
            CAST(NULL AS NVARCHAR(500))                               AS ImagePath,
            c.PublishDate                                              AS PostedDate
        FROM tbl_Circular c

    ) AS Feed
    ORDER BY Feed.PostedDate DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;

END;
GO

-- ── sp_GetMemberFeed ────────────────────────────────────────
-- Returns only Posts by a specific member (for UserProfile page)
CREATE OR ALTER PROCEDURE sp_GetMemberFeed
    @MemberId   INT,
    @PageNumber INT = 1,
    @PageSize   INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    SELECT
        p.PostId                                                    AS Id,
        'Post'                                                      AS [Type],
        p.MemberId                                                  AS MemberId,
        COALESCE(m.FullName, 'IME Member')                         AS MemberName,
        u.Email                                                     AS Email,
        CAST(NULL AS NVARCHAR(255))                                AS Title,
        p.Content                                                   AS Description,
        CASE WHEN EXISTS(SELECT 1 FROM tbl_PostMedia pm WHERE pm.PostId = p.PostId)
             THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END          AS HasImage,
        CAST(NULL AS NVARCHAR(500))                                AS ImagePath,
        p.CreatedDate                                               AS PostedDate
    FROM tbl_Posts p
    LEFT JOIN tbl_Members m ON m.MemberId = p.MemberId
    LEFT JOIN tbl_Users   u ON u.UserId   = m.UserId
    WHERE p.MemberId = @MemberId
    ORDER BY p.CreatedDate DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;

END;
GO
