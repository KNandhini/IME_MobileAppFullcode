-- =============================================================================
-- 07_MunicipalMapProcedures.sql
-- Tables: Countries, States, Districts, MunicipalCorps
-- Stored procs: sp_GetCountries, sp_GetStatesByCountry, sp_GetDistricts,
--               sp_GetMunicipalCorps, sp_GetMunicipalCorpById,
--               sp_GetMunicipalCorpsByState
-- Seed: India + all 36 states/UTs + Tamil Nadu districts + major districts
--       for other key states
-- =============================================================================

-- ─── Tables ───────────────────────────────────────────────────────────────────

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Countries')
BEGIN
    CREATE TABLE Countries (
        CountryId   INT IDENTITY(1,1) PRIMARY KEY,
        CountryName NVARCHAR(100) NOT NULL,
        IsActive    BIT NOT NULL DEFAULT 1
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'States')
BEGIN
    CREATE TABLE States (
        StateId     INT IDENTITY(1,1) PRIMARY KEY,
        StateName   NVARCHAR(100) NOT NULL,
        CountryId   INT NOT NULL REFERENCES Countries(CountryId),
        Latitude    DECIMAL(9,6) NULL,
        Longitude   DECIMAL(9,6) NULL,
        IsActive    BIT NOT NULL DEFAULT 1
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Districts')
BEGIN
    CREATE TABLE Districts (
        DistrictId   INT IDENTITY(1,1) PRIMARY KEY,
        DistrictName NVARCHAR(100) NOT NULL,
        StateId      INT NOT NULL REFERENCES States(StateId),
        Latitude     DECIMAL(9,6) NULL,
        Longitude    DECIMAL(9,6) NULL,
        IsActive     BIT NOT NULL DEFAULT 1
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MunicipalCorps')
BEGIN
    CREATE TABLE MunicipalCorps (
        CorpId          INT IDENTITY(1,1) PRIMARY KEY,
        CorpName        NVARCHAR(200) NOT NULL,
        CorpCode        NVARCHAR(50)  NULL,
        DistrictId      INT NOT NULL REFERENCES Districts(DistrictId),
        Address         NVARCHAR(500) NULL,
        ContactNumber   NVARCHAR(50)  NULL,
        Email           NVARCHAR(200) NULL,
        Website         NVARCHAR(200) NULL,
        EstablishedYear INT           NULL,
        WardCount       INT           NULL,
        MayorName       NVARCHAR(200) NULL,
        Population      NVARCHAR(50)  NULL,
        Area            NVARCHAR(50)  NULL,
        IsActive        BIT NOT NULL DEFAULT 1,
        CreatedDate     DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO

-- ─── Stored Procedures ────────────────────────────────────────────────────────

CREATE OR ALTER PROCEDURE sp_GetCountries
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CountryId, CountryName FROM Countries WHERE IsActive = 1 ORDER BY CountryName;
END
GO

CREATE OR ALTER PROCEDURE sp_GetStatesByCountry
    @CountryId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT StateId, StateName, CountryId, Latitude, Longitude
    FROM   States
    WHERE  CountryId = @CountryId AND IsActive = 1
    ORDER  BY StateName;
END
GO

CREATE OR ALTER PROCEDURE sp_GetDistricts
    @StateId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DistrictId, DistrictName, StateId, Latitude, Longitude
    FROM   Districts
    WHERE  StateId = @StateId AND IsActive = 1
    ORDER  BY DistrictName;
END
GO

CREATE OR ALTER PROCEDURE sp_GetMunicipalCorps
    @DistrictId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        mc.CorpId, mc.CorpName, mc.CorpCode,
        mc.DistrictId, d.DistrictName,
        d.StateId,    s.StateName,
        s.CountryId,  c.CountryName,
        mc.Address, mc.ContactNumber, mc.Email, mc.Website,
        mc.EstablishedYear, mc.WardCount, mc.MayorName,
        mc.Population, mc.Area, mc.IsActive
    FROM   MunicipalCorps mc
    JOIN   Districts d ON mc.DistrictId = d.DistrictId
    JOIN   States    s ON d.StateId     = s.StateId
    JOIN   Countries c ON s.CountryId   = c.CountryId
    WHERE  mc.DistrictId = @DistrictId AND mc.IsActive = 1
    ORDER  BY mc.CorpName;
END
GO

CREATE OR ALTER PROCEDURE sp_GetMunicipalCorpById
    @CorpId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        mc.CorpId, mc.CorpName, mc.CorpCode,
        mc.DistrictId, d.DistrictName,
        d.StateId,    s.StateName,
        s.CountryId,  c.CountryName,
        mc.Address, mc.ContactNumber, mc.Email, mc.Website,
        mc.EstablishedYear, mc.WardCount, mc.MayorName,
        mc.Population, mc.Area, mc.IsActive
    FROM   MunicipalCorps mc
    JOIN   Districts d ON mc.DistrictId = d.DistrictId
    JOIN   States    s ON d.StateId     = s.StateId
    JOIN   Countries c ON s.CountryId   = c.CountryId
    WHERE  mc.CorpId = @CorpId;
END
GO

CREATE OR ALTER PROCEDURE sp_GetMunicipalCorpsByState
    @StateId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        mc.CorpId, mc.CorpName, mc.CorpCode,
        mc.DistrictId, d.DistrictName,
        d.StateId,    s.StateName,
        s.CountryId,  c.CountryName,
        mc.Address, mc.ContactNumber, mc.Email, mc.Website,
        mc.EstablishedYear, mc.WardCount, mc.MayorName,
        mc.Population, mc.Area, mc.IsActive
    FROM   MunicipalCorps mc
    JOIN   Districts d ON mc.DistrictId = d.DistrictId
    JOIN   States    s ON d.StateId     = s.StateId
    JOIN   Countries c ON s.CountryId   = c.CountryId
    WHERE  d.StateId = @StateId AND mc.IsActive = 1
    ORDER  BY d.DistrictName, mc.CorpName;
END
GO

-- ─── Seed Data ────────────────────────────────────────────────────────────────

-- Country: India
IF NOT EXISTS (SELECT 1 FROM Countries WHERE CountryName = 'India')
BEGIN
    INSERT INTO Countries (CountryName) VALUES ('India');
END
GO

-- States / Union Territories of India
-- (safe to re-run — only inserts missing rows)
DECLARE @IndiaId INT = (SELECT CountryId FROM Countries WHERE CountryName = 'India');

INSERT INTO States (StateName, CountryId, Latitude, Longitude)
SELECT v.StateName, @IndiaId, v.Lat, v.Lng
FROM (VALUES
    ('Andhra Pradesh',                        15.9129,  79.7400),
    ('Arunachal Pradesh',                     28.2180,  94.7278),
    ('Assam',                                 26.2006,  92.9376),
    ('Bihar',                                 25.0961,  85.3131),
    ('Chhattisgarh',                          21.2787,  81.8661),
    ('Goa',                                   15.2993,  74.1240),
    ('Gujarat',                               22.2587,  71.1924),
    ('Haryana',                               29.0588,  76.0856),
    ('Himachal Pradesh',                      31.1048,  77.1734),
    ('Jharkhand',                             23.6102,  85.2799),
    ('Karnataka',                             15.3173,  75.7139),
    ('Kerala',                                10.8505,  76.2711),
    ('Madhya Pradesh',                        22.9734,  78.6569),
    ('Maharashtra',                           19.7515,  75.7139),
    ('Manipur',                               24.6637,  93.9063),
    ('Meghalaya',                             25.4670,  91.3662),
    ('Mizoram',                               23.1645,  92.9376),
    ('Nagaland',                              26.1584,  94.5624),
    ('Odisha',                                20.9517,  85.0985),
    ('Punjab',                                31.1471,  75.3412),
    ('Rajasthan',                             27.0238,  74.2179),
    ('Sikkim',                                27.5330,  88.5122),
    ('Tamil Nadu',                            11.1271,  78.6569),
    ('Telangana',                             18.1124,  79.0193),
    ('Tripura',                               23.9408,  91.9882),
    ('Uttar Pradesh',                         26.8467,  80.9462),
    ('Uttarakhand',                           30.0668,  79.0193),
    ('West Bengal',                           22.9868,  87.8550),
    ('Andaman and Nicobar Islands',           11.7401,  92.6586),
    ('Chandigarh',                            30.7333,  76.7794),
    ('Dadra and Nagar Haveli and Daman and Diu', 20.1809, 73.0169),
    ('Delhi',                                 28.7041,  77.1025),
    ('Jammu and Kashmir',                     33.7782,  76.5762),
    ('Ladakh',                                34.1526,  77.5770),
    ('Lakshadweep',                           10.5667,  72.6417),
    ('Puducherry',                            11.9416,  79.8083)
) AS v(StateName, Lat, Lng)
WHERE NOT EXISTS (
    SELECT 1 FROM States WHERE StateName = v.StateName AND CountryId = @IndiaId
);
GO

-- ─── Districts ────────────────────────────────────────────────────────────────

-- Tamil Nadu — all 38 districts
DECLARE @TN INT = (SELECT StateId FROM States WHERE StateName = 'Tamil Nadu');
INSERT INTO Districts (DistrictName, StateId, Latitude, Longitude)
SELECT v.Name, @TN, v.Lat, v.Lng
FROM (VALUES
    ('Ariyalur',        11.1404, 79.0788),
    ('Chengalpattu',    12.6921, 79.9725),
    ('Chennai',         13.0827, 80.2707),
    ('Coimbatore',      11.0168, 76.9558),
    ('Cuddalore',       11.7480, 79.7680),
    ('Dharmapuri',      12.1277, 78.1581),
    ('Dindigul',        10.3673, 77.9803),
    ('Erode',           11.3410, 77.7172),
    ('Kallakurichi',    11.7382, 78.9604),
    ('Kancheepuram',    12.8308, 79.7082),
    ('Kanyakumari',      8.0883, 77.5385),
    ('Karur',           10.9601, 78.0766),
    ('Krishnagiri',     12.5186, 78.2137),
    ('Madurai',          9.9252, 78.1198),
    ('Mayiladuthurai',  11.1038, 79.6529),
    ('Nagapattinam',    10.7672, 79.8449),
    ('Namakkal',        11.2199, 78.1670),
    ('Nilgiris',        11.4102, 76.6950),
    ('Perambalur',      11.2335, 78.8818),
    ('Pudukkottai',     10.3833, 78.8001),
    ('Ramanathapuram',   9.3639, 78.8395),
    ('Ranipet',         12.9314, 79.3319),
    ('Salem',           11.6643, 78.1460),
    ('Sivaganga',        9.8475, 78.4814),
    ('Tenkasi',          8.9599, 77.3156),
    ('Thanjavur',       10.7870, 79.1378),
    ('Theni',           10.0104, 77.4770),
    ('Thoothukudi',      8.7642, 78.1348),
    ('Tiruchirappalli', 10.7905, 78.7047),
    ('Tirunelveli',      8.7139, 77.7567),
    ('Tirupathur',      12.4963, 78.5668),
    ('Tiruppur',        11.1085, 77.3411),
    ('Tiruvallur',      13.1427, 79.9081),
    ('Tiruvannamalai',  12.2253, 79.0747),
    ('Tiruvarur',       10.7724, 79.6330),
    ('Vellore',         12.9165, 79.1325),
    ('Villupuram',      11.9397, 79.4937),
    ('Virudhunagar',     9.5851, 77.9619)
) AS v(Name, Lat, Lng)
WHERE NOT EXISTS (
    SELECT 1 FROM Districts WHERE DistrictName = v.Name AND StateId = @TN
);
GO

-- Kerala — all 14 districts
DECLARE @KL INT = (SELECT StateId FROM States WHERE StateName = 'Kerala');
INSERT INTO Districts (DistrictName, StateId, Latitude, Longitude)
SELECT v.Name, @KL, v.Lat, v.Lng
FROM (VALUES
    ('Alappuzha',    9.4981,  76.3388),
    ('Ernakulam',   10.0159,  76.3419),
    ('Idukki',       9.9189,  77.1025),
    ('Kannur',      11.8745,  75.3704),
    ('Kasaragod',   12.4996,  74.9869),
    ('Kollam',       8.8932,  76.6141),
    ('Kottayam',     9.5916,  76.5222),
    ('Kozhikode',   11.2588,  75.7804),
    ('Malappuram',  11.0510,  76.0710),
    ('Palakkad',    10.7867,  76.6548),
    ('Pathanamthitta', 9.2648, 76.7870),
    ('Thiruvananthapuram', 8.5241, 76.9366),
    ('Thrissur',    10.5276,  76.2144),
    ('Wayanad',     11.6854,  76.1320)
) AS v(Name, Lat, Lng)
WHERE NOT EXISTS (
    SELECT 1 FROM Districts WHERE DistrictName = v.Name AND StateId = @KL
);
GO

-- Karnataka — all 31 districts
DECLARE @KA INT = (SELECT StateId FROM States WHERE StateName = 'Karnataka');
INSERT INTO Districts (DistrictName, StateId, Latitude, Longitude)
SELECT v.Name, @KA, v.Lat, v.Lng
FROM (VALUES
    ('Bagalkot',        16.1691, 75.6979),
    ('Ballari',         15.1394, 76.9214),
    ('Belagavi',        15.8497, 74.4977),
    ('Bengaluru Rural', 13.0827, 77.5877),
    ('Bengaluru Urban', 12.9716, 77.5946),
    ('Bidar',           17.9104, 77.5199),
    ('Chamarajanagar',  11.9265, 76.9437),
    ('Chikkaballapura', 13.4355, 77.7280),
    ('Chikkamagaluru',  13.3161, 75.7720),
    ('Chitradurga',     14.2251, 76.3980),
    ('Dakshina Kannada',12.8438, 74.9900),
    ('Davanagere',      14.4644, 75.9218),
    ('Dharwad',         15.4589, 75.0078),
    ('Gadag',           15.4316, 75.6355),
    ('Hassan',          13.0068, 76.1003),
    ('Haveri',          14.7939, 75.3996),
    ('Kalaburagi',      17.3297, 76.8343),
    ('Kodagu',          12.3375, 75.8069),
    ('Kolar',           13.1360, 78.1294),
    ('Koppal',          15.3498, 76.1547),
    ('Mandya',          12.5218, 76.8952),
    ('Mysuru',          12.2958, 76.6394),
    ('Raichur',         16.2120, 77.3566),
    ('Ramanagara',      12.7161, 77.2820),
    ('Shivamogga',      13.9299, 75.5681),
    ('Tumakuru',        13.3409, 77.1010),
    ('Udupi',           13.3409, 74.7421),
    ('Uttara Kannada',  14.7941, 74.6840),
    ('Vijayapura',      16.8302, 75.7100),
    ('Vijayanagara',    15.1394, 76.9214),
    ('Yadgir',          16.7713, 77.1385)
) AS v(Name, Lat, Lng)
WHERE NOT EXISTS (
    SELECT 1 FROM Districts WHERE DistrictName = v.Name AND StateId = @KA
);
GO

-- Maharashtra — all 36 districts
DECLARE @MH INT = (SELECT StateId FROM States WHERE StateName = 'Maharashtra');
INSERT INTO Districts (DistrictName, StateId, Latitude, Longitude)
SELECT v.Name, @MH, v.Lat, v.Lng
FROM (VALUES
    ('Ahmednagar',   19.0952, 74.7495),
    ('Akola',        20.7002, 77.0082),
    ('Amravati',     20.9320, 77.7523),
    ('Aurangabad',   19.8762, 75.3433),
    ('Beed',         18.9891, 75.7601),
    ('Bhandara',     21.1667, 79.6500),
    ('Buldhana',     20.5292, 76.1842),
    ('Chandrapur',   19.9615, 79.2961),
    ('Dhule',        20.9042, 74.7749),
    ('Gadchiroli',   20.1809, 80.0000),
    ('Gondia',       21.4633, 80.1926),
    ('Hingoli',      19.7167, 77.1500),
    ('Jalgaon',      21.0077, 75.5626),
    ('Jalna',        19.8347, 75.8816),
    ('Kolhapur',     16.6950, 74.2430),
    ('Latur',        18.4088, 76.5604),
    ('Mumbai',       18.9667, 72.8333),
    ('Mumbai Suburban', 19.1000, 72.9000),
    ('Nagpur',       21.1458, 79.0882),
    ('Nanded',       19.1383, 77.3210),
    ('Nandurbar',    21.3682, 74.2432),
    ('Nashik',       19.9975, 73.7898),
    ('Osmanabad',    18.1813, 76.0412),
    ('Palghar',      19.6967, 72.7650),
    ('Parbhani',     19.2705, 76.7748),
    ('Pune',         18.5204, 73.8567),
    ('Raigad',       18.5158, 73.1792),
    ('Ratnagiri',    16.9944, 73.3000),
    ('Sangli',       16.8524, 74.5815),
    ('Satara',       17.6805, 73.9951),
    ('Sindhudurg',   16.3500, 73.7500),
    ('Solapur',      17.6599, 75.9064),
    ('Thane',        19.2183, 72.9781),
    ('Wardha',       20.7453, 78.6022),
    ('Washim',       20.1037, 77.1337),
    ('Yavatmal',     20.3888, 78.1204)
) AS v(Name, Lat, Lng)
WHERE NOT EXISTS (
    SELECT 1 FROM Districts WHERE DistrictName = v.Name AND StateId = @MH
);
GO

-- Andhra Pradesh — 26 districts
DECLARE @AP INT = (SELECT StateId FROM States WHERE StateName = 'Andhra Pradesh');
INSERT INTO Districts (DistrictName, StateId, Latitude, Longitude)
SELECT v.Name, @AP, v.Lat, v.Lng
FROM (VALUES
    ('Alluri Sitharama Raju', 17.8967, 82.0167),
    ('Anakapalli',            17.6910, 83.0046),
    ('Ananthapuramu',         14.6819, 77.6006),
    ('Annamayya',             13.8567, 78.8399),
    ('Bapatla',                15.9042, 80.4674),
    ('Chittoor',              13.2172, 79.1003),
    ('East Godavari',         17.3268, 81.8070),
    ('Eluru',                 16.7107, 81.0952),
    ('Guntur',                16.3067, 80.4365),
    ('Kakinada',              16.9891, 82.2475),
    ('Konaseema',             16.7986, 81.9042),
    ('Krishna',               16.6100, 80.7214),
    ('Kurnool',               15.8281, 78.0373),
    ('Nandyal',               15.4786, 78.4836),
    ('Nellore',               14.4426, 79.9865),
    ('NTR',                   16.5000, 80.6500),
    ('Palnadu',               16.5000, 79.8333),
    ('Parvathipuram Manyam',  18.7833, 83.4333),
    ('Prakasam',              15.3333, 79.5000),
    ('Sri Potti Sriramulu Nellore', 14.4426, 79.9865),
    ('Sri Sathya Sai',        13.8500, 77.8333),
    ('Srikakulam',            18.2982, 83.8975),
    ('Tirupati',              13.6288, 79.4192),
    ('Visakhapatnam',         17.6868, 83.2185),
    ('Vizianagaram',          18.1067, 83.3956),
    ('West Godavari',         16.9167, 81.3667)
) AS v(Name, Lat, Lng)
WHERE NOT EXISTS (
    SELECT 1 FROM Districts WHERE DistrictName = v.Name AND StateId = @AP
);
GO

-- Telangana — 33 districts
DECLARE @TG INT = (SELECT StateId FROM States WHERE StateName = 'Telangana');
INSERT INTO Districts (DistrictName, StateId, Latitude, Longitude)
SELECT v.Name, @TG, v.Lat, v.Lng
FROM (VALUES
    ('Adilabad',        19.6641, 78.5320),
    ('Bhadradri Kothagudem', 17.5500, 80.6167),
    ('Hanumakonda',     17.9784, 79.5941),
    ('Hyderabad',       17.3850, 78.4867),
    ('Jagtial',         18.7942, 78.9147),
    ('Jangaon',         17.7230, 79.1590),
    ('Jayashankar Bhupalpally', 18.4333, 79.9167),
    ('Jogulamba Gadwal', 16.2335, 77.8004),
    ('Kamareddy',       18.3219, 78.3340),
    ('Karimnagar',      18.4386, 79.1288),
    ('Khammam',         17.2473, 80.1514),
    ('Kumuram Bheem',   19.4000, 79.6667),
    ('Mahabubabad',     17.6000, 80.0000),
    ('Mahabubnagar',    16.7488, 77.9866),
    ('Mancherial',      18.8705, 79.4630),
    ('Medak',           18.0481, 78.2615),
    ('Medchal-Malkajgiri', 17.5200, 78.5800),
    ('Mulugu',          18.1833, 80.0500),
    ('Nagarkurnool',    16.4833, 78.3167),
    ('Nalgonda',        17.0575, 79.2671),
    ('Narayanpet',      16.7421, 77.4952),
    ('Nirmal',          19.0957, 78.3499),
    ('Nizamabad',       18.6725, 78.0941),
    ('Peddapalli',      18.6149, 79.3709),
    ('Rajanna Sircilla', 18.3846, 78.8319),
    ('Rangareddy',      17.3000, 78.2500),
    ('Sangareddy',      17.6234, 78.0869),
    ('Siddipet',        18.1024, 78.8522),
    ('Suryapet',        17.1432, 79.6220),
    ('Vikarabad',       17.3363, 77.9037),
    ('Wanaparthy',      16.3620, 78.0640),
    ('Warangal',        17.9784, 79.5941),
    ('Yadadri Bhuvanagiri', 17.5841, 79.1034)
) AS v(Name, Lat, Lng)
WHERE NOT EXISTS (
    SELECT 1 FROM Districts WHERE DistrictName = v.Name AND StateId = @TG
);
GO

-- Delhi — 11 districts
DECLARE @DL INT = (SELECT StateId FROM States WHERE StateName = 'Delhi');
INSERT INTO Districts (DistrictName, StateId, Latitude, Longitude)
SELECT v.Name, @DL, v.Lat, v.Lng
FROM (VALUES
    ('Central Delhi',        28.6508, 77.2163),
    ('East Delhi',           28.6608, 77.3084),
    ('New Delhi',            28.6139, 77.2090),
    ('North Delhi',          28.7200, 77.2100),
    ('North East Delhi',     28.6867, 77.2835),
    ('North West Delhi',     28.7281, 77.1338),
    ('Shahdara',             28.6736, 77.2946),
    ('South Delhi',          28.5244, 77.2066),
    ('South East Delhi',     28.5495, 77.2876),
    ('South West Delhi',     28.5800, 77.0700),
    ('West Delhi',           28.6561, 77.0999)
) AS v(Name, Lat, Lng)
WHERE NOT EXISTS (
    SELECT 1 FROM Districts WHERE DistrictName = v.Name AND StateId = @DL
);
GO

-- Gujarat — 33 districts
DECLARE @GJ INT = (SELECT StateId FROM States WHERE StateName = 'Gujarat');
INSERT INTO Districts (DistrictName, StateId, Latitude, Longitude)
SELECT v.Name, @GJ, v.Lat, v.Lng
FROM (VALUES
    ('Ahmedabad',    23.0225,  72.5714),
    ('Amreli',       21.6042,  71.2213),
    ('Anand',        22.5645,  72.9289),
    ('Aravalli',     23.7000,  73.0500),
    ('Banaskantha',  24.1782,  72.4226),
    ('Bharuch',      21.7051,  72.9959),
    ('Bhavnagar',    21.7645,  72.1519),
    ('Botad',        22.1692,  71.6673),
    ('Chhota Udaipur', 22.3035, 74.0181),
    ('Dahod',        22.8333,  74.2500),
    ('Dang',         20.7554,  73.6901),
    ('Devbhoomi Dwarka', 22.2394, 68.9678),
    ('Gandhinagar',  23.2156,  72.6369),
    ('Gir Somnath',  20.9170,  70.3674),
    ('Jamnagar',     22.4707,  70.0577),
    ('Junagadh',     21.5222,  70.4579),
    ('Kheda',        22.7500,  72.6833),
    ('Kutch',        23.7337,  69.8597),
    ('Mahisagar',    23.0800,  73.5900),
    ('Mehsana',      23.5879,  72.3693),
    ('Morbi',        22.8172,  70.8378),
    ('Narmada',      21.8718,  73.5000),
    ('Navsari',      20.9467,  72.9520),
    ('Panchmahal',   22.7500,  73.5167),
    ('Patan',        23.8493,  72.1266),
    ('Porbandar',    21.6425,  69.6293),
    ('Rajkot',       22.3039,  70.8022),
    ('Sabarkantha',  23.3667,  73.0167),
    ('Surat',        21.1702,  72.8311),
    ('Surendranagar',22.7275,  71.6471),
    ('Tapi',         21.1000,  73.4167),
    ('Vadodara',     22.3072,  73.1812),
    ('Valsad',       20.6080,  72.9263)
) AS v(Name, Lat, Lng)
WHERE NOT EXISTS (
    SELECT 1 FROM Districts WHERE DistrictName = v.Name AND StateId = @GJ
);
GO

-- Rajasthan — 33 districts
DECLARE @RJ INT = (SELECT StateId FROM States WHERE StateName = 'Rajasthan');
INSERT INTO Districts (DistrictName, StateId, Latitude, Longitude)
SELECT v.Name, @RJ, v.Lat, v.Lng
FROM (VALUES
    ('Ajmer',          26.4499,  74.6399),
    ('Alwar',          27.5635,  76.6246),
    ('Banswara',       23.5467,  74.4419),
    ('Baran',          25.1025,  76.5159),
    ('Barmer',         25.7451,  71.3927),
    ('Bharatpur',      27.2152,  77.5030),
    ('Bhilwara',       25.3518,  74.6348),
    ('Bikaner',        28.0229,  73.3119),
    ('Bundi',          25.4399,  75.6380),
    ('Chittorgarh',    24.8887,  74.6269),
    ('Churu',          28.2985,  74.9614),
    ('Dausa',          26.8942,  76.3339),
    ('Dholpur',        26.7025,  77.8893),
    ('Dungarpur',      23.8436,  73.7143),
    ('Hanumangarh',    29.5826,  74.3292),
    ('Jaipur',         26.9124,  75.7873),
    ('Jaisalmer',      26.9157,  70.9083),
    ('Jalore',         25.3462,  72.6153),
    ('Jhalawar',       24.5983,  76.1614),
    ('Jhunjhunu',      28.1320,  75.3994),
    ('Jodhpur',        26.2389,  73.0243),
    ('Karauli',        26.5096,  77.0236),
    ('Kota',           25.2138,  75.8648),
    ('Nagaur',         27.2030,  73.7356),
    ('Pali',           25.7711,  73.3237),
    ('Pratapgarh',     24.0321,  74.7789),
    ('Rajsamand',      25.0698,  73.8800),
    ('Sawai Madhopur', 26.0178,  76.3597),
    ('Sikar',          27.6094,  75.1399),
    ('Sirohi',         24.8877,  72.8611),
    ('Sri Ganganagar', 29.9175,  73.8757),
    ('Tonk',           26.1679,  75.7894),
    ('Udaipur',        24.5854,  73.7125)
) AS v(Name, Lat, Lng)
WHERE NOT EXISTS (
    SELECT 1 FROM Districts WHERE DistrictName = v.Name AND StateId = @RJ
);
GO

-- Uttar Pradesh — major districts (top 20)
DECLARE @UP INT = (SELECT StateId FROM States WHERE StateName = 'Uttar Pradesh');
INSERT INTO Districts (DistrictName, StateId, Latitude, Longitude)
SELECT v.Name, @UP, v.Lat, v.Lng
FROM (VALUES
    ('Agra',        27.1767,  78.0081),
    ('Aligarh',     27.8974,  78.0880),
    ('Allahabad',   25.4358,  81.8463),
    ('Azamgarh',    26.0718,  83.1861),
    ('Bareilly',    28.3670,  79.4304),
    ('Firozabad',   27.1592,  78.3957),
    ('Gautam Buddh Nagar', 28.5355, 77.3910),
    ('Ghaziabad',   28.6692,  77.4538),
    ('Gorakhpur',   26.7606,  83.3732),
    ('Jhansi',      25.4484,  78.5685),
    ('Kanpur Nagar',26.4499,  80.3319),
    ('Lucknow',     26.8467,  80.9462),
    ('Mathura',     27.4924,  77.6737),
    ('Meerut',      28.9845,  77.7064),
    ('Moradabad',   28.8388,  78.7768),
    ('Muzaffarnagar',29.4727, 77.7085),
    ('Prayagraj',   25.4358,  81.8463),
    ('Saharanpur',  29.9680,  77.5553),
    ('Varanasi',    25.3176,  82.9739),
    ('Vrindavan',   27.5800,  77.7000)
) AS v(Name, Lat, Lng)
WHERE NOT EXISTS (
    SELECT 1 FROM Districts WHERE DistrictName = v.Name AND StateId = @UP
);
GO

-- West Bengal — 23 districts
DECLARE @WB INT = (SELECT StateId FROM States WHERE StateName = 'West Bengal');
INSERT INTO Districts (DistrictName, StateId, Latitude, Longitude)
SELECT v.Name, @WB, v.Lat, v.Lng
FROM (VALUES
    ('Alipurduar',       26.4837, 89.5267),
    ('Bankura',          23.2324, 87.0756),
    ('Birbhum',          23.9000, 87.5333),
    ('Cooch Behar',      26.3200, 89.4500),
    ('Dakshin Dinajpur', 25.6232, 88.7776),
    ('Darjeeling',       27.0360, 88.2627),
    ('Hooghly',          22.9000, 88.3833),
    ('Howrah',           22.5958, 88.2636),
    ('Jalpaiguri',       26.5167, 88.7333),
    ('Jhargram',         22.4536, 86.9942),
    ('Kalimpong',        27.0600, 88.4700),
    ('Kolkata',          22.5726, 88.3639),
    ('Malda',            25.0108, 88.1407),
    ('Murshidabad',      24.1830, 88.2637),
    ('Nadia',            23.4733, 88.5590),
    ('North 24 Parganas',22.8456, 88.5278),
    ('Paschim Bardhaman',23.2324, 87.0756),
    ('Paschim Medinipur',22.4265, 87.3199),
    ('Purba Bardhaman',  23.2600, 87.8700),
    ('Purba Medinipur',  22.1800, 87.7800),
    ('Purulia',          23.3350, 86.3650),
    ('South 24 Parganas',22.0500, 88.6000),
    ('Uttar Dinajpur',   26.0000, 88.1667)
) AS v(Name, Lat, Lng)
WHERE NOT EXISTS (
    SELECT 1 FROM Districts WHERE DistrictName = v.Name AND StateId = @WB
);
GO

-- Punjab — 23 districts
DECLARE @PB INT = (SELECT StateId FROM States WHERE StateName = 'Punjab');
INSERT INTO Districts (DistrictName, StateId, Latitude, Longitude)
SELECT v.Name, @PB, v.Lat, v.Lng
FROM (VALUES
    ('Amritsar',       31.6340, 74.8723),
    ('Barnala',        30.3782, 75.5489),
    ('Bathinda',       30.2110, 74.9455),
    ('Faridkot',       30.6742, 74.7565),
    ('Fatehgarh Sahib',30.6449, 76.3897),
    ('Fazilka',        30.4022, 74.0264),
    ('Firozpur',       30.9283, 74.6138),
    ('Gurdaspur',      32.0398, 75.4055),
    ('Hoshiarpur',     31.5341, 75.9117),
    ('Jalandhar',      31.3260, 75.5762),
    ('Kapurthala',     31.3796, 75.3823),
    ('Ludhiana',       30.9010, 75.8573),
    ('Malerkotla',     30.5302, 75.8794),
    ('Mansa',          29.9887, 75.3915),
    ('Moga',           30.8145, 75.1738),
    ('Mohali',         30.7046, 76.7179),
    ('Muktsar',        30.4747, 74.5155),
    ('Nawanshahr',     31.1238, 76.1159),
    ('Pathankot',      32.2643, 75.6525),
    ('Patiala',        30.3398, 76.3869),
    ('Rupnagar',       30.9655, 76.5260),
    ('Sangrur',        30.2454, 75.8439),
    ('Tarn Taran',     31.4519, 74.9279)
) AS v(Name, Lat, Lng)
WHERE NOT EXISTS (
    SELECT 1 FROM Districts WHERE DistrictName = v.Name AND StateId = @PB
);
GO

-- Madhya Pradesh — major 20 districts
DECLARE @MP INT = (SELECT StateId FROM States WHERE StateName = 'Madhya Pradesh');
INSERT INTO Districts (DistrictName, StateId, Latitude, Longitude)
SELECT v.Name, @MP, v.Lat, v.Lng
FROM (VALUES
    ('Bhopal',       23.2599, 77.4126),
    ('Indore',       22.7196, 75.8577),
    ('Gwalior',      26.2183, 78.1828),
    ('Jabalpur',     23.1815, 79.9864),
    ('Ujjain',       23.1765, 75.7885),
    ('Sagar',        23.8388, 78.7378),
    ('Ratlam',       23.3315, 75.0367),
    ('Satna',        24.5804, 80.8322),
    ('Rewa',         24.5362, 81.2985),
    ('Murwara',      23.8334, 80.3919),
    ('Chhindwara',   22.0574, 78.9382),
    ('Bhind',        26.5653, 78.7892),
    ('Morena',       26.4953, 77.9974),
    ('Datia',        25.6606, 78.4590),
    ('Shivpuri',     25.4181, 77.6500),
    ('Damoh',        23.8288, 79.4414),
    ('Tikamgarh',    24.7485, 78.8319),
    ('Chhatarpur',   24.9184, 79.5952),
    ('Panna',        24.7181, 80.1860),
    ('Hoshangabad',  22.7498, 77.7199)
) AS v(Name, Lat, Lng)
WHERE NOT EXISTS (
    SELECT 1 FROM Districts WHERE DistrictName = v.Name AND StateId = @MP
);
GO

-- Bihar — major 15 districts
DECLARE @BR INT = (SELECT StateId FROM States WHERE StateName = 'Bihar');
INSERT INTO Districts (DistrictName, StateId, Latitude, Longitude)
SELECT v.Name, @BR, v.Lat, v.Lng
FROM (VALUES
    ('Patna',         25.5941, 85.1376),
    ('Gaya',          24.7955, 85.0002),
    ('Bhagalpur',     25.2425, 86.9842),
    ('Muzaffarpur',   26.1197, 85.3910),
    ('Darbhanga',     26.1542, 85.8918),
    ('Ara',           25.5562, 84.6632),
    ('Begusarai',     25.4182, 86.1272),
    ('Katihar',       25.5450, 87.5720),
    ('Munger',        25.3735, 86.4734),
    ('Samastipur',    25.8629, 85.7797),
    ('Purnia',        25.7771, 87.4753),
    ('Sitamarhi',     26.5946, 85.4897),
    ('Vaishali',      25.7000, 85.2000),
    ('Nalanda',       25.1368, 85.4453),
    ('Saran',         25.9140, 84.7520)
) AS v(Name, Lat, Lng)
WHERE NOT EXISTS (
    SELECT 1 FROM Districts WHERE DistrictName = v.Name AND StateId = @BR
);
GO

-- Odisha — major 15 districts
DECLARE @OD INT = (SELECT StateId FROM States WHERE StateName = 'Odisha');
INSERT INTO Districts (DistrictName, StateId, Latitude, Longitude)
SELECT v.Name, @OD, v.Lat, v.Lng
FROM (VALUES
    ('Bhubaneswar',   20.2961, 85.8245),
    ('Cuttack',       20.4625, 85.8830),
    ('Rourkela',      22.2604, 84.8536),
    ('Berhampur',     19.3150, 84.7941),
    ('Sambalpur',     21.4669, 83.9756),
    ('Puri',          19.8135, 85.8312),
    ('Balasore',      21.4942, 86.9335),
    ('Bhadrak',       21.0537, 86.4995),
    ('Kendrapara',    20.5001, 86.4183),
    ('Jagatsinghpur', 20.2567, 86.1714),
    ('Koraput',       18.8127, 82.7140),
    ('Mayurbhanj',    22.1000, 86.5167),
    ('Keonjhar',      21.6293, 85.5819),
    ('Sundargarh',    22.1172, 84.0292),
    ('Angul',         20.8437, 85.1017)
) AS v(Name, Lat, Lng)
WHERE NOT EXISTS (
    SELECT 1 FROM Districts WHERE DistrictName = v.Name AND StateId = @OD
);
GO

-- Haryana — 22 districts
DECLARE @HR INT = (SELECT StateId FROM States WHERE StateName = 'Haryana');
INSERT INTO Districts (DistrictName, StateId, Latitude, Longitude)
SELECT v.Name, @HR, v.Lat, v.Lng
FROM (VALUES
    ('Ambala',          30.3782, 76.7767),
    ('Bhiwani',         28.7975, 76.1322),
    ('Charkhi Dadri',   28.5912, 76.2692),
    ('Faridabad',       28.4089, 77.3178),
    ('Fatehabad',       29.5179, 75.4567),
    ('Gurugram',        28.4595, 77.0266),
    ('Hisar',           29.1492, 75.7217),
    ('Jhajjar',         28.6079, 76.6548),
    ('Jind',            29.3162, 76.3149),
    ('Kaithal',         29.8013, 76.3994),
    ('Karnal',          29.6857, 76.9905),
    ('Kurukshetra',     29.9695, 76.8783),
    ('Mahendragarh',    28.2803, 76.1485),
    ('Mewat',           28.0000, 77.0000),
    ('Palwal',          28.1440, 77.3320),
    ('Panchkula',       30.6942, 76.8606),
    ('Panipat',         29.3909, 76.9635),
    ('Rewari',          28.1826, 76.6177),
    ('Rohtak',          28.8955, 76.6066),
    ('Sirsa',           29.5331, 75.0295),
    ('Sonipat',         28.9930, 77.0151),
    ('Yamunanagar',     30.1290, 77.2674)
) AS v(Name, Lat, Lng)
WHERE NOT EXISTS (
    SELECT 1 FROM Districts WHERE DistrictName = v.Name AND StateId = @HR
);
GO

PRINT 'MunicipalMap tables, stored procedures, and seed data created successfully.';
GO
