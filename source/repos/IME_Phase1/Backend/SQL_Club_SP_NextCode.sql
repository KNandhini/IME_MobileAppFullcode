-- Run this once to create/update the sp_GetNextClubCode stored procedure
IF OBJECT_ID('sp_GetNextClubCode', 'P') IS NOT NULL DROP PROCEDURE sp_GetNextClubCode;
GO
CREATE PROCEDURE sp_GetNextClubCode
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @MaxNum INT;
    SELECT @MaxNum = MAX(TRY_CAST(SUBSTRING(ClubCode, 5, LEN(ClubCode)) AS INT))
    FROM tbl_club
    WHERE IsDeleted = 0 AND ClubCode LIKE 'CLUB[0-9]%';
    SELECT 'CLUB' + RIGHT('000' + CAST(ISNULL(@MaxNum, 0) + 1 AS VARCHAR(10)), 3) AS NextCode;
END
GO
