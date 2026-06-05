-- =============================================================================
-- 08_LocalBodyProcedures.sql
-- Stored procedures + seed data for the LocalBodies master table.
-- Run this AFTER 07_LocalBodiesTable.sql
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- sp_GetLocalBodiesByDistrict
-- ─────────────────────────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.sp_GetLocalBodiesByDistrict', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetLocalBodiesByDistrict;
GO
CREATE PROCEDURE dbo.sp_GetLocalBodiesByDistrict
    @DistrictName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT LocalBodyId, LocalBodyName, LocalBodyType, DistrictName, StateName,
           Pincode, Address, ContactNumber, Email,
           OfficialWebsiteUrl, TnurbantreeUrl,
           ChairpersonName, CommissionerName,
           WardCount, Population, EstablishedYear, AboutDescription, IsActive
    FROM   dbo.LocalBodies
    WHERE  IsActive = 1
      AND  DistrictName = @DistrictName
    ORDER  BY
           CASE LocalBodyType
               WHEN 'Municipal Corporation' THEN 1
               WHEN 'Municipality'          THEN 2
               WHEN 'Town Panchayat'        THEN 3
               WHEN 'Village Panchayat'     THEN 4
               ELSE 5
           END,
           LocalBodyName;
END
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- sp_GetLocalBodyById
-- ─────────────────────────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.sp_GetLocalBodyById', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetLocalBodyById;
GO
CREATE PROCEDURE dbo.sp_GetLocalBodyById
    @LocalBodyId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT LocalBodyId, LocalBodyName, LocalBodyType, DistrictName, StateName,
           Pincode, Address, ContactNumber, Email,
           OfficialWebsiteUrl, TnurbantreeUrl,
           ChairpersonName, CommissionerName,
           WardCount, Population, EstablishedYear, AboutDescription, IsActive
    FROM   dbo.LocalBodies
    WHERE  LocalBodyId = @LocalBodyId;
END
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- sp_SearchLocalBody  — fuzzy name match, optional district filter
-- ─────────────────────────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.sp_SearchLocalBody', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_SearchLocalBody;
GO
CREATE PROCEDURE dbo.sp_SearchLocalBody
    @SearchName   NVARCHAR(200),
    @DistrictName NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Exact name match (highest priority)
    IF EXISTS (
        SELECT 1 FROM dbo.LocalBodies
        WHERE  IsActive = 1
          AND  LocalBodyName = @SearchName
          AND  (@DistrictName IS NULL OR DistrictName = @DistrictName)
    )
    BEGIN
        SELECT TOP 1
               LocalBodyId, LocalBodyName, LocalBodyType, DistrictName, StateName,
               Pincode, Address, ContactNumber, Email,
               OfficialWebsiteUrl, TnurbantreeUrl,
               ChairpersonName, CommissionerName,
               WardCount, Population, EstablishedYear, AboutDescription, IsActive
        FROM   dbo.LocalBodies
        WHERE  IsActive = 1
          AND  LocalBodyName = @SearchName
          AND  (@DistrictName IS NULL OR DistrictName = @DistrictName)
        ORDER  BY LocalBodyId;
        RETURN;
    END

    -- 2. Name contains search term (partial match)
    SELECT TOP 5
           LocalBodyId, LocalBodyName, LocalBodyType, DistrictName, StateName,
           Pincode, Address, ContactNumber, Email,
           OfficialWebsiteUrl, TnurbantreeUrl,
           ChairpersonName, CommissionerName,
           WardCount, Population, EstablishedYear, AboutDescription, IsActive
    FROM   dbo.LocalBodies
    WHERE  IsActive = 1
      AND  LocalBodyName LIKE '%' + @SearchName + '%'
      AND  (@DistrictName IS NULL OR DistrictName = @DistrictName)
    ORDER  BY
           -- Exact-start match first
           CASE WHEN LocalBodyName LIKE @SearchName + '%' THEN 0 ELSE 1 END,
           LocalBodyName;
END
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- sp_GetLocalBodiesByType  — filter by type across all districts
-- ─────────────────────────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.sp_GetLocalBodiesByType', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetLocalBodiesByType;
GO
CREATE PROCEDURE dbo.sp_GetLocalBodiesByType
    @LocalBodyType NVARCHAR(50),
    @StateName     NVARCHAR(100) = 'Tamil Nadu'
