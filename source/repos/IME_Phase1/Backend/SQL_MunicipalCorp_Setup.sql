-- ============================================================
-- Municipal Corporation Setup: Tables, SPs, Seed Data
-- ============================================================

-- 1. tbl_district
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tbl_district')
BEGIN
    CREATE TABLE tbl_district (
        DistrictId   INT IDENTITY(1,1) PRIMARY KEY,
        DistrictName VARCHAR(100) NOT NULL,
        StateId      INT NOT NULL,
        CONSTRAINT FK_district_state FOREIGN KEY (StateId) REFERENCES tbl_state(StateId)
    );
END
GO

-- 2. tbl_municipal_corporation
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tbl_municipal_corporation')
BEGIN
    CREATE TABLE tbl_municipal_corporation (
        CorpId          INT IDENTITY(1,1) PRIMARY KEY,
        CorpName        VARCHAR(200) NOT NULL,
        CorpCode        VARCHAR(20)  NULL,
        DistrictId      INT NOT NULL,
        StateId         INT NOT NULL,
        CountryId       INT NOT NULL,
        Address         VARCHAR(500) NULL,
        ContactNumber   VARCHAR(20)  NULL,
        Email           VARCHAR(100) NULL,
        Website         VARCHAR(200) NULL,
        EstablishedYear INT          NULL,
        WardCount       INT          NULL,
        MayorName       VARCHAR(150) NULL,
        Population      VARCHAR(50)  NULL,
        Area            VARCHAR(50)  NULL,
        IsActive        BIT NOT NULL DEFAULT 1,
        CONSTRAINT FK_corp_district FOREIGN KEY (DistrictId) REFERENCES tbl_district(DistrictId),
        CONSTRAINT FK_corp_state    FOREIGN KEY (StateId)    REFERENCES tbl_state(StateId),
        CONSTRAINT FK_corp_country  FOREIGN KEY (CountryId)  REFERENCES tbl_country(CountryId)
    );
END
GO

