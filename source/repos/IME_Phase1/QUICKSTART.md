# IME Mobile App - Quick Start Guide

## 🚀 Get Up and Running in 10 Minutes

### Prerequisites Check
```bash
# Check Node.js (should be v18+)
node --version

# Check npm
npm --version

# Check .NET SDK (should be 8.0)
dotnet --version

# Check SQL Server
# Ensure SQL Server is running
```

### Step 1: Database Setup (2 minutes)

1. Open SQL Server Management Studio (SSMS)
2. Connect to your SQL Server instance
3. Execute scripts in order:
   ```sql
   -- Run these files from Database folder:
   Database/01_CreateTables.sql
   Database/02_SeedData.sql
   ```
4. Verify: You should see IME_DB database with all tables

### Step 2: Backend Setup (3 minutes)

```bash
# Navigate to backend
cd Backend

# Update connection string
# Edit IME.API/appsettings.Development.json
# Change "Server=localhost..." to your SQL Server details

# Restore packages and build
dotnet restore
dotnet build

# Run the API
dotnet run --project IME.API

# You should see: "Now listening on: https://localhost:5001"
```

Test the API:
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"healthy"}
```

### Step 3: Frontend Setup (5 minutes)

```bash
# Navigate to frontend
cd Frontend

# Install dependencies
npm install

# Update API URL in .env file
echo "API_BASE_URL=http://localhost:5000/api" > .env

# Start Expo
npm start
```

A QR code will appear in terminal.

### Step 4: Run on Device

**Option A: Physical Device**
1. Install "Expo Go" app from Play Store/App Store
2. Scan the QR code
3. App will load on your device

**Option B: Android Emulator**
1. Open Android Studio
2. Start an emulator
3. Press `a` in Expo terminal

**Option C: iOS Simulator** (Mac only)
1. Press `i` in Expo terminal

### Step 5: Login

Use these test accounts:

**Admin:**
- Email: `admin@ime.org`
- Password: `Admin@123`

**Member:**
- Email: `member@ime.org`
- Password: `Member@123`

## ✅ Verify Everything Works

1. **Login**: Use admin credentials
2. **View Activities**: Should see sample activity
3. **View News**: Should see welcome news
4. **Admin Dashboard**: Click ⚙️ Admin Dashboard button
5. **Create Activity**: Go to Admin → Activity Form
6. **View Profile**: Check profile section

## 🐛 Common Issues & Fixes

### Backend not starting?
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill the process or change port in launchSettings.json
```

### Frontend can't connect to API?
```bash
# For Android Emulator, use:
API_BASE_URL=http://10.0.2.2:5000/api

# For Physical Device on same WiFi, use your PC IP:
ipconfig  # Windows
ifconfig  # Mac/Linux
API_BASE_URL=http://192.168.1.100:5000/api
```

### Database connection error?
```sql
-- Enable TCP/IP in SQL Server Configuration Manager
-- Restart SQL Server service
-- Check firewall allows port 1433
```

### Metro bundler cache issues?
```bash
expo start -c  # Clear cache
```

## 📱 Next Steps

1. **Explore Features**: 
   - Register for an activity
   - View media gallery
   - Check notifications

2. **Admin Features**:
   - Approve new members
   - Create news articles
   - Manage content

3. **Test Payments**:
   - Use Razorpay test mode
   - Generate QR codes

4. **Customize**:
   - Update colors in theme
   - Add your logo
   - Modify content pages

## 📚 Documentation

- Full README: `README.md`
- API Docs: `API_DOCUMENTATION.md`
- Database Schema: `Database/01_CreateTables.sql`

## 🆘 Need Help?

- Check logs in API console
- Check Metro bundler console
- Check browser DevTools (for Expo web)
- Refer to Expo documentation: https://docs.expo.dev

## 🎉 You're Ready!

Your IME Mobile App is now running. Start building amazing features!