AS
BEGIN
    SET NOCOUNT ON;
    SELECT LocalBodyId, LocalBodyName, LocalBodyType, DistrictName, StateName,
           Pincode, Address, ContactNumber, Email,
           OfficialWebsiteUrl, TnurbantreeUrl,
           ChairpersonName, CommissionerName,
           WardCount, Population, EstablishedYear, AboutDescription, IsActive
    FROM   dbo.LocalBodies
    WHERE  IsActive = 1
      AND  LocalBodyType = @LocalBodyType
      AND  StateName = @StateName
    ORDER  BY DistrictName, LocalBodyName;
END
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- sp_UpsertLocalBody  — insert or update a single local body (for CSV import)
-- ─────────────────────────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.sp_UpsertLocalBody', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_UpsertLocalBody;
GO
CREATE PROCEDURE dbo.sp_UpsertLocalBody
    @LocalBodyName      NVARCHAR(200),
    @LocalBodyType      NVARCHAR(50),
    @DistrictName       NVARCHAR(100),
    @StateName          NVARCHAR(100)  = 'Tamil Nadu',
    @Pincode            NVARCHAR(10)   = NULL,
    @Address            NVARCHAR(500)  = NULL,
    @ContactNumber      NVARCHAR(50)   = NULL,
    @Email              NVARCHAR(100)  = NULL,
    @OfficialWebsiteUrl NVARCHAR(300)  = NULL,
    @TnurbantreeUrl     NVARCHAR(300)  = NULL,
    @ChairpersonName    NVARCHAR(150)  = NULL,
    @CommissionerName   NVARCHAR(150)  = NULL,
    @WardCount          INT            = NULL,
    @Population         NVARCHAR(50)   = NULL,
    @EstablishedYear    INT            = NULL,
    @AboutDescription   NVARCHAR(MAX)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM dbo.LocalBodies
               WHERE LocalBodyName = @LocalBodyName AND DistrictName = @DistrictName)
    BEGIN
        UPDATE dbo.LocalBodies SET
            LocalBodyType      = @LocalBodyType,
            StateName          = @StateName,
            Pincode            = COALESCE(@Pincode,            Pincode),
            Address            = COALESCE(@Address,            Address),
            ContactNumber      = COALESCE(@ContactNumber,      ContactNumber),
            Email              = COALESCE(@Email,              Email),
            OfficialWebsiteUrl = COALESCE(@OfficialWebsiteUrl, OfficialWebsiteUrl),
            TnurbantreeUrl     = COALESCE(@TnurbantreeUrl,     TnurbantreeUrl),
            ChairpersonName    = COALESCE(@ChairpersonName,    ChairpersonName),
            CommissionerName   = COALESCE(@CommissionerName,   CommissionerName),
            WardCount          = COALESCE(@WardCount,          WardCount),
            Population         = COALESCE(@Population,         Population),
            EstablishedYear    = COALESCE(@EstablishedYear,    EstablishedYear),
            AboutDescription   = COALESCE(@AboutDescription,   AboutDescription),
            UpdatedAt          = GETDATE()
        WHERE LocalBodyName = @LocalBodyName AND DistrictName = @DistrictName;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.LocalBodies
            (LocalBodyName, LocalBodyType, DistrictName, StateName, Pincode,
             Address, ContactNumber, Email, OfficialWebsiteUrl, TnurbantreeUrl,
             ChairpersonName, CommissionerName, WardCount, Population, EstablishedYear, AboutDescription)
        VALUES
            (@LocalBodyName, @LocalBodyType, @DistrictName, @StateName, @Pincode,
             @Address, @ContactNumber, @Email, @OfficialWebsiteUrl, @TnurbantreeUrl,
             @ChairpersonName, @CommissionerName, @WardCount, @Population, @EstablishedYear, @AboutDescription);
    END

    SELECT SCOPE_IDENTITY() AS LocalBodyId;
END
GO

-- =============================================================================
-- SEED DATA  —  matches TamilNadu_LocalBodies_Master.csv
-- =============================================================================
PRINT 'Seeding LocalBodies master data...';

