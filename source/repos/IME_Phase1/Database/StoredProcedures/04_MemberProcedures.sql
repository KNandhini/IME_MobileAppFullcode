-- Member Management Stored Procedures
USE [db_a85a40_ime];
GO

-- SP: Get Member Profile
CREATE OR ALTER PROCEDURE sp_GetMemberProfile
    @MemberId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        m.MemberId,
        m.UserId,
        u.Email,
        m.FullName,
        m.Address,
        m.ContactNumber,
        m.Gender,
        m.Age,
        m.DateOfBirth,
        m.Place,
        m.DesignationId,
        d.DesignationName,
        m.ProfilePhotoPath,
        m.MembershipStatus,
        m.CreatedDate,
        m.UpdatedDate
    FROM Members m
    INNER JOIN Users u ON m.UserId = u.UserId
    LEFT JOIN Designation d ON m.DesignationId = d.DesignationId
    WHERE m.MemberId = @MemberId;
END
GO

-- SP: Update Member Profile
CREATE OR ALTER PROCEDURE sp_UpdateMemberProfile
    @MemberId INT,
    @FullName NVARCHAR(200),
    @Address NVARCHAR(500),
    @ContactNumber NVARCHAR(20),
    @Gender NVARCHAR(10),
    @Age INT,
    @Place NVARCHAR(100),
    @DesignationId INT,
    @ProfilePhotoPath NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Members
    SET
        FullName = @FullName,
        Address = @Address,
        ContactNumber = @ContactNumber,
        Gender = @Gender,
        Age = @Age,
        Place = @Place,
        DesignationId = @DesignationId,
        ProfilePhotoPath = ISNULL(@ProfilePhotoPath, ProfilePhotoPath),
        UpdatedDate = GETDATE()
    WHERE MemberId = @MemberId;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- SP: Get Member Payment History
CREATE OR ALTER PROCEDURE sp_GetMemberPaymentHistory
    @MemberId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        mp.PaymentId,
        mp.Amount,
        mp.PaymentDate,
        mp.PaymentMode,
        mp.TransactionReference,
        mp.Status,
        mf.EffectiveFrom,
        mf.EffectiveTo
    FROM MembershipPayment mp
    INNER JOIN MembershipFee mf ON mp.FeeId = mf.FeeId
    WHERE mp.MemberId = @MemberId
    ORDER BY mp.PaymentDate DESC;
END
GO

-- SP: Get All Members
CREATE OR ALTER PROCEDURE sp_GetAllMembers
    @PageNumber INT = 1,
    @PageSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    SELECT
        m.MemberId,
        m.FullName,
        m.ContactNumber,
        m.Gender,
        d.DesignationName,
        m.MembershipStatus,
        u.Email,
        m.CreatedDate,
        m.ProfilePhotoPath
    FROM Members m
    INNER JOIN Users u ON m.UserId = u.UserId
    LEFT JOIN Designation d ON m.DesignationId = d.DesignationId
    ORDER BY m.CreatedDate DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    -- Return total count
    SELECT COUNT(*) AS TotalCount FROM Members;
END
GO

-- SP: Update Member Status
CREATE OR ALTER PROCEDURE sp_UpdateMemberStatus
    @MemberId INT,
    @Status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Members
    SET MembershipStatus = @Status,
        UpdatedDate = GETDATE()
    WHERE MemberId = @MemberId;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

PRINT 'Member procedures created successfully';