-- ============================================================
-- Seed Districts (India)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM tbl_district)
BEGIN
    DECLARE @TN  INT, @MH INT, @KA INT, @AP INT, @TG INT,
            @DL  INT, @WB INT, @GJ INT, @UP INT, @RJ INT,
            @KL  INT, @MP INT, @PB INT, @HR INT, @OD INT;

    SELECT @TN = StateId FROM tbl_state WHERE StateName = 'Tamil Nadu';
    SELECT @MH = StateId FROM tbl_state WHERE StateName = 'Maharashtra';
    SELECT @KA = StateId FROM tbl_state WHERE StateName = 'Karnataka';
    SELECT @AP = StateId FROM tbl_state WHERE StateName = 'Andhra Pradesh';
    SELECT @TG = StateId FROM tbl_state WHERE StateName = 'Telangana';
    SELECT @DL = StateId FROM tbl_state WHERE StateName = 'Delhi';
    SELECT @WB = StateId FROM tbl_state WHERE StateName = 'West Bengal';
    SELECT @GJ = StateId FROM tbl_state WHERE StateName = 'Gujarat';
    SELECT @UP = StateId FROM tbl_state WHERE StateName = 'Uttar Pradesh';
    SELECT @RJ = StateId FROM tbl_state WHERE StateName = 'Rajasthan';
    SELECT @KL = StateId FROM tbl_state WHERE StateName = 'Kerala';
    SELECT @MP = StateId FROM tbl_state WHERE StateName = 'Madhya Pradesh';
    SELECT @PB = StateId FROM tbl_state WHERE StateName = 'Punjab';
    SELECT @HR = StateId FROM tbl_state WHERE StateName = 'Haryana';
    SELECT @OD = StateId FROM tbl_state WHERE StateName = 'Odisha';

    -- Tamil Nadu
    IF @TN IS NOT NULL INSERT INTO tbl_district (DistrictName, StateId) VALUES
        ('Chennai', @TN), ('Coimbatore', @TN), ('Madurai', @TN),
        ('Tiruchirappalli', @TN), ('Salem', @TN), ('Tirunelveli', @TN),
        ('Erode', @TN), ('Vellore', @TN), ('Tiruppur', @TN), ('Thoothukudi', @TN);

    -- Maharashtra
    IF @MH IS NOT NULL INSERT INTO tbl_district (DistrictName, StateId) VALUES
        ('Mumbai City', @MH), ('Mumbai Suburban', @MH), ('Pune', @MH),
        ('Nagpur', @MH), ('Thane', @MH), ('Nashik', @MH),
        ('Aurangabad', @MH), ('Solapur', @MH);

    -- Karnataka
    IF @KA IS NOT NULL INSERT INTO tbl_district (DistrictName, StateId) VALUES
        ('Bengaluru Urban', @KA), ('Mysuru', @KA), ('Hubballi-Dharwad', @KA),
        ('Mangaluru', @KA), ('Belagavi', @KA), ('Kalaburagi', @KA);

    -- Andhra Pradesh
    IF @AP IS NOT NULL INSERT INTO tbl_district (DistrictName, StateId) VALUES
        ('Visakhapatnam', @AP), ('Vijayawada', @AP), ('Guntur', @AP),
        ('Tirupati', @AP), ('Kakinada', @AP), ('Nellore', @AP);

    -- Telangana
    IF @TG IS NOT NULL INSERT INTO tbl_district (DistrictName, StateId) VALUES
        ('Hyderabad', @TG), ('Rangareddy', @TG), ('Medchal-Malkajgiri', @TG),
        ('Warangal', @TG), ('Karimnagar', @TG);

    -- Delhi
    IF @DL IS NOT NULL INSERT INTO tbl_district (DistrictName, StateId) VALUES
        ('Central Delhi', @DL), ('North Delhi', @DL), ('South Delhi', @DL),
        ('East Delhi', @DL), ('West Delhi', @DL), ('North East Delhi', @DL),
        ('North West Delhi', @DL), ('South East Delhi', @DL), ('South West Delhi', @DL);

    -- West Bengal
    IF @WB IS NOT NULL INSERT INTO tbl_district (DistrictName, StateId) VALUES
        ('Kolkata', @WB), ('Howrah', @WB), ('North 24 Parganas', @WB),
        ('South 24 Parganas', @WB), ('Asansol-Durgapur', @WB);

    -- Gujarat
    IF @GJ IS NOT NULL INSERT INTO tbl_district (DistrictName, StateId) VALUES
        ('Ahmedabad', @GJ), ('Surat', @GJ), ('Vadodara', @GJ),
        ('Rajkot', @GJ), ('Gandhinagar', @GJ), ('Bhavnagar', @GJ);

    -- Uttar Pradesh
    IF @UP IS NOT NULL INSERT INTO tbl_district (DistrictName, StateId) VALUES
        ('Lucknow', @UP), ('Kanpur Nagar', @UP), ('Agra', @UP),
        ('Varanasi', @UP), ('Prayagraj', @UP), ('Meerut', @UP), ('Ghaziabad', @UP);

    -- Rajasthan
    IF @RJ IS NOT NULL INSERT INTO tbl_district (DistrictName, StateId) VALUES
        ('Jaipur', @RJ), ('Jodhpur', @RJ), ('Kota', @RJ),
        ('Ajmer', @RJ), ('Bikaner', @RJ), ('Udaipur', @RJ);

    -- Kerala
    IF @KL IS NOT NULL INSERT INTO tbl_district (DistrictName, StateId) VALUES
        ('Thiruvananthapuram', @KL), ('Kochi (Ernakulam)', @KL), ('Kozhikode', @KL),
        ('Thrissur', @KL), ('Kollam', @KL), ('Kannur', @KL);

    -- Madhya Pradesh
    IF @MP IS NOT NULL INSERT INTO tbl_district (DistrictName, StateId) VALUES
        ('Bhopal', @MP), ('Indore', @MP), ('Jabalpur', @MP),
        ('Gwalior', @MP), ('Ujjain', @MP);

    -- Punjab
    IF @PB IS NOT NULL INSERT INTO tbl_district (DistrictName, StateId) VALUES
        ('Ludhiana', @PB), ('Amritsar', @PB), ('Jalandhar', @PB),
        ('Patiala', @PB), ('Bathinda', @PB);

    -- Haryana
    IF @HR IS NOT NULL INSERT INTO tbl_district (DistrictName, StateId) VALUES
        ('Faridabad', @HR), ('Gurugram', @HR), ('Panipat', @HR),
        ('Ambala', @HR), ('Rohtak', @HR);

    -- Odisha
    IF @OD IS NOT NULL INSERT INTO tbl_district (DistrictName, StateId) VALUES
        ('Bhubaneswar (Khurda)', @OD), ('Cuttack', @OD), ('Rourkela (Sundargarh)', @OD),
        ('Brahmapur (Ganjam)', @OD), ('Sambalpur', @OD);
