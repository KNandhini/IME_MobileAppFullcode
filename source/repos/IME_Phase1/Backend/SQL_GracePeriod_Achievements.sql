-- ============================================================
-- Run in SSMS on db_a85a40_ime
-- Changes: GraceExpiryDate, AchievementAttachments table,
--          sp_CreateUser, sp_UserLogin, sp_GetAllAchievements,
--          sp_CreateAchievement
-- ============================================================

-- ── 1. GraceExpiryDate column ──────────────────────────────
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'tbl_Members' AND COLUMN_NAME = 'GraceExpiryDate'
)
BEGIN
    ALTER TABLE tbl_Members ADD GraceExpiryDate DATETIME NULL;
    PRINT 'GraceExpiryDate added to tbl_Members.';
END
ELSE
    PRINT 'GraceExpiryDate already exists.';
GO

-- ── 2. AchievementAttachments table ───────────────────────
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'AchievementAttachments'
)
BEGIN
    CREATE TABLE AchievementAttachments (
        AttachmentId  INT           IDENTITY(1,1) PRIMARY KEY,
        AchievementId INT           NOT NULL,
        FileName      NVARCHAR(255) NULL,
        FilePath      NVARCHAR(500) NULL,
        UploadedDate  DATETIME      NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_AchAttach_Achievement
            FOREIGN KEY (AchievementId) REFERENCES Achievements(AchievementId)
            ON DELETE CASCADE
    );
    PRINT 'AchievementAttachments table created.';
END
ELSE
    PRINT 'AchievementAttachments already exists.';
GO

-- ── 3. sp_CreateUser ──────────────────────────────────────
--   Added: @CountryId, @StateId, @ClubId params
--   Added: GraceExpiryDate = +3 days on member insert
--   Changed: IsActive = 1 so user can login during grace period
--   Returns: CountryName, StateName, ClubName via LEFT JOINs
CREATE OR ALTER PROCEDURE sp_CreateUser
    @Email            NVARCHAR(255),
    @PasswordHash     NVARCHAR(500),
    @RoleId           INT,
    @FullName         NVARCHAR(200),
    @Address          NVARCHAR(500)  = NULL,
    @ContactNumber    NVARCHAR(20)   = NULL,
    @Gender           NVARCHAR(10)   = NULL,
    @Age              INT            = NULL,
    @DateOfBirth      DATE,
    @Place            NVARCHAR(100)  = NULL,
    @DesignationId    INT            = NULL,
    @ProfilePhotoPath NVARCHAR(500)  = NULL,
    @CountryId        INT            = NULL,
    @StateId          INT            = NULL,
    @ClubId           INT            = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM tbl_Users WHERE Email = @Email)
        BEGIN
            SELECT -1 AS UserId, -1 AS MemberId, 'Email already exists' AS Message,
                   NULL AS CountryName, NULL AS StateName, NULL AS ClubName;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        DECLARE @NewUserId INT =
            ISNULL((SELECT MAX(UserId) FROM tbl_Users WITH (UPDLOCK, HOLDLOCK)), 0) + 1;

        -- IsActive = 1: user can log in during the 3-day grace period
        INSERT INTO tbl_Users (UserId, Email, PasswordHash, RoleId, IsActive)
        VALUES (@NewUserId, @Email, @PasswordHash, @RoleId, 1);

        INSERT INTO tbl_Members (
            UserId, FullName, Address, ContactNumber, Gender, Age,
            DateOfBirth, Place, DesignationId, ProfilePhotoPath,
            MembershipStatus, CountryId, StateId, ClubId, GraceExpiryDate
        )
        VALUES (
            @NewUserId, @FullName, @Address, @ContactNumber, @Gender, @Age,
            @DateOfBirth, @Place, @DesignationId, @ProfilePhotoPath,
            'Pending', @CountryId, @StateId, @ClubId,
            DATEADD(DAY, 3, GETDATE())
        );

        DECLARE @NewMemberId INT = SCOPE_IDENTITY();

        COMMIT TRANSACTION;

        -- Return with joined lookup names (adjust table/column names if yours differ)
        SELECT
            @NewUserId   AS UserId,
            @NewMemberId AS MemberId,
            'Success'    AS Message,
            c.CountryName,
            s.StateName,
            cl.ClubName
        FROM (SELECT 1 AS x) base
        LEFT JOIN tbl_Countries c  ON c.CountryId = @CountryId
        LEFT JOIN tbl_States    s  ON s.StateId   = @StateId
        LEFT JOIN tbl_Clubs     cl ON cl.ClubId   = @ClubId;

    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT -1 AS UserId, -1 AS MemberId, ERROR_MESSAGE() AS Message,
               NULL AS CountryName, NULL AS StateName, NULL AS ClubName;
    END CATCH
