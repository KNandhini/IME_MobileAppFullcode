# IME Phase 1 - Quick Start Guide

Get the IME application running in 10 minutes!

## Prerequisites Installed?

- [ ] .NET 8.0 SDK
- [ ] SQL Server
- [ ] Node.js (v16+)
- [ ] Expo CLI

If not, see [SETUP_GUIDE.md](SETUP_GUIDE.md) for installation instructions.

---

## 🚀 Quick Start (5 Steps)

### Step 1: Database (2 minutes)

```sql
-- Open SQL Server Management Studio or Azure Data Studio
-- Create database
CREATE DATABASE db_a85a40_ime;
GO

-- Run these scripts in order:
-- 1. Database/Tables/01_CreateTables.sql
-- 2. Database/InitialData/02_InsertInitialData.sql
-- 3. All files in Database/StoredProcedures/
```

**Quick verify:**
```sql
USE db_a85a40_ime;
SELECT * FROM Users;  -- Should show admin user
```

### Step 2: Backend Configuration (1 minute)

Edit `Backend/IME.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=db_a85a40_ime;Integrated Security=True;"
  }
}
```

**For remote SQL Server:**
```json
"DefaultConnection": "Data Source=YOUR_SERVER;Initial Catalog=db_a85a40_ime;User Id=YOUR_USER;Password=YOUR_PASSWORD;Encrypt=True;TrustServerCertificate=True;"
```

### Step 3: Start Backend (1 minute)

```bash
# Terminal 1
cd Backend/IME.API
dotnet restore
dotnet run
```

**Expected output:**
```
Now listening on: https://localhost:5001
Now listening on: http://localhost:5000
```

**Quick test:** Open browser → `https://localhost:5001/swagger`

### Step 4: Frontend Configuration (1 minute)

Edit `Frontend/src/utils/api.js`:

**For iOS Simulator (Mac):**
```javascript
const API_BASE_URL = 'https://localhost:5001/api';
```

**For Android Emulator:**
```javascript
const API_BASE_URL = 'http://10.0.2.2:5000/api';
```

**For Physical Device:**
```javascript
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:5000/api';
```

**Find your IP:**
- Windows: `ipconfig` → Look for IPv4
- Mac/Linux: `ifconfig` → Look for inet

### Step 5: Start Frontend (1 minute)

```bash
# Terminal 2 (new terminal window)
cd Frontend
npm install
npm start
```

**Then:**
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on phone

---

## ✅ First Login

**Default Admin Credentials:**
- Email: `admin@ime.org`
- Password: `Admin@123`

1. App opens → Splash screen
2. Navigate to Login screen
3. Enter credentials
4. Click "Login"
5. Should redirect to Home screen ✨

---

## 🎯 What You Should See

### Backend (Swagger UI)
- Authentication endpoints
- Member endpoints
- Activity endpoints
- All with JWT authorization

### Mobile App
- Splash Screen
- Login Screen
- Home Dashboard
- Profile Tab
- Activities Tab
- News Tab
- Notifications Tab

---

## 🐛 Common Issues & Quick Fixes

### Issue: Backend won't start

```bash
# Check .NET version
dotnet --version  # Should be 8.0.x

# Restore packages
cd Backend
dotnet clean
dotnet restore
dotnet build
```

### Issue: "Cannot connect to database"

```sql
-- Test connection in SSMS
-- Verify database exists
SELECT name FROM sys.databases WHERE name = 'db_a85a40_ime';

-- If empty, run Step 1 again
```

### Issue: Frontend can't connect to API

```bash
# 1. Verify backend is running
# Check Terminal 1 - should show "Now listening on..."

# 2. Test API in browser
# Open: https://localhost:5001/swagger

# 3. Update API_BASE_URL in Frontend/src/utils/api.js
# Use correct URL for your setup

# 4. Restart Expo
npm start -- --reset-cache
```

### Issue: "Network request failed" on device

```javascript
// Use your computer's IP, not localhost
// Find IP: Windows (ipconfig), Mac (ifconfig)

// Update Frontend/src/utils/api.js:
const API_BASE_URL = 'http://192.168.1.100:5000/api';
```

### Issue: Expo won't start

```bash
# Clear cache and reinstall
cd Frontend
rm -rf node_modules
rm package-lock.json
npm install
expo start -c
```

---

## 📱 Test the App

### Test Authentication:
- [x] Login with admin credentials
- [x] View home screen
- [x] Navigate to profile
- [x] Logout

### Test Activities:
- [x] View activities list
- [x] Pull to refresh
- [x] See FAB button (admin only)

### Test Signup:
- [x] Navigate to signup
- [x] Fill form
- [x] Submit registration
- [x] Should show "Pending admin approval"

---

## 🎉 Success Checklist

- [ ] Database created with tables
- [ ] Stored procedures created
- [ ] Admin user exists in database
- [ ] Backend API running on port 5001
- [ ] Swagger UI accessible
- [ ] Can login via Swagger
- [ ] Frontend running in Expo
- [ ] App shows on device/simulator
- [ ] Can login to mobile app
- [ ] Can navigate between screens

---

## 📚 Next Steps

Now that it's running:

1. **Explore the Code:**
   - Backend: `Backend/IME.API/Controllers/`
   - Frontend: `Frontend/src/screens/`

2. **Read Documentation:**
   - [README.md](README.md) - Full project overview
   - [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup
   - [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Architecture

3. **Add Features:**
   - Implement remaining controllers
   - Add file upload functionality
   - Integrate notifications
   - Add payment integration

4. **Customize:**
   - Update branding/colors
   - Add your content
   - Configure production settings

---

## 🆘 Still Having Issues?

1. **Check logs:**
   - Backend: Check terminal output
   - Frontend: Check Metro Bundler output
   - Database: Check SQL Server logs

2. **Verify setup:**
   - Run all database scripts
   - Check connection strings
   - Verify ports are not in use

3. **Test individually:**
   - Test database connection
   - Test API endpoints in Swagger
   - Test API URL in browser

4. **Review documentation:**
   - [SETUP_GUIDE.md](SETUP_GUIDE.md) has detailed troubleshooting
   - Check Prerequisites section

---

## 💡 Pro Tips

- **Use Swagger** to test API before mobile testing
- **Check backend terminal** for error messages
- **Use correct API URL** for your environment
- **Restart both** backend and frontend after config changes
- **Check database** to verify data is being saved

---

## 🎊 You're Ready!

Your IME application is now running locally. Time to build amazing features!

**Happy Coding! 🚀**
