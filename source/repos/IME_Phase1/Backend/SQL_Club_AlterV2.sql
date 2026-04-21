-- ============================================================
-- Club v2 Alterations: MultiAdmin + LogoPath
-- Run this if you already executed SQL_Club_Setup.sql
-- ============================================================

-- 1. Drop old INT AdminMemberId, add VARCHAR AdminMemberIds + AdminMemberNames + LogoPath
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tbl_club' AND COLUMN_NAME='AdminMemberId' AND DATA_TYPE='int')
BEGIN
    ALTER TABLE tbl_club DROP COLUMN AdminMemberId;
END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tbl_club' AND COLUMN_NAME='AdminMemberIds')
    ALTER TABLE tbl_club ADD AdminMemberIds VARCHAR(500) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tbl_club' AND COLUMN_NAME='AdminMemberNames')
    ALTER TABLE tbl_club ADD AdminMemberNames VARCHAR(1000) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tbl_club' AND COLUMN_NAME='LogoPath')
    ALTER TABLE tbl_club ADD LogoPath VARCHAR(500) NULL;
GO

-- 2. Recreate stored procedures
IF OBJECT_ID('sp_GetAllClubs', 'P') IS NOT NULL DROP PROCEDURE sp_GetAllClubs;
GO
CREATE PROCEDURE sp_GetAllClubs
    @PageNumber INT = 1,
    @PageSize   INT = 50,
    @Search     VARCHAR(200) = NULL,
    @IsActive   BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    SELECT
        c.ClubId, c.ClubName, c.ClubCode, c.Description,
        c.CountryId, cn.CountryName,
        c.StateId,   st.StateName,
        c.City, c.District, c.AddressLine1, c.AddressLine2, c.Pincode,
        c.ContactPersonName, c.ContactNumber, c.AlternateNumber, c.Email, c.Website,
        c.ClubType, c.EstablishedDate, c.TotalMembers,
        c.AdminMemberIds, c.AdminMemberNames,
        c.RegistrationNumber, c.LogoPath,
        c.IsActive, c.IsDeleted,
        c.CreatedBy, c.CreatedDate, c.ModifiedBy, c.ModifiedDate
    FROM tbl_club c
    LEFT JOIN tbl_country cn ON cn.CountryId = c.CountryId
    LEFT JOIN tbl_state   st ON st.StateId   = c.StateId
    WHERE c.IsDeleted = 0
      AND (@IsActive IS NULL OR c.IsActive = @IsActive)
      AND (@Search IS NULL OR @Search = ''
           OR c.ClubName LIKE '%' + @Search + '%'
           OR c.ClubCode LIKE '%' + @Search + '%'
           OR c.City     LIKE '%' + @Search + '%')
    ORDER BY c.CreatedDate DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

IF OBJECT_ID('sp_GetClubById', 'P') IS NOT NULL DROP PROCEDURE sp_GetClubById;
GO
CREATE PROCEDURE sp_GetClubById
    @ClubId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        c.ClubId, c.ClubName, c.ClubCode, c.Description,
        c.CountryId, cn.CountryName,
        c.StateId,   st.StateName,
        c.City, c.District, c.AddressLine1, c.AddressLine2, c.Pincode,
        c.ContactPersonName, c.ContactNumber, c.AlternateNumber, c.Email, c.Website,
        c.ClubType, c.EstablishedDate, c.TotalMembers,
        c.AdminMemberIds, c.AdminMemberNames,
        c.RegistrationNumber, c.LogoPath,
        c.IsActive, c.IsDeleted,
        c.CreatedBy, c.CreatedDate, c.ModifiedBy, c.ModifiedDate
    FROM tbl_club c
    LEFT JOIN tbl_country cn ON cn.CountryId = c.CountryId
    LEFT JOIN tbl_state   st ON st.StateId   = c.StateId
    WHERE c.ClubId = @ClubId AND c.IsDeleted = 0;
END
GO