END
GO

-- ============================================================
-- Seed Municipal Corporations
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM tbl_municipal_corporation)
BEGIN
    DECLARE @CID INT;
    SELECT @CID = CountryId FROM tbl_country WHERE CountryName = 'India';

    -- Helper: insert corps by looking up district name + state name
    -- Tamil Nadu
    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Greater Chennai Corporation', 'GCC',
        d.DistrictId, d.StateId, @CID,
        'Ripon Building, EVR Salai, Chennai - 600003',
        '044-25384500', 'commissioner@chennaicorporation.gov.in', 'www.chennaicorporation.gov.in',
        1688, 200, 'R. Priya', '7.1 Million', '426 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Chennai' AND s.StateName = 'Tamil Nadu';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Coimbatore City Municipal Corporation', 'CCMC',
        d.DistrictId, d.StateId, @CID,
        'Coimbatore Municipal Corporation, Coimbatore - 641001',
        '0422-2391676', 'commissioner@ccmc.gov.in', 'www.ccmc.gov.in',
        1866, 100, 'Kalpana Anand', '1.1 Million', '257 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Coimbatore' AND s.StateName = 'Tamil Nadu';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Madurai City Municipal Corporation', 'MCMC',
        d.DistrictId, d.StateId, @CID,
        '1, Arulanandam Mudali Street, Madurai - 625001',
        '0452-2531500', 'commissioner@maduraicorporation.gov.in', 'www.maduraicorporation.gov.in',
        1866, 100, 'Indirani Pon', '1.5 Million', '148 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Madurai' AND s.StateName = 'Tamil Nadu';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Tiruchirappalli City Municipal Corporation', 'TCMC',
        d.DistrictId, d.StateId, @CID,
        'Municipal Office Road, Tiruchirappalli - 620001',
        '0431-2700370', 'commissioner@trichy.gov.in', 'www.trichy.nic.in',
        1994, 65, 'Mu. Anbalagan', '0.9 Million', '167 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Tiruchirappalli' AND s.StateName = 'Tamil Nadu';

    -- Maharashtra
    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Municipal Corporation of Greater Mumbai', 'MCGM',
        d.DistrictId, d.StateId, @CID,
        'Municipal Head Office, Mahapalika Marg, Fort, Mumbai - 400001',
        '022-22621001', 'mcgm@mcgm.gov.in', 'www.mcgm.gov.in',
        1888, 227, 'Kishori Pednekar', '12.4 Million', '438 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Mumbai City' AND s.StateName = 'Maharashtra';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Pune Municipal Corporation', 'PMC',
        d.DistrictId, d.StateId, @CID,
        'Shivajinagar, Pune - 411005',
        '020-25501000', 'commissioner@punecorporation.org', 'www.punecorporation.org',
        1950, 162, 'Murlidhar Mohol', '3.1 Million', '331 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Pune' AND s.StateName = 'Maharashtra';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Nagpur Municipal Corporation', 'NMC',
        d.DistrictId, d.StateId, @CID,
        'Mahanagar Palika Square, Nagpur - 440018',
        '0712-2567021', 'info@nagpurcorporation.gov.in', 'www.nagpurcorporation.gov.in',
        1864, 151, 'Dayashankar Tiwari', '2.4 Million', '218 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Nagpur' AND s.StateName = 'Maharashtra';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Thane Municipal Corporation', 'TMC',
        d.DistrictId, d.StateId, @CID,
        'Panchpakhadi, Thane West - 400602',
        '022-25368111', 'commissioner@thanecorporation.gov.in', 'www.thanecorporation.gov.in',
        1982, 131, 'Naresh Mhaske', '1.8 Million', '147 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Thane' AND s.StateName = 'Maharashtra';

    -- Karnataka
    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Bruhat Bengaluru Mahanagara Palike', 'BBMP',
        d.DistrictId, d.StateId, @CID,
        'N.R. Square, Hudson Circle, Bengaluru - 560002',
        '080-22660000', 'commissioner@bbmp.gov.in', 'www.bbmp.gov.in',
        2007, 243, 'G. Padmavathi', '11.5 Million', '741 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Bengaluru Urban' AND s.StateName = 'Karnataka';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Mysuru City Corporation', 'MCC',
        d.DistrictId, d.StateId, @CID,
        'MCC Building, Sayyaji Rao Road, Mysuru - 570001',
        '0821-2423400', 'commissioner@mysurucci.gov.in', 'www.mysurucci.gov.in',
        1888, 65, 'Shivakumar R.', '0.92 Million', '128 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Mysuru' AND s.StateName = 'Karnataka';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Hubballi-Dharwad Municipal Corporation', 'HDMC',
        d.DistrictId, d.StateId, @CID,
        'Town Hall, Hubballi - 580020',
        '0836-2361000', 'commissioner@hubballidharwad.gov.in', 'www.hubballidharwad.gov.in',
        1962, 67, 'Iresh B. Ancheri', '0.9 Million', '202 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Hubballi-Dharwad' AND s.StateName = 'Karnataka';

    -- Andhra Pradesh
    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Greater Visakhapatnam Municipal Corporation', 'GVMC',
        d.DistrictId, d.StateId, @CID,
        'Near RTC Complex, Jagadamba, Visakhapatnam - 530002',
        '0891-2564411', 'commissioner@gvmc.gov.in', 'www.gvmc.gov.in',
        2005, 98, 'Golagani Hari Venkata Kumari', '2.0 Million', '681 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Visakhapatnam' AND s.StateName = 'Andhra Pradesh';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Vijayawada Municipal Corporation', 'VMC',
        d.DistrictId, d.StateId, @CID,
        'Bandar Road, Vijayawada - 520002',
        '0866-2576665', 'commissioner@vmc.gov.in', 'www.vmc.gov.in',
        1888, 61, 'Rayana Bhagya Lakshmi', '1.4 Million', '61 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Vijayawada' AND s.StateName = 'Andhra Pradesh';

    -- Telangana
    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Greater Hyderabad Municipal Corporation', 'GHMC',
        d.DistrictId, d.StateId, @CID,
        'GHMC Head Office, Tank Bund Road, Hyderabad - 500080',
        '040-23263800', 'commissioner@ghmc.gov.in', 'www.ghmc.gov.in',
        2007, 150, 'Gadwal Vijayalakshmi', '9.7 Million', '650 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Hyderabad' AND s.StateName = 'Telangana';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Warangal Municipal Corporation', 'WMC',
        d.DistrictId, d.StateId, @CID,
        'Ground Floor, Municipal Bhavan, Warangal - 506002',
        '0870-2433430', 'commissioner@wmc.gov.in', 'www.wmc.gov.in',
        1915, 67, 'Kundeti Mala', '0.81 Million', '406 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Warangal' AND s.StateName = 'Telangana';

    -- Delhi
    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'North Delhi Municipal Corporation', 'NDMC',
        d.DistrictId, d.StateId, @CID,
        'Dr. SP Mukherjee Civic Centre, JLN Marg, Delhi - 110002',
        '011-23228000', 'info@ndmc.gov.in', 'www.ndmc.gov.in',
        2012, 104, 'Jayaprakash', '4.0 Million', '443 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'North Delhi' AND s.StateName = 'Delhi';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'South Delhi Municipal Corporation', 'SDMC',
        d.DistrictId, d.StateId, @CID,
        'Civic Centre, Minto Road, New Delhi - 110002',
        '011-23228000', 'info@sdmc.gov.in', 'www.sdmc.gov.in',
        2012, 104, 'Mukesh Suryan', '2.8 Million', '250 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'South Delhi' AND s.StateName = 'Delhi';

    -- West Bengal
    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Kolkata Municipal Corporation', 'KMC',
        d.DistrictId, d.StateId, @CID,
        '5, SN Banerjee Road, Kolkata - 700013',
        '033-22861000', 'mayor@kmcgov.in', 'www.kmcgov.in',
        1876, 144, 'Firhad Hakim', '4.5 Million', '205 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Kolkata' AND s.StateName = 'West Bengal';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Howrah Municipal Corporation', 'HMC',
        d.DistrictId, d.StateId, @CID,
        'Howrah Mahanagari Bhavan, Howrah - 711101',
        '033-26389100', 'commissioner@howrahmc.gov.in', 'www.howrahmc.gov.in',
        1862, 50, 'Md. Firoz Gazi', '1.1 Million', '52 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Howrah' AND s.StateName = 'West Bengal';

    -- Gujarat
    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Ahmedabad Municipal Corporation', 'AMC',
        d.DistrictId, d.StateId, @CID,
        'Sardar Patel Bhavan, Danapith, Ahmedabad - 380001',
        '079-25391811', 'commissioner@ahmedabadcity.gov.in', 'www.ahmedabadcity.gov.in',
        1950, 48, 'Kishorbhai Patel', '5.5 Million', '464 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Ahmedabad' AND s.StateName = 'Gujarat';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Surat Municipal Corporation', 'SMC',
        d.DistrictId, d.StateId, @CID,
        'Muglisara, Surat - 395003',
        '0261-2467666', 'commissioner@suratmunicipal.gov.in', 'www.suratmunicipal.gov.in',
        1852, 30, 'Dakshaben Dhakkar', '4.5 Million', '326 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Surat' AND s.StateName = 'Gujarat';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Vadodara Mahanagar Seva Sadan', 'VMSS',
        d.DistrictId, d.StateId, @CID,
        'Khanderao Market, Vadodara - 390001',
        '0265-2415151', 'commissioner@vmc.gov.in', 'www.vmc.gov.in',
        1950, 76, 'Bhavna Bedi', '1.8 Million', '148 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Vadodara' AND s.StateName = 'Gujarat';

    -- Uttar Pradesh
    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Lucknow Municipal Corporation', 'LMC',
        d.DistrictId, d.StateId, @CID,
        'Lalbagh, Lucknow - 226001',
        '0522-2620000', 'commissioner@lmc.gov.in', 'www.lmc.gov.in',
        1958, 110, 'Sushma Kharakwal', '2.8 Million', '631 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Lucknow' AND s.StateName = 'Uttar Pradesh';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Kanpur Municipal Corporation', 'KMC',
        d.DistrictId, d.StateId, @CID,
        'Town Hall, Kanpur - 208001',
        '0512-2312222', 'commissioner@kmc.gov.in', 'www.kmc.gov.in',
        1959, 110, 'Pramila Pandey', '3.0 Million', '260 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Kanpur Nagar' AND s.StateName = 'Uttar Pradesh';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Agra Municipal Corporation', 'AMC',
        d.DistrictId, d.StateId, @CID,
        'Subhash Bazaar, Agra - 282003',
        '0562-2260023', 'commissioner@agranagar.gov.in', 'www.agranagar.gov.in',
        1959, 100, 'Manisha Yadav', '1.7 Million', '145 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Agra' AND s.StateName = 'Uttar Pradesh';

    -- Rajasthan
    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Jaipur Municipal Corporation Greater', 'JMCG',
        d.DistrictId, d.StateId, @CID,
        'Lal Kothi, Tonk Road, Jaipur - 302015',
        '0141-2741414', 'commissioner@jmcgreater.in', 'www.jmcgreater.in',
        2014, 150, 'Soumya Gurjar', '3.0 Million', '467 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Jaipur' AND s.StateName = 'Rajasthan';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Jodhpur Municipal Corporation', 'JMC',
        d.DistrictId, d.StateId, @CID,
        'Sojati Gate, Jodhpur - 342001',
        '0291-2651214', 'commissioner@jodhpurcorporation.gov.in', 'www.jodhpurcorporation.gov.in',
        2019, 85, 'Kunti Dewariya', '1.1 Million', '259 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Jodhpur' AND s.StateName = 'Rajasthan';

    -- Kerala
    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Thiruvananthapuram Municipal Corporation', 'TMC',
        d.DistrictId, d.StateId, @CID,
        'Corporation Building, Thiruvananthapuram - 695001',
        '0471-2461300', 'commissioner@tmc.kerala.gov.in', 'www.tmc.kerala.gov.in',
        1940, 100, 'Arya Rajendran', '0.9 Million', '214 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Thiruvananthapuram' AND s.StateName = 'Kerala';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Kochi Municipal Corporation', 'KMC',
        d.DistrictId, d.StateId, @CID,
        'Mattancherry, Kochi - 682009',
        '0484-2370238', 'commissioner@cochincorporation.gov.in', 'www.cochincorporation.gov.in',
        1967, 74, 'M. Anilkumar', '0.6 Million', '94 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Kochi (Ernakulam)' AND s.StateName = 'Kerala';

    -- Madhya Pradesh
    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Bhopal Municipal Corporation', 'BMC',
        d.DistrictId, d.StateId, @CID,
        'Bhopal Municipal Corporation, Bhopal - 462001',
        '0755-2770200', 'commissioner@bhopalcorporation.gov.in', 'www.bhopalcorporation.gov.in',
        1907, 85, 'Malti Rai', '1.8 Million', '463 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Bhopal' AND s.StateName = 'Madhya Pradesh';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Indore Municipal Corporation', 'IMC',
        d.DistrictId, d.StateId, @CID,
        'Main Road, Indore - 452001',
        '0731-2431100', 'commissioner@indorenagarpalika.org', 'www.indorenagarpalika.org',
        1956, 85, 'Pushyamitra Bhargav', '2.2 Million', '261 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Indore' AND s.StateName = 'Madhya Pradesh';

    -- Punjab
    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Ludhiana Municipal Corporation', 'LMC',
        d.DistrictId, d.StateId, @CID,
        'Town Hall, Ludhiana - 141001',
        '0161-2741400', 'commissioner@mcludhiana.gov.in', 'www.mcludhiana.gov.in',
        1977, 95, 'Balkar Singh Sandhu', '1.6 Million', '160 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Ludhiana' AND s.StateName = 'Punjab';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Amritsar Municipal Corporation', 'AMC',
        d.DistrictId, d.StateId, @CID,
        'Town Hall, Amritsar - 143001',
        '0183-2221700', 'commissioner@amritsarmc.gov.in', 'www.amritsarmc.gov.in',
        1867, 85, 'Karamjit Singh Rintu', '1.1 Million', '130 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Amritsar' AND s.StateName = 'Punjab';

    -- Odisha
    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Bhubaneswar Municipal Corporation', 'BMC',
        d.DistrictId, d.StateId, @CID,
        'Bhubaneswar Municipal Corporation, Bhubaneswar - 751001',
        '0674-2530011', 'commissioner@bmc.orissa.gov.in', 'www.bmc.orissa.gov.in',
        1979, 67, 'Sulochana Das', '0.84 Million', '135 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Bhubaneswar (Khurda)' AND s.StateName = 'Odisha';

    INSERT INTO tbl_municipal_corporation
        (CorpName, CorpCode, DistrictId, StateId, CountryId, Address, ContactNumber, Email, Website, EstablishedYear, WardCount, MayorName, Population, Area)
    SELECT 'Cuttack Municipal Corporation', 'CMC',
        d.DistrictId, d.StateId, @CID,
        'Akhanda Sahid Marg, Cuttack - 753001',
        '0671-2614700', 'commissioner@cuttackcorp.gov.in', 'www.cuttackcorp.gov.in',
        1876, 59, 'Subhas Singh', '0.57 Million', '76 sq km'
    FROM tbl_district d JOIN tbl_state s ON d.StateId = s.StateId
    WHERE d.DistrictName = 'Cuttack' AND s.StateName = 'Odisha';