-- ── Tamil Nadu Municipal Corporations ────────────────────────────────────────
EXEC sp_UpsertLocalBody 'Chennai Municipal Corporation','Municipal Corporation','Chennai','Tamil Nadu','600003','Ripon Building, EVR Periyar Salai, Chennai - 600003','044-25384530',NULL,'https://www.chennaicorporation.gov.in/','http://www.tnurbantree.tn.gov.in/chennai/',NULL,NULL,200,'7088000',1688,'Greater Chennai Corporation is the largest municipal corporation in Tamil Nadu. Established in 1688 it is one of the oldest municipal bodies in India covering 426 sq km and serving over 70 lakh residents.';
EXEC sp_UpsertLocalBody 'Coimbatore Municipal Corporation','Municipal Corporation','Coimbatore','Tamil Nadu','641018','Corporation Office, Coimbatore - 641018','0422-2392000',NULL,'https://www.coimbatorecorporation.gov.in/','http://www.tnurbantree.tn.gov.in/coimbatore/',NULL,NULL,100,'1601438',1981,'Coimbatore City Municipal Corporation is known as the Manchester of South India due to its textile and engineering industries. It is the second largest corporation in Tamil Nadu.';
EXEC sp_UpsertLocalBody 'Madurai Municipal Corporation','Municipal Corporation','Madurai','Tamil Nadu','625020','Corporation Building, Madurai - 625020','0452-2530000',NULL,'https://www.maduraicorporation.gov.in/','http://www.tnurbantree.tn.gov.in/madurai/',NULL,NULL,100,'1462420',1971,'Madurai City Municipal Corporation governs the ancient temple city of Madurai. Known for the Meenakshi Amman Temple it is one of the oldest living cities in the world and the cultural capital of Tamil Nadu.';
EXEC sp_UpsertLocalBody 'Tiruchirappalli Municipal Corporation','Municipal Corporation','Tiruchirappalli','Tamil Nadu','620001','Municipal Corporation Office, Tiruchirappalli - 620001','0431-2415000',NULL,'https://www.corporationoftrichy.in/','http://www.tnurbantree.tn.gov.in/trichy/',NULL,NULL,65,'916857',1994,'Tiruchirappalli City Municipal Corporation (Trichy) is situated at the centre of Tamil Nadu. Known for the Rock Fort Temple and as an educational hub with NIT Trichy and Bharathidasan University.';
EXEC sp_UpsertLocalBody 'Salem Municipal Corporation','Municipal Corporation','Salem','Tamil Nadu','636001','Corporation Building, Saradha College Road, Salem - 636001','0427-2230010',NULL,'https://www.salemcorporation.gov.in/','http://www.tnurbantree.tn.gov.in/salem/',NULL,NULL,60,'831038',2008,'Salem City Municipal Corporation is known as the Steel City of Tamil Nadu due to the Salem Steel Plant. It is also famous for mango production and silk weaving.';
EXEC sp_UpsertLocalBody 'Tirunelveli Municipal Corporation','Municipal Corporation','Tirunelveli','Tamil Nadu','627001','Corporation Building, Tirunelveli - 627001','0462-2333000',NULL,'https://www.tirunelvelicorporation.gov.in/','http://www.tnurbantree.tn.gov.in/tirunelveli/',NULL,NULL,55,'474838',1994,'Tirunelveli City Municipal Corporation governs the southern city famous for Halwa and the Nellaiappar Temple. Located on the banks of the Tamiraparani river.';
EXEC sp_UpsertLocalBody 'Tiruppur Municipal Corporation','Municipal Corporation','Tiruppur','Tamil Nadu','641604','Corporation Building, Tiruppur - 641604','0421-2200000',NULL,'https://www.tirupurcorporation.gov.in/','http://www.tnurbantree.tn.gov.in/tirupur/',NULL,NULL,55,'877778',2008,'Tiruppur City Municipal Corporation is known as the Knitwear Capital of India. It contributes significantly to India''s textile exports and is one of the fastest growing cities in the country.';
EXEC sp_UpsertLocalBody 'Erode Municipal Corporation','Municipal Corporation','Erode','Tamil Nadu','638001','Gandhi Road, Erode - 638001','0424-2241040',NULL,'https://www.erodecorporation.tn.gov.in/','http://www.tnurbantree.tn.gov.in/erode/',NULL,NULL,60,'214000',2008,'Erode City Municipal Corporation is known as the Textile City and Turmeric City of India. Situated on the banks of the Cauvery and Bhavani rivers it is a major hub for cotton and turmeric trade in South India.';
EXEC sp_UpsertLocalBody 'Vellore Municipal Corporation','Municipal Corporation','Vellore','Tamil Nadu','632001','Corporation Office, Vellore - 632001','0416-2225000',NULL,'https://www.velloresmartcity.in/','http://www.tnurbantree.tn.gov.in/vellore/',NULL,NULL,60,'423425',2011,'Vellore City Municipal Corporation governs the historic city known for the Vellore Fort, Jalakandeswarar Temple, and CMC Hospital.';
EXEC sp_UpsertLocalBody 'Thoothukudi Municipal Corporation','Municipal Corporation','Thoothukudi','Tamil Nadu','628001','Corporation Office, Thoothukudi - 628001','0461-2322000',NULL,NULL,'http://www.tnurbantree.tn.gov.in/thoothukudi/',NULL,NULL,48,'237065',2011,'Thoothukudi (Tuticorin) Municipal Corporation governs the major port city of southern Tamil Nadu known for pearl fishing, salt production, and V.O. Chidambaranar Port.';
EXEC sp_UpsertLocalBody 'Dindigul Municipal Corporation','Municipal Corporation','Dindigul','Tamil Nadu','624001','Corporation Building, Dindigul - 624001','0451-2431000',NULL,NULL,'http://www.tnurbantree.tn.gov.in/dindigul/',NULL,NULL,48,'196936',2021,'Dindigul Municipal Corporation governs the city known for its rock fort and the famous Dindigul Lock industry. Also famous for biryani and leather goods.';
EXEC sp_UpsertLocalBody 'Thanjavur Municipal Corporation','Municipal Corporation','Thanjavur','Tamil Nadu','613001','Corporation Building, Thanjavur - 613001','04362-250000',NULL,NULL,'http://www.tnurbantree.tn.gov.in/thanjavur/',NULL,NULL,48,'222943',2021,'Thanjavur Municipal Corporation governs the cultural capital of Tamil Nadu. Known as the Rice Bowl of Tamil Nadu and home to the UNESCO World Heritage Site Brihadeeswara Temple.';
EXEC sp_UpsertLocalBody 'Ranipet Municipal Corporation','Municipal Corporation','Ranipet','Tamil Nadu','632401','Corporation Building, Ranipet - 632401','04172-250000',NULL,NULL,'http://www.tnurbantree.tn.gov.in/ranipet/',NULL,NULL,48,'175214',2021,'Ranipet Municipal Corporation is a major industrial city known for its leather processing industry and one of the leading leather goods manufacturing centres in India.';
EXEC sp_UpsertLocalBody 'Nagercoil Municipal Corporation','Municipal Corporation','Kanyakumari','Tamil Nadu','629001','Corporation Building, Nagercoil - 629001','04652-225000',NULL,NULL,'http://www.tnurbantree.tn.gov.in/nagercoil/',NULL,NULL,48,'224129',2011,'Nagercoil Municipal Corporation governs the southernmost corporation city in India near the tip of the Indian subcontinent. Known for the Nagaraja temple and beautiful coastal landscapes.';
EXEC sp_UpsertLocalBody 'Hosur Municipal Corporation','Municipal Corporation','Krishnagiri','Tamil Nadu','635109','Corporation Building, Hosur - 635109','04344-260000',NULL,NULL,'http://www.tnurbantree.tn.gov.in/hosur/',NULL,NULL,48,'129161',2021,'Hosur Municipal Corporation is the industrial twin city of Bengaluru. It hosts major industries including TATA Electronics, TVS Motor, and Biocon and is one of the fastest growing cities in Tamil Nadu.';
EXEC sp_UpsertLocalBody 'Avadi Municipal Corporation','Municipal Corporation','Tiruvallur','Tamil Nadu','600054','Corporation Building, Avadi - 600054','044-26384536',NULL,NULL,'http://www.tnurbantree.tn.gov.in/avadi/',NULL,NULL,48,'345996',2021,'Avadi Municipal Corporation is located near Chennai and is known for the Heavy Vehicles Factory (HVF) and CVRDE. It is an important industrial and defence hub near Chennai.';
EXEC sp_UpsertLocalBody 'Tambaram Municipal Corporation','Municipal Corporation','Chengalpattu','Tamil Nadu','600045','Corporation Building, Tambaram - 600045','044-22260000',NULL,NULL,'http://www.tnurbantree.tn.gov.in/tambaram/',NULL,NULL,48,'424997',2021,'Tambaram Municipal Corporation is a satellite city of Chennai. It is a major residential hub and is home to a major Indian Air Force base and railway junction.';