IF OBJECT_ID('sp_CreateClub', 'P') IS NOT NULL DROP PROCEDURE sp_CreateClub;
GO
CREATE PROCEDURE sp_CreateClub
    @ClubName           VARCHAR(200),
    @ClubCode           VARCHAR(50)   = NULL,
    @Description        VARCHAR(MAX)  = NULL,
    @CountryId          INT           = NULL,
    @StateId            INT           = NULL,
    @City               VARCHAR(100)  = NULL,
    @District           VARCHAR(100)  = NULL,
    @AddressLine1       VARCHAR(255)  = NULL,
    @AddressLine2       VARCHAR(255)  = NULL,
    @Pincode            VARCHAR(20)   = NULL,
    @ContactPersonName  VARCHAR(150)  = NULL,
    @ContactNumber      VARCHAR(20)   = NULL,
    @AlternateNumber    VARCHAR(20)   = NULL,
    @Email              VARCHAR(150)  = NULL,
    @Website            VARCHAR(255)  = NULL,
    @ClubType           VARCHAR(100)  = NULL,
    @EstablishedDate    DATE          = NULL,
    @TotalMembers       INT           = 0,
    @AdminMemberIds     VARCHAR(500)  = NULL,
    @AdminMemberNames   VARCHAR(1000) = NULL,
    @RegistrationNumber VARCHAR(100)  = NULL,
    @IsActive           BIT           = 1,
    @CreatedBy          VARCHAR(100)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO tbl_club (
        ClubName, ClubCode, Description,
        CountryId, StateId, City, District, AddressLine1, AddressLine2, Pincode,
        ContactPersonName, ContactNumber, AlternateNumber, Email, Website,
        ClubType, EstablishedDate, TotalMembers, AdminMemberIds, AdminMemberNames,
        RegistrationNumber, IsActive, IsDeleted, CreatedBy, CreatedDate
    ) VALUES (
        @ClubName, @ClubCode, @Description,
        @CountryId, @StateId, @City, @District, @AddressLine1, @AddressLine2, @Pincode,
        @ContactPersonName, @ContactNumber, @AlternateNumber, @Email, @Website,
        @ClubType, @EstablishedDate, @TotalMembers, @AdminMemberIds, @AdminMemberNames,
        @RegistrationNumber, @IsActive, 0, @CreatedBy, GETDATE()
    );
    SELECT SCOPE_IDENTITY() AS NewClubId;
END
GO

IF OBJECT_ID('sp_UpdateClub', 'P') IS NOT NULL DROP PROCEDURE sp_UpdateClub;
GO
CREATE PROCEDURE sp_UpdateClub
    @ClubId             INT,
    @ClubName           VARCHAR(200),
    @ClubCode           VARCHAR(50)   = NULL,
    @Description        VARCHAR(MAX)  = NULL,
    @CountryId          INT           = NULL,
    @StateId            INT           = NULL,
    @City               VARCHAR(100)  = NULL,
    @District           VARCHAR(100)  = NULL,
    @AddressLine1       VARCHAR(255)  = NULL,
    @AddressLine2       VARCHAR(255)  = NULL,
    @Pincode            VARCHAR(20)   = NULL,
    @ContactPersonName  VARCHAR(150)  = NULL,
    @ContactNumber      VARCHAR(20)   = NULL,
    @AlternateNumber    VARCHAR(20)   = NULL,
    @Email              VARCHAR(150)  = NULL,
    @Website            VARCHAR(255)  = NULL,
    @ClubType           VARCHAR(100)  = NULL,
    @EstablishedDate    DATE          = NULL,
    @TotalMembers       INT           = 0,
    @AdminMemberIds     VARCHAR(500)  = NULL,
    @AdminMemberNames   VARCHAR(1000) = NULL,
    @RegistrationNumber VARCHAR(100)  = NULL,
    @IsActive           BIT           = 1,
    @ModifiedBy         VARCHAR(100)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE tbl_club SET
        ClubName           = @ClubName,
        ClubCode           = @ClubCode,
        Description        = @Description,
        CountryId          = @CountryId,
        StateId            = @StateId,
        City               = @City,
        District           = @District,
        AddressLine1       = @AddressLine1,
        AddressLine2       = @AddressLine2,
        Pincode            = @Pincode,
        ContactPersonName  = @ContactPersonName,
        ContactNumber      = @ContactNumber,
        AlternateNumber    = @AlternateNumber,
        Email              = @Email,
        Website            = @Website,
        ClubType           = @ClubType,
        EstablishedDate    = @EstablishedDate,
        TotalMembers       = @TotalMembers,
        AdminMemberIds     = @AdminMemberIds,
        AdminMemberNames   = @AdminMemberNames,
        RegistrationNumber = @RegistrationNumber,
        IsActive           = @IsActive,
        ModifiedBy         = @ModifiedBy,
        ModifiedDate       = GETDATE()
    WHERE ClubId = @ClubId AND IsDeleted = 0;
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

IF OBJECT_ID('sp_UpdateClubLogo', 'P') IS NOT NULL DROP PROCEDURE sp_UpdateClubLogo;
GO
CREATE PROCEDURE sp_UpdateClubLogo
    @ClubId     INT,
    @LogoPath   VARCHAR(500),
    @ModifiedBy VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE tbl_club
    SET LogoPath = @LogoPath, ModifiedBy = @ModifiedBy, ModifiedDate = GETDATE()
    WHERE ClubId = @ClubId AND IsDeleted = 0;
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

IF OBJECT_ID('sp_DeleteClub', 'P') IS NOT NULL DROP PROCEDURE sp_DeleteClub;
GO
CREATE PROCEDURE sp_DeleteClub
    @ClubId     INT,
    @ModifiedBy VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE tbl_club
    SET IsDeleted = 1, IsActive = 0, ModifiedBy = @ModifiedBy, ModifiedDate = GETDATE()
    WHERE ClubId = @ClubId;
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
