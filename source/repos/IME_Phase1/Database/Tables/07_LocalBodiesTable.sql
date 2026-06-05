-- =============================================================================
-- 07_LocalBodiesTable.sql
-- Master table for all local governing bodies:
--   Municipal Corporations, Municipalities, Town Panchayats, Village Panchayats
-- Source: TamilNadu_LocalBodies_Master.csv  (project root)
-- Run this AFTER 01_CreateTables.sql
-- =============================================================================

IF OBJECT_ID('dbo.LocalBodies', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[LocalBodies] (
        [LocalBodyId]        INT             IDENTITY(1,1) NOT NULL,
        [LocalBodyName]      NVARCHAR(200)   NOT NULL,
        [LocalBodyType]      NVARCHAR(50)    NOT NULL,   -- 'Municipal Corporation' | 'Municipality' | 'Town Panchayat' | 'Village Panchayat'
        [DistrictId]         INT             NULL,        -- optional FK to Districts table
        [DistrictName]       NVARCHAR(100)   NOT NULL,
        [StateId]            INT             NULL,        -- optional FK to States table
        [StateName]          NVARCHAR(100)   NOT NULL DEFAULT 'Tamil Nadu',
        [Pincode]            NVARCHAR(10)    NULL,
        [Address]            NVARCHAR(500)   NULL,
        [ContactNumber]      NVARCHAR(50)    NULL,
        [Email]              NVARCHAR(100)   NULL,
        [OfficialWebsiteUrl] NVARCHAR(300)   NULL,
        [TnurbantreeUrl]     NVARCHAR(300)   NULL,
        [ChairpersonName]    NVARCHAR(150)   NULL,        -- Mayor / Chairman / President
        [CommissionerName]   NVARCHAR(150)   NULL,        -- Commissioner / Executive Officer
        [WardCount]          INT             NULL,
        [Population]         NVARCHAR(50)    NULL,
        [EstablishedYear]    INT             NULL,
        [AboutDescription]   NVARCHAR(MAX)   NULL,
        [IsActive]           BIT             NOT NULL DEFAULT 1,
        [CreatedAt]          DATETIME        NOT NULL DEFAULT GETDATE(),
        [UpdatedAt]          DATETIME        NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_LocalBodies] PRIMARY KEY CLUSTERED ([LocalBodyId] ASC)
    );

    -- Indexes for common query patterns
    CREATE NONCLUSTERED INDEX [IX_LocalBodies_DistrictName]
        ON [dbo].[LocalBodies] ([DistrictName] ASC) INCLUDE ([LocalBodyName], [LocalBodyType]);

    CREATE NONCLUSTERED INDEX [IX_LocalBodies_LocalBodyType]
        ON [dbo].[LocalBodies] ([LocalBodyType] ASC) INCLUDE ([DistrictName], [LocalBodyName]);

    CREATE NONCLUSTERED INDEX [IX_LocalBodies_NameSearch]
        ON [dbo].[LocalBodies] ([LocalBodyName] ASC);

    PRINT 'LocalBodies table created successfully.';
END
ELSE
BEGIN
    PRINT 'LocalBodies table already exists — skipped.';
END
GO