-- ── Erode District — Municipalities ──────────────────────────────────────────
EXEC sp_UpsertLocalBody 'Bhavani Municipality','Municipality','Erode','Tamil Nadu','638301','Municipal Office, Mettur Road, Bhavani - 638301','04256-222055',NULL,'http://www.tnurbantree.tn.gov.in/bhavani/','http://www.tnurbantree.tn.gov.in/bhavani/',NULL,NULL,30,'62000',NULL,'Bhavani Municipality is situated at the sacred confluence of the rivers Cauvery and Bhavani in Erode district. Known for the Bhavani Sangamam and the ancient Sangameswarar Temple.';
EXEC sp_UpsertLocalBody 'Gobichettipalayam Municipality','Municipality','Erode','Tamil Nadu','638452','Municipal Office, Salem Road, Gobichettipalayam - 638452','04285-222344',NULL,'http://www.tnurbantree.tn.gov.in/gobichettipalayam/','http://www.tnurbantree.tn.gov.in/gobichettipalayam/',NULL,NULL,30,'70000',NULL,'Gobichettipalayam (Gobi) Municipality is located near the Karnataka border. Known for cotton trade, sugarcane cultivation, and a major railway junction. Gateway to Sathyamangalam Tiger Reserve.';
EXEC sp_UpsertLocalBody 'Sathyamangalam Municipality','Municipality','Erode','Tamil Nadu','638401','Municipal Office, Sathyamangalam - 638401','04295-220055',NULL,'http://www.tnurbantree.tn.gov.in/sathyamangalam/','http://www.tnurbantree.tn.gov.in/sathyamangalam/',NULL,NULL,24,'57000',NULL,'Sathyamangalam Municipality is the gateway to the Sathyamangalam Tiger Reserve. The town is surrounded by the Nilgiris Biosphere Reserve and is known for eco-tourism.';
EXEC sp_UpsertLocalBody 'Perundurai Municipality','Municipality','Erode','Tamil Nadu','638052','Municipal Office, Perundurai - 638052','04294-220055',NULL,'http://www.tnurbantree.tn.gov.in/perundurai/','http://www.tnurbantree.tn.gov.in/perundurai/',NULL,NULL,24,'52000',NULL,'Perundurai Municipality is an industrial hub in Erode district. It hosts the SIPCOT Industrial Estate and is known for textile manufacturing, power looms, and engineering industries.';

