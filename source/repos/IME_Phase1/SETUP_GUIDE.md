# IME Phase 1 - Complete Setup Guide

This guide will walk you through setting up the complete IME application from scratch.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Software Requirements

#### For Backend Development:
- **SQL Server** (2019 or later)
  - SQL Server Express (free): https://www.microsoft.com/sql-server/sql-server-downloads
  - Or Azure SQL Database (cloud)
  
- **.NET 8.0 SDK**
  - Download: https://dotnet.microsoft.com/download
  - Verify installation: `dotnet --version`

- **Visual Studio 2022** (recommended) or **VS Code**
  - Visual Studio: https://visualstudio.microsoft.com/
  - VS Code: https://code.visualstudio.com/

#### For Frontend Development:
- **Node.js** (v16 or higher)
  - Download: https://nodejs.org/
  - Verify: `node --version` and `npm --version`

- **Expo CLI**
  ```bash
  npm install -g expo-cli
  ```

- **Mobile Development Tools:**
  - **For iOS:** Xcode (Mac only)
  - **For Android:** Android Studio
  - **Alternative:** Expo Go app on your phone

---

## Database Setup

### Step 1: Create Database

```sql
-- Connect to SQL Server and run:
CREATE DATABASE db_a85a40_ime;
GO

USE db_a85a40_ime;
GO
```

Or use the connection string provided in the requirements:
```
Data Source=SQL5113.site4now.net;
Initial Catalog=db_a85a40_ime;
User Id=db_a85a40_ime_admin;
Password=YOUR_DB_PASSWORD;
Encrypt=True;
TrustServerCertificate=True;
```

### Step 2: Create Tables

Execute the following script in order:

```bash
# Navigate to database folder
cd Database/Tables

# Execute in SQL Server Management Studio or Azure Data Studio
# Run: 01_CreateTables.sql
```

This creates all necessary tables:
- Users, Roles, Members
- Activities, News, Media, Podcasts
- Support, Achievements, GO Circular
- Notification and attachment tables

### Step 3: Insert Initial Data

```bash
# Execute initial data script
cd Database/InitialData

# Run: 02_InsertInitialData.sql
```

This inserts:
- Default roles (Admin, Member)
- Common designations
- Support categories
- Admin user account
- Default membership fee
- Static content pages

### Step 4: Create Stored Procedures

Execute all stored procedure scripts:

```bash
cd Database/StoredProcedures

# Run in order:
# 03_AuthenticationProcedures.sql
# 04_MemberProcedures.sql
# 05_ModulesProcedures.sql
# 06_NotificationsAndMiscProcedures.sql
```

### Step 5: Verify Database Setup

```sql
-- Check tables
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- Check stored procedures
SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_TYPE = 'PROCEDURE'
ORDER BY ROUTINE_NAME;

-- Verify initial data
SELECT * FROM Roles;
SELECT * FROM Designation;
SELECT * FROM Users;
SELECT * FROM SupportCategory;
```

---

## Backend Setup

### Step 1: Open Solution

```bash
cd Backend

# Open solution in Visual Studio
start IME.sln

# Or open in VS Code
code .
```

### Step 2: Configure Connection String

Edit `Backend/IME.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=YOUR_SERVER;Initial Catalog=db_a85a40_ime;User Id=YOUR_USER;Password=YOUR_PASSWORD;Encrypt=True;TrustServerCertificate=True;"
  },
  "JwtSettings": {
    "SecretKey": "IME_Secret_Key_2024_Phase1_SuperSecureKey123!@#",
    "Issuer": "IME_API",
    "Audience": "IME_MobileApp",
    "ExpiryMinutes": 480
  },
  "FileStorage": {
    "UploadPath": "Uploads"
  }
}
```

**Replace:**
- `YOUR_SERVER` - Your SQL Server instance name (e.g., `localhost` or `(localdb)\MSSQLLocalDB`)
- `YOUR_USER` - Database username
- `YOUR_PASSWORD` - Database password

**For Local SQL Server:**
```json
"DefaultConnection": "Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=db_a85a40_ime;Integrated Security=True;"
```

### Step 3: Restore NuGet Packages

```bash
cd Backend
dotnet restore
```

### Step 4: Build Solution

```bash
dotnet build
```

### Step 5: Create Uploads Directory

```bash
cd Backend/IME.API
mkdir Uploads
```

### Step 6: Run the API

```bash
cd Backend/IME.API
dotnet run
```

The API should start at:
- HTTPS: `https://localhost:5001`
- HTTP: `http://localhost:5000`

### Step 7: Test API with Swagger

Open browser and navigate to:
```
https://localhost:5001/swagger
```

You should see the Swagger UI with all API endpoints.

### Step 8: Test Login Endpoint

In Swagger, try the `/api/auth/login` endpoint:

```json
{
  "email": "admin@ime.org",
  "password": "Admin@123"
}
```

If successful, you'll receive a JWT token.

---

## Frontend Setup

### Step 1: Install Dependencies

```bash
cd Frontend
npm install
```

This installs:
- React Native and Expo
- React Navigation
- React Native Paper
- Axios for API calls
- AsyncStorage
- Other dependencies