END
GO

-- ============================================================
-- Stored Procedures
-- ============================================================

-- sp_GetDistricts
IF OBJECT_ID('sp_GetDistricts', 'P') IS NOT NULL DROP PROCEDURE sp_GetDistricts;
GO
CREATE PROCEDURE sp_GetDistricts
    @StateId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DistrictId, DistrictName, StateId
    FROM tbl_district
    WHERE StateId = @StateId
    ORDER BY DistrictName;
END
GO

-- sp_GetMunicipalCorps
IF OBJECT_ID('sp_GetMunicipalCorps', 'P') IS NOT NULL DROP PROCEDURE sp_GetMunicipalCorps;
GO
CREATE PROCEDURE sp_GetMunicipalCorps
    @DistrictId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT mc.CorpId, mc.CorpName, mc.CorpCode,
           mc.DistrictId, d.DistrictName,
           mc.StateId, s.StateName,
           mc.CountryId, c.CountryName,
           mc.Address, mc.ContactNumber, mc.Email, mc.Website,
           mc.EstablishedYear, mc.WardCount, mc.MayorName,
           mc.Population, mc.Area, mc.IsActive
    FROM tbl_municipal_corporation mc
    JOIN tbl_district d ON mc.DistrictId = d.DistrictId
    JOIN tbl_state    s ON mc.StateId    = s.StateId
    JOIN tbl_country  c ON mc.CountryId  = c.CountryId
    WHERE mc.DistrictId = @DistrictId AND mc.IsActive = 1
    ORDER BY mc.CorpName;