END
GO

-- ── 4. sp_UserLogin ───────────────────────────────────────
--   Added: MembershipStatus, GraceExpiryDate to SELECT
CREATE OR ALTER PROCEDURE sp_UserLogin
    @Email        NVARCHAR(100),
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        u.UserId,
        u.Email,
        u.PasswordHash,
        u.RoleId,
        u.IsActive,
        r.RoleName,
        m.MemberId,
        m.FullName,
        m.ProfilePhotoPath,
        m.ProfilePhoto,
        m.MembershipStatus,
        m.GraceExpiryDate
    FROM tbl_Users u
    LEFT JOIN tbl_Roles   r ON r.RoleId = u.RoleId
    LEFT JOIN tbl_Members m ON m.UserId = u.UserId
    WHERE u.Email        = @Email
      AND u.PasswordHash = @PasswordHash
      AND u.IsActive     = 1;
END;
GO

-- ── 5. sp_GetAllAchievements ──────────────────────────────
--   Added: MemberPhotoPath alias, AttachmentPath (first attachment)
CREATE OR ALTER PROCEDURE sp_GetAllAchievements
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        a.AchievementId,
        a.MemberName,
        a.PhotoPath       AS MemberPhotoPath,
        a.Title,
        a.Description,
        a.AchievementDate,
        a.CreatedDate,
        (
            SELECT TOP 1 FilePath
            FROM AchievementAttachments aa
            WHERE aa.AchievementId = a.AchievementId
            ORDER BY aa.AttachmentId
        ) AS AttachmentPath
    FROM Achievements a
    ORDER BY a.CreatedDate DESC;
END;
GO

-- ── 6. sp_CreateAchievement ───────────────────────────────
--   Open to all users (role control is in the C# controller)
CREATE OR ALTER PROCEDURE sp_CreateAchievement
    @MemberName      NVARCHAR(200),
    @PhotoPath       NVARCHAR(500) = NULL,
    @Title           NVARCHAR(300),
    @Description     NVARCHAR(MAX) = NULL,
    @AchievementDate DATE          = NULL,
    @CreatedBy       INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Achievements (MemberName, PhotoPath, Title, Description, AchievementDate, CreatedDate)
    VALUES (@MemberName, @PhotoPath, @Title, @Description, @AchievementDate, GETDATE());
    SELECT SCOPE_IDENTITY() AS AchievementId;
END;
GO

-- ── 7. sp_UpdateAchievement ──────────────────────────────
CREATE OR ALTER PROCEDURE sp_UpdateAchievement
    @AchievementId   INT,
    @MemberName      NVARCHAR(200),
    @Title           NVARCHAR(300),
    @Description     NVARCHAR(MAX) = NULL,
    @AchievementDate DATE          = NULL,
    @PhotoPath       NVARCHAR(500) = NULL   -- NULL = keep existing photo
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Achievements SET
        MemberName      = @MemberName,
        Title           = @Title,
        Description     = @Description,
        AchievementDate = @AchievementDate,
        PhotoPath       = CASE WHEN @PhotoPath IS NOT NULL THEN @PhotoPath ELSE PhotoPath END,
        UpdatedDate     = GETDATE()
    WHERE AchievementId = @AchievementId;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

-- ── 8. sp_DeleteAchievement ──────────────────────────────
--   AchievementAttachments rows are removed via ON DELETE CASCADE
CREATE OR ALTER PROCEDURE sp_DeleteAchievement
    @AchievementId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM Achievements WHERE AchievementId = @AchievementId;
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

PRINT 'SQL_GracePeriod_Achievements applied successfully.';
