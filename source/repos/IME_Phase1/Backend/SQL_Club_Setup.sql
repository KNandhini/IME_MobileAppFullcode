-- ============================================================
-- Club Master Setup: Tables + Stored Procedures
-- ============================================================

-- 1. tbl_country
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tbl_country')
BEGIN
    CREATE TABLE tbl_country (
        CountryId   INT IDENTITY(1,1) PRIMARY KEY,
        CountryName VARCHAR(100) NOT NULL
    );

    INSERT INTO tbl_country (CountryName) VALUES ('India'), ('USA'), ('UK'), ('Canada'), ('Australia');
END
GO

-- 2. tbl_state
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tbl_state')
BEGIN
    CREATE TABLE tbl_state (
        StateId   INT IDENTITY(1,1) PRIMARY KEY,
        StateName VARCHAR(100) NOT NULL,
        CountryId INT NOT NULL,
        CONSTRAINT FK_state_country FOREIGN KEY (CountryId) REFERENCES tbl_country(CountryId)
    );

    -- India states (CountryId = 1)
    INSERT INTO tbl_state (StateName, CountryId) VALUES
        ('Andhra Pradesh', 1), ('Arunachal Pradesh', 1), ('Assam', 1), ('Bihar', 1),
        ('Chhattisgarh', 1), ('Goa', 1), ('Gujarat', 1), ('Haryana', 1),
        ('Himachal Pradesh', 1), ('Jharkhand', 1), ('Karnataka', 1), ('Kerala', 1),
        ('Madhya Pradesh', 1), ('Maharashtra', 1), ('Manipur', 1), ('Meghalaya', 1),
        ('Mizoram', 1), ('Nagaland', 1), ('Odisha', 1), ('Punjab', 1),
        ('Rajasthan', 1), ('Sikkim', 1), ('Tamil Nadu', 1), ('Telangana', 1),
        ('Tripura', 1), ('Uttar Pradesh', 1), ('Uttarakhand', 1), ('West Bengal', 1),
        ('Delhi', 1), ('Jammu and Kashmir', 1), ('Ladakh', 1),
        ('Andaman and Nicobar Islands', 1), ('Chandigarh', 1),
        ('Dadra and Nagar Haveli', 1), ('Lakshadweep', 1), ('Puducherry', 1);
END
GO

-- 3. tbl_club
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tbl_club')
BEGIN
    CREATE TABLE tbl_club (
        ClubId             INT IDENTITY(1,1) PRIMARY KEY,
        ClubName           VARCHAR(200)  NOT NULL,
        ClubCode           VARCHAR(50)   NULL,
        Description        VARCHAR(MAX)  NULL,
        -- Location
        CountryId          INT           NULL,
        StateId            INT           NULL,
        City               VARCHAR(100)  NULL,
        District           VARCHAR(100)  NULL,
        AddressLine1       VARCHAR(255)  NULL,
        AddressLine2       VARCHAR(255)  NULL,
        Pincode            VARCHAR(20)   NULL,
        -- Contact
        ContactPersonName  VARCHAR(150)  NULL,
        ContactNumber      VARCHAR(20)   NULL,
        AlternateNumber    VARCHAR(20)   NULL,
        Email              VARCHAR(150)  NULL,
        Website            VARCHAR(255)  NULL,
        -- Club Info
        ClubType           VARCHAR(100)  NULL,
        EstablishedDate    DATE          NULL,
        TotalMembers       INT           NULL DEFAULT 0,
        AdminMemberId      INT           NULL,
        RegistrationNumber VARCHAR(100)  NULL,
        -- Status
        IsActive           BIT           NOT NULL DEFAULT 1,
        IsDeleted          BIT           NOT NULL DEFAULT 0,
        CreatedBy          VARCHAR(100)  NULL,
        CreatedDate        DATETIME      NOT NULL DEFAULT GETDATE(),
        ModifiedBy         VARCHAR(100)  NULL,
        ModifiedDate       DATETIME      NULL,
        CONSTRAINT FK_club_country FOREIGN KEY (CountryId) REFERENCES tbl_country(CountryId),
        CONSTRAINT FK_club_state   FOREIGN KEY (StateId)   REFERENCES tbl_state(StateId)
    );
END
GO

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

-- sp_GetAllClubs
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
        c.ClubType, c.EstablishedDate, c.TotalMembers, c.AdminMemberId,
        m.FullName AS AdminMemberName,
        c.RegistrationNumber,
        c.IsActive, c.IsDeleted,
        c.CreatedBy, c.CreatedDate, c.ModifiedBy, c.ModifiedDate
    FROM tbl_club c
    LEFT JOIN tbl_country cn ON cn.CountryId = c.CountryId
    LEFT JOIN tbl_state   st ON st.StateId   = c.StateId
    LEFT JOIN tbl_Members m  ON m.MemberId   = c.AdminMemberId
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

-- sp_GetClubById
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
        c.ClubType, c.EstablishedDate, c.TotalMembers, c.AdminMemberId,
        m.FullName AS AdminMemberName,
        c.RegistrationNumber,
        c.IsActive, c.IsDeleted,
        c.CreatedBy, c.CreatedDate, c.ModifiedBy, c.ModifiedDate
    FROM tbl_club c
    LEFT JOIN tbl_country cn ON cn.CountryId = c.CountryId
    LEFT JOIN tbl_state   st ON st.StateId   = c.StateId
    LEFT JOIN tbl_Members m  ON m.MemberId   = c.AdminMemberId
    WHERE c.ClubId = @ClubId AND c.IsDeleted = 0;
END
GO

-- sp_CreateClub
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
    @AdminMemberId      INT           = NULL,
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
        ClubType, EstablishedDate, TotalMembers, AdminMemberId, RegistrationNumber,
        IsActive, IsDeleted, CreatedBy, CreatedDate
    ) VALUES (
        @ClubName, @ClubCode, @Description,
        @CountryId, @StateId, @City, @District, @AddressLine1, @AddressLine2, @Pincode,
        @ContactPersonName, @ContactNumber, @AlternateNumber, @Email, @Website,
        @ClubType, @EstablishedDate, @TotalMembers, @AdminMemberId, @RegistrationNumber,
        @IsActive, 0, @CreatedBy, GETDATE()
    );
    SELECT SCOPE_IDENTITY() AS NewClubId;
END
GO

-- sp_UpdateClub
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
    @AdminMemberId      INT           = NULL,
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
        AdminMemberId      = @AdminMemberId,
        RegistrationNumber = @RegistrationNumber,
        IsActive           = @IsActive,
        ModifiedBy         = @ModifiedBy,
        ModifiedDate       = GETDATE()
    WHERE ClubId = @ClubId AND IsDeleted = 0;
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- sp_DeleteClub (soft delete)
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

-- sp_GetCountries
IF OBJECT_ID('sp_GetCountries', 'P') IS NOT NULL DROP PROCEDURE sp_GetCountries;
GO
CREATE PROCEDURE sp_GetCountries
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CountryId, CountryName FROM tbl_country ORDER BY CountryName;
END
GO

-- sp_GetStatesByCountry
IF OBJECT_ID('sp_GetStatesByCountry', 'P') IS NOT NULL DROP PROCEDURE sp_GetStatesByCountry;
GO
CREATE PROCEDURE sp_GetStatesByCountry
    @CountryId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT StateId, StateName FROM tbl_state WHERE CountryId = @CountryId ORDER BY StateName;
END
GO