### Step 2: Configure API URL

Edit `Frontend/src/utils/api.js`:

```javascript
// Update with your backend URL
const API_BASE_URL = 'http://192.168.1.100:5000/api';  // Use your local IP
// or
const API_BASE_URL = 'https://localhost:5001/api';  // For simulators
```

**Important Notes:**
- For **iOS Simulator**: Use `https://localhost:5001/api`
- For **Android Emulator**: Use `http://10.0.2.2:5000/api`
- For **Physical Device**: Use your computer's local IP (e.g., `http://192.168.1.100:5000/api`)

**To find your local IP:**
- Windows: `ipconfig` in Command Prompt
- Mac/Linux: `ifconfig` in Terminal
- Look for IPv4 address

### Step 3: Start Expo

```bash
npm start
```

This opens Expo DevTools in your browser.

### Step 4: Run on Device/Simulator

**Option A: Physical Device**
1. Install Expo Go app from App Store/Play Store
2. Scan QR code from terminal/browser
3. App will load on your device

**Option B: iOS Simulator (Mac only)**
```bash
# Press 'i' in terminal
# or in Expo DevTools, click "Run on iOS simulator"
```

**Option C: Android Emulator**
```bash
# Press 'a' in terminal
# or in Expo DevTools, click "Run on Android device/emulator"
```

### Step 5: Test Login

1. App should show splash screen
2. Navigate to login screen
3. Enter credentials:
   - Email: `admin@ime.org`
   - Password: `Admin@123`
4. Click Login

If successful, you'll be redirected to the home screen.

---

## Testing

### Backend API Testing

#### Using Swagger UI:

1. Open `https://localhost:5001/swagger`
2. Test authentication endpoints:
   - POST `/api/auth/login`
   - POST `/api/auth/signup`
3. Copy the token from login response
4. Click "Authorize" button (🔒 icon)
5. Enter: `Bearer YOUR_TOKEN_HERE`
6. Test authorized endpoints

#### Using Postman:

1. Import endpoints or create new requests
2. Set Authorization header:
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

### Frontend Testing

#### Test Scenarios:

1. **Authentication Flow:**
   - Splash screen → Login
   - Invalid credentials error
   - Successful login
   - Token storage
   - Auto-login on app restart

2. **Registration Flow:**
   - Navigate to signup
   - Fill all fields
   - Submit registration
   - Verify in database

3. **Main Features:**
   - Navigate between tabs
   - Load activities list
   - View activity details
   - Test profile screen
   - Logout functionality

4. **Role-Based Access:**
   - Login as admin
   - Verify FAB button appears
   - Login as member
   - Verify restricted access

---

## Troubleshooting

### Common Backend Issues

#### Issue: Cannot connect to database

**Solution:**
1. Verify SQL Server is running
2. Check connection string
3. Test connection in SQL Server Management Studio
4. Ensure firewall allows connections

#### Issue: Build errors

**Solution:**
```bash
# Clean and rebuild
dotnet clean
dotnet restore
dotnet build
```

#### Issue: "Trust the ASP.NET Core SSL certificate"

**Solution:**
```bash
dotnet dev-certs https --trust
```

### Common Frontend Issues

#### Issue: Cannot connect to API

**Solution:**
1. Verify backend is running
2. Check API_BASE_URL in `api.js`
3. Use correct URL for your setup:
   - Simulator: `localhost`
   - Physical device: local IP address
   - Android emulator: `10.0.2.2`

#### Issue: Expo won't start

**Solution:**
```bash
# Clear cache and restart
expo start -c
# or
npm start -- --reset-cache
```

#### Issue: Dependencies not installing

**Solution:**
```bash
# Delete and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

#### Issue: "Network request failed"

**Solutions:**
1. Ensure device and computer are on same network
2. Check firewall settings
3. Verify API is running
4. Test API URL in browser

### Database Issues

#### Issue: Stored procedure errors

**Solution:**
1. Drop and recreate procedures
2. Check syntax
3. Verify table references

#### Issue: Authentication fails

**Solution:**
1. Check Users table has admin account
2. Verify password hash format
3. Test BCrypt hashing manually

### Quick Diagnostic Commands

```bash
# Backend
dotnet --version          # Check .NET version
dotnet build             # Build and check for errors
dotnet run               # Run and see error messages

# Frontend
node --version           # Check Node version
npm --version            # Check npm version
expo diagnostics         # Run Expo diagnostics
```

---

## Next Steps

After successful setup:

1. **Explore the Code:**
   - Review backend controllers
   - Check repository patterns
   - Study React Native screens

2. **Customize:**
   - Update branding
   - Modify UI colors
   - Add new features

3. **Develop:**
   - Implement remaining controllers
   - Add file upload functionality
   - Integrate push notifications
   - Add payment gateway

4. **Deploy:**
   - Prepare for production
   - Set up hosting
   - Submit to app stores

---

## Additional Resources

- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [SQL Server Documentation](https://docs.microsoft.com/sql/)

---

## Support

If you encounter issues not covered here:
1. Check the main README.md
2. Review code comments
3. Test individual components
4. Check logs for error messages

---

**Good luck with your IME application development! 🚀**