-- ── Erode District — Town Panchayats ─────────────────────────────────────────
EXEC sp_UpsertLocalBody 'Anthiyur Town Panchayat','Town Panchayat','Erode','Tamil Nadu','638501','Town Panchayat Office, Anthiyur - 638501','04259-242055',NULL,'http://www.tnurbantree.tn.gov.in/anthiyur/','http://www.tnurbantree.tn.gov.in/anthiyur/',NULL,NULL,15,'32000',NULL,'Anthiyur Town Panchayat is located near the Karnataka border. Surrounded by the Sathyamangalam forest and known for cotton cultivation. The Kaveri river flows nearby.';
EXEC sp_UpsertLocalBody 'Nambiyur Town Panchayat','Town Panchayat','Erode','Tamil Nadu','638458','Town Panchayat Office, Nambiyur - 638458','04285-250055',NULL,'http://www.tnurbantree.tn.gov.in/nambiyur/','http://www.tnurbantree.tn.gov.in/nambiyur/',NULL,NULL,12,'18000',NULL,'Nambiyur Town Panchayat is a small agricultural town in Gobichettipalayam taluk known for sugarcane and cotton farming.';
EXEC sp_UpsertLocalBody 'Kodumudi Town Panchayat','Town Panchayat','Erode','Tamil Nadu','638151','Town Panchayat Office, Kodumudi - 638151','04204-230055',NULL,'http://www.tnurbantree.tn.gov.in/kodumudi/','http://www.tnurbantree.tn.gov.in/kodumudi/',NULL,NULL,15,'22000',NULL,'Kodumudi Town Panchayat is known for the famous Muruganathaswamy Temple on a natural island in the Cauvery river. A major pilgrimage site especially during Panguni Uthiram.';
EXEC sp_UpsertLocalBody 'Kavindapadi Town Panchayat','Town Panchayat','Erode','Tamil Nadu','638455','Town Panchayat Office, Kavindapadi - 638455','04285-257055',NULL,'http://www.tnurbantree.tn.gov.in/kavindapadi/','http://www.tnurbantree.tn.gov.in/kavindapadi/',NULL,NULL,12,'16000',NULL,'Kavindapadi Town Panchayat is in the sugarcane belt of Gobichettipalayam taluk, Erode district. Connected to Gobichettipalayam via NH-544.';
EXEC sp_UpsertLocalBody 'Thindal Town Panchayat','Town Panchayat','Erode','Tamil Nadu','638012','Town Panchayat Office, Thindal - 638012','0424-2556055',NULL,'http://www.tnurbantree.tn.gov.in/thindal/','http://www.tnurbantree.tn.gov.in/thindal/',NULL,NULL,12,'28000',NULL,'Thindal Town Panchayat is on the outskirts of Erode city. Known for the historic Muruganar Temple at Thindal. A growing residential suburb of Erode.';
EXEC sp_UpsertLocalBody 'Veerappanchatram Town Panchayat','Town Panchayat','Erode','Tamil Nadu','638004','Town Panchayat Office, Veerappanchatram - 638004','0424-2268055',NULL,'http://www.tnurbantree.tn.gov.in/veerappanchatram/','http://www.tnurbantree.tn.gov.in/veerappanchatram/',NULL,NULL,12,'24000',NULL,'Veerappanchatram Town Panchayat is a textile town near Erode city known for weaving and dyeing industries. Part of the greater Erode textile belt.';
EXEC sp_UpsertLocalBody 'Sivagiri Town Panchayat','Town Panchayat','Erode','Tamil Nadu','638109','Town Panchayat Office, Sivagiri - 638109','04294-261055',NULL,'http://www.tnurbantree.tn.gov.in/sivagiri/','http://www.tnurbantree.tn.gov.in/sivagiri/',NULL,NULL,12,'19000',NULL,'Sivagiri Town Panchayat is in Perundurai taluk known for handloom weaving and agricultural activities near the SIPCOT industrial area.';
EXEC sp_UpsertLocalBody 'Modakkurichi Town Panchayat','Town Panchayat','Erode','Tamil Nadu','638104','Town Panchayat Office, Modakkurichi - 638104','0424-2480055',NULL,'http://www.tnurbantree.tn.gov.in/modakkurichi/','http://www.tnurbantree.tn.gov.in/modakkurichi/',NULL,NULL,12,'26000',NULL,'Modakkurichi Town Panchayat is a residential and commercial suburb of Erode known for coconut and groundnut farming. Well connected via NH 544.';
EXEC sp_UpsertLocalBody 'Vellakoil Town Panchayat','Town Panchayat','Erode','Tamil Nadu','638111','Town Panchayat Office, Vellakoil - 638111','04294-224055',NULL,'http://www.tnurbantree.tn.gov.in/vellakoil/','http://www.tnurbantree.tn.gov.in/vellakoil/',NULL,NULL,12,'21000',NULL,'Vellakoil Town Panchayat is a growing town in Perundurai taluk known for handloom and textile activities.';
EXEC sp_UpsertLocalBody 'Thalavadi Town Panchayat','Town Panchayat','Erode','Tamil Nadu','638461','Town Panchayat Office, Thalavadi - 638461','04259-245055',NULL,'http://www.tnurbantree.tn.gov.in/thalavadi/','http://www.tnurbantree.tn.gov.in/thalavadi/',NULL,NULL,12,'12000',NULL,'Thalavadi Town Panchayat is a hill town bordering Karnataka. Part of the Sathyamangalam Tiger Reserve buffer zone and home to tribal communities. Known for coffee and spice cultivation.';
EXEC sp_UpsertLocalBody 'Bhavani Sagar Town Panchayat','Town Panchayat','Erode','Tamil Nadu','638452','Town Panchayat Office, Bhavani Sagar - 638452','04285-256055',NULL,'http://www.tnurbantree.tn.gov.in/bhavanisagar/','http://www.tnurbantree.tn.gov.in/bhavanisagar/',NULL,NULL,12,'14000',NULL,'Bhavani Sagar Town Panchayat is near the famous Bhavani Sagar Dam, one of the longest earthen dams in Asia on the Bhavani river.';