END
GO

-- sp_GetMunicipalCorpById
IF OBJECT_ID('sp_GetMunicipalCorpById', 'P') IS NOT NULL DROP PROCEDURE sp_GetMunicipalCorpById;
GO
CREATE PROCEDURE sp_GetMunicipalCorpById
    @CorpId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT mc.CorpId, mc.CorpName, mc.CorpCode,
           mc.DistrictId, d.DistrictName,
           mc.StateId, s.StateName,
           mc.CountryId, c.CountryName,
           mc.Address, mc.ContactNumber, mc.Email, mc.Website,
           mc.EstablishedYear, mc.WardCount, mc.MayorName,
           mc.Population, mc.Area, mc.IsActive
    FROM tbl_municipal_corporation mc
    JOIN tbl_district d ON mc.DistrictId = d.DistrictId
    JOIN tbl_state    s ON mc.StateId    = s.StateId
    JOIN tbl_country  c ON mc.CountryId  = c.CountryId
    WHERE mc.CorpId = @CorpId;
END
GO

-- sp_GetMunicipalCorpsByState (for direct state-level listing)
IF OBJECT_ID('sp_GetMunicipalCorpsByState', 'P') IS NOT NULL DROP PROCEDURE sp_GetMunicipalCorpsByState;
GO
CREATE PROCEDURE sp_GetMunicipalCorpsByState
    @StateId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT mc.CorpId, mc.CorpName, mc.CorpCode,
           mc.DistrictId, d.DistrictName,
           mc.StateId, s.StateName,
           mc.CountryId, c.CountryName,
           mc.Address, mc.ContactNumber, mc.Email, mc.Website,
           mc.EstablishedYear, mc.WardCount, mc.MayorName,
           mc.Population, mc.Area, mc.IsActive
    FROM tbl_municipal_corporation mc
    JOIN tbl_district d ON mc.DistrictId = d.DistrictId
    JOIN tbl_state    s ON mc.StateId    = s.StateId
    JOIN tbl_country  c ON mc.CountryId  = c.CountryId
    WHERE mc.StateId = @StateId AND mc.IsActive = 1
    ORDER BY d.DistrictName, mc.CorpName;
END
GO
