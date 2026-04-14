-- ============================================================
-- Run this in SSMS on your IME database
-- Creates sp_GetFeed — unified paginated feed (Activities + News + Circulars)
-- ============================================================

CREATE OR ALTER PROCEDURE sp_GetFeed
    @PageNumber INT = 1,
    @PageSize   INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    SELECT * FROM (

        -- ── Activities ──────────────────────────────────────────────
        SELECT
            a.ActivityId                                        AS Id,
            'Activity'                                          AS [Type],
            COALESCE(m.FullName, 'IME Admin')                  AS MemberName,
            a.ActivityName                                      AS Title,
            a.Description                                       AS Description,
            CASE WHEN att.AttachCount > 0
                 THEN CAST(1 AS BIT)
                 ELSE CAST(0 AS BIT) END                       AS HasImage,
            CAST(NULL AS NVARCHAR(500))                        AS ImagePath,
            COALESCE(a.ActivityDate, a.CreatedDate)            AS PostedDate
        FROM Activities a
        LEFT JOIN Members m ON m.MemberId = a.CreatedBy
        LEFT JOIN (
            SELECT ReferenceId, COUNT(*) AS AttachCount
            FROM Attachments
            WHERE ModuleName = 'Activities'
            GROUP BY ReferenceId
        ) att ON att.ReferenceId = a.ActivityId

        UNION ALL

        -- ── News ────────────────────────────────────────────────────
        SELECT
            n.NewsId                                           AS Id,
            'News'                                             AS [Type],
            COALESCE(m.FullName, 'IME Admin')                 AS MemberName,
            n.Title                                            AS Title,
            n.ShortDescription                                 AS Description,
            CASE WHEN n.CoverImagePath IS NOT NULL
                 THEN CAST(1 AS BIT)
                 ELSE CAST(0 AS BIT) END                      AS HasImage,
            n.CoverImagePath                                   AS ImagePath,
            n.PublishDate                                      AS PostedDate
        FROM News n
        LEFT JOIN Members m ON m.MemberId = n.CreatedBy

        UNION ALL

        -- ── Circulars ───────────────────────────────────────────────
        SELECT
            c.CircularId                                       AS Id,
            'Circular'                                         AS [Type],
            'IME Admin'                                        AS MemberName,
            c.Title                                            AS Title,
            c.Description                                      AS Description,
            CAST(0 AS BIT)                                     AS HasImage,
            CAST(NULL AS NVARCHAR(500))                        AS ImagePath,
            c.PublishDate                                      AS PostedDate
        FROM Circulars c

    ) AS Feed
    ORDER BY Feed.PostedDate DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;

END;
GO