-- ── Salem District — Municipalities ──────────────────────────────────────────
EXEC sp_UpsertLocalBody 'Attur Municipality','Municipality','Salem','Tamil Nadu','636102','Municipal Office, Bazaar Street, Attur - 636102','04282-262076',NULL,'http://www.tnurbantree.tn.gov.in/attur/','http://www.tnurbantree.tn.gov.in/attur/',NULL,NULL,24,'42000',NULL,'Attur Municipality is the headquarters of Attur taluk in Salem district. Known for paddy cultivation, trade, and the historic Krishnapuram Palace.';
EXEC sp_UpsertLocalBody 'Mettur Municipality','Municipality','Salem','Tamil Nadu','636401','Municipal Office, Mettur Dam Road, Mettur - 636401','04298-222046',NULL,'http://www.tnurbantree.tn.gov.in/mettur/','http://www.tnurbantree.tn.gov.in/mettur/',NULL,NULL,24,'48000',NULL,'Mettur Municipality is on the banks of the Cauvery river and is known for the famous Mettur Dam (Stanley Reservoir) one of the largest reservoirs in India with significant hydroelectric power generation.';
EXEC sp_UpsertLocalBody 'Omalur Municipality','Municipality','Salem','Tamil Nadu','636455','Municipal Office, Omalur - 636455','04290-222055',NULL,'http://www.tnurbantree.tn.gov.in/omalur/','http://www.tnurbantree.tn.gov.in/omalur/',NULL,NULL,24,'38000',NULL,'Omalur Municipality is an industrial town in Salem district known for the Omalur SIPCOT Industrial Estate and various engineering and manufacturing industries.';
EXEC sp_UpsertLocalBody 'Sankari Municipality','Municipality','Salem','Tamil Nadu','637301','Municipal Office, Sankaridrug Road, Sankari - 637301','04290-263055',NULL,'http://www.tnurbantree.tn.gov.in/sankari/','http://www.tnurbantree.tn.gov.in/sankari/',NULL,NULL,24,'40000',NULL,'Sankari (Sankaridrug) Municipality is in Salem district near the Erode border. Known for the Sankaridrug Fort, handloom silk weaving, and cotton textiles.';
EXEC sp_UpsertLocalBody 'Sankagiri Municipality','Municipality','Salem','Tamil Nadu','637301','Municipal Office, Sankagiri - 637301','04281-260055',NULL,'http://www.tnurbantree.tn.gov.in/sankagiri/','http://www.tnurbantree.tn.gov.in/sankagiri/',NULL,NULL,18,'35000',NULL,'Sankagiri Municipality is a Grade III municipality in Salem district Tamil Nadu. The town is famous for the historic Sankagiri Fort which was an important fortress during the Vijayanagara Empire and later held by Hyder Ali and Tipu Sultan. Also known for handloom silk weaving and cotton textiles.';
EXEC sp_UpsertLocalBody 'Edappadi Municipality','Municipality','Salem','Tamil Nadu','637101','Municipal Office, Edappadi - 637101','04262-265055',NULL,'http://www.tnurbantree.tn.gov.in/idappadi/','http://www.tnurbantree.tn.gov.in/idappadi/',NULL,NULL,24,'38000',NULL,'Edappadi (Idappadi) Municipality is in Salem district known for mango orchards, silk weaving, and its association with former Tamil Nadu Chief Minister Edappadi K. Palaniswami.';
EXEC sp_UpsertLocalBody 'Gangavalli Municipality','Municipality','Salem','Tamil Nadu','636105','Municipal Office, Gangavalli - 636105','04282-275055',NULL,'http://www.tnurbantree.tn.gov.in/gangavalli/','http://www.tnurbantree.tn.gov.in/gangavalli/',NULL,NULL,18,'28000',NULL,'Gangavalli Municipality is in Salem district known for paddy cultivation and trade. Has a weekly market serving surrounding villages and agricultural belt.';
EXEC sp_UpsertLocalBody 'Tiruchengode Municipality','Municipality','Namakkal','Tamil Nadu','637211','Municipal Office, Tiruchengode - 637211','04288-252055',NULL,'http://www.tnurbantree.tn.gov.in/tiruchengode/','http://www.tnurbantree.tn.gov.in/tiruchengode/',NULL,NULL,30,'82000',NULL,'Tiruchengode Municipality is in Namakkal district and is the world largest manufacturer of lorry bodies. Also known for the Ardhanareeswarar Temple atop a rocky hill.';

-- ── Salem District — Town Panchayats ─────────────────────────────────────────
EXEC sp_UpsertLocalBody 'Yercaud Town Panchayat','Town Panchayat','Salem','Tamil Nadu','636601','Town Panchayat Office, Yercaud - 636601','04281-222055',NULL,'http://www.tnurbantree.tn.gov.in/yercaud/','http://www.tnurbantree.tn.gov.in/yercaud/',NULL,NULL,12,'15000',NULL,'Yercaud Town Panchayat is a scenic hill station in the Shevaroy Hills at 1515 metres. Known as the Poor Man''s Ooty it is famous for coffee cultivation, rose gardens, and the annual summer festival.';
EXEC sp_UpsertLocalBody 'Valapady Town Panchayat','Town Panchayat','Salem','Tamil Nadu','637103','Town Panchayat Office, Valapady - 637103','04262-261055',NULL,'http://www.tnurbantree.tn.gov.in/valapady/','http://www.tnurbantree.tn.gov.in/valapady/',NULL,NULL,12,'18000',NULL,'Valapady Town Panchayat is near Edappadi in Salem district. Known for mango orchards and agricultural produce in the Salem-Erode corridor.';
EXEC sp_UpsertLocalBody 'Nangavalli Town Panchayat','Town Panchayat','Salem','Tamil Nadu','636102','Town Panchayat Office, Nangavalli - 636102','04282-276055',NULL,'http://www.tnurbantree.tn.gov.in/nangavalli/','http://www.tnurbantree.tn.gov.in/nangavalli/',NULL,NULL,12,'14000',NULL,'Nangavalli Town Panchayat is in the Attur taluk area of Salem district primarily known for paddy and mango cultivation.';
EXEC sp_UpsertLocalBody 'Thalaivasal Town Panchayat','Town Panchayat','Salem','Tamil Nadu','636117','Town Panchayat Office, Thalaivasal - 636117','04282-285055',NULL,'http://www.tnurbantree.tn.gov.in/thalaivasal/','http://www.tnurbantree.tn.gov.in/thalaivasal/',NULL,NULL,12,'16000',NULL,'Thalaivasal Town Panchayat is in Salem district known for sericulture (silk cultivation) and agricultural activities.';
EXEC sp_UpsertLocalBody 'Konganapuram Town Panchayat','Town Panchayat','Salem','Tamil Nadu','637408','Town Panchayat Office, Konganapuram - 637408','04264-262055',NULL,'http://www.tnurbantree.tn.gov.in/konganapuram/','http://www.tnurbantree.tn.gov.in/konganapuram/',NULL,NULL,12,'19000',NULL,'Konganapuram Town Panchayat is on the Salem-Coimbatore highway corridor known for weaving industries and agricultural trade.';
EXEC sp_UpsertLocalBody 'Panamarathupatti Town Panchayat','Town Panchayat','Salem','Tamil Nadu','637020','Town Panchayat Office, Panamarathupatti - 637020','0427-2473055',NULL,'http://www.tnurbantree.tn.gov.in/panamarathupatti/','http://www.tnurbantree.tn.gov.in/panamarathupatti/',NULL,NULL,12,'22000',NULL,'Panamarathupatti Town Panchayat is on the outskirts of Salem city. One of the faster growing suburban towns known for textile and small-scale industries.';
EXEC sp_UpsertLocalBody 'Malliyakarai Town Panchayat','Town Panchayat','Salem','Tamil Nadu','636115','Town Panchayat Office, Malliyakarai - 636115','04282-277055',NULL,'http://www.tnurbantree.tn.gov.in/malliyakarai/','http://www.tnurbantree.tn.gov.in/malliyakarai/',NULL,NULL,12,'13000',NULL,'Malliyakarai Town Panchayat is in Attur taluk of Salem district. Known for paddy cultivation and traditional crafts with a weekly market serving surrounding villages.';

PRINT 'LocalBodies seed data completed. Total rows: ' + CAST((SELECT COUNT(*) FROM dbo.LocalBodies) AS VARCHAR);
GO
