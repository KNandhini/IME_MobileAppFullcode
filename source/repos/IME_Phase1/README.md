# IME Mobile App - Phase 1

Institution of Municipal Engineering Mobile Application built with React Native (Expo) and ASP.NET Core.

## 📋 Project Structure

```
IME_Phase1/
├── Frontend/              # React Native mobile app
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── context/      # React Context (Auth)
│   │   ├── navigation/   # React Navigation setup
│   │   ├── screens/      # All app screens
│   │   ├── services/     # API service layer
│   │   └── utils/        # Utilities (image picker, notifications)
│   ├── App.js
│   ├── package.json
│   └── app.json
│
└── Backend/              # ASP.NET Core Web API
    ├── IME.API/         # API Controllers
    ├── IME.Core/        # Business Logic, DTOs
    ├── IME.Infrastructure/ # Data Access (ADO.NET)
    └── IME.sln
```

## 🚀 Features

### Member Features
- ✅ Authentication (Login, Signup, Forgot Password)
- ✅ Profile Management (Edit Profile, Change Password)
- ✅ View & Register for Activities
- ✅ News, Media Gallery, Podcasts
- ✅ Support Services (Technical, Legal, Health, Financial, Education)
- ✅ GO & Circulars
- ✅ Hall of Fame (Achievements)
- ✅ Organisation Members
- ✅ Annual Fee Payment (Razorpay & UPI QR)
- ✅ Payment History
- ✅ Push Notifications
- ✅ Static Content (About, History)

### Admin Features
- ✅ Member Management (Approve/Reject/Delete)
- ✅ Activity Management (Create/Edit/Delete)
- ✅ Content Management (News, Media, Podcasts)
- ✅ Support Service Management
- ✅ Circular Management
- ✅ Achievement Management
- ✅ Organisation Member Management
- ✅ Set Annual Membership Fee
- ✅ Payment Reports
- ✅ Send Notifications

## 🛠️ Technology Stack

### Frontend
- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Stack, Bottom Tabs, Material Top Tabs)
- **UI Library**: React Native Paper (Material Design)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Storage**: AsyncStorage
- **Image Picker**: expo-image-picker
- **Document Picker**: expo-document-picker
- **Notifications**: expo-notifications

### Backend
- **Framework**: ASP.NET Core 8.0 Web API
- **Data Access**: Pure ADO.NET (SqlConnection, SqlCommand, SqlDataReader)
- **Architecture**: Clean Architecture with Repository Pattern
- **Authentication**: JWT Bearer Token
- **Password Hashing**: BCrypt
- **Database**: SQL Server

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- .NET 8.0 SDK
- SQL Server
- Android Studio / Xcode (for emulators)

### Backend Setup

1. **Navigate to Backend directory**
   ```bash
   cd Backend
   ```

2. **Update Connection String**
   Edit `IME.API/appsettings.Development.json`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost;Database=IME_DB;User Id=sa;Password=YourPassword;TrustServerCertificate=True;"
   }
   ```

3. **Run Database Setup Script**
   Execute the SQL script in `/Database/IME_Schema.sql` to create:
   - All tables
   - Stored procedures
   - Default admin user

4. **Build and Run**
   ```bash
   dotnet build
   dotnet run --project IME.API
   ```
   API will run at `https://localhost:5001`

### Frontend Setup

1. **Navigate to Frontend directory**
   ```bash
   cd Frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Update API Base URL**
   Edit `.env` file:
   ```
   API_BASE_URL=http://localhost:5000/api
   ```
   
   For Android emulator, use: `http://10.0.2.2:5000/api`
   For iOS simulator, use: `http://localhost:5000/api`
   For physical device, use your machine's IP: `http://192.168.1.100:5000/api`

4. **Start Expo Development Server**
   ```bash
   npm start
   ```

5. **Run on Device/Emulator**
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app for physical device

## 🔐 Default Credentials

After running the database setup script:

**Admin User:**
- Email: `admin@ime.org`
- Password: `Admin@123`

**Test Member:**
- Email: `member@ime.org`
- Password: `Member@123`

## 📱 Key Screens

### Public Screens
- Splash Screen
- Login
- Signup
- Forgot Password

### Member Screens
- Home Dashboard
- Activities List & Detail
- News, Media, Podcasts
- Activity Registration
- Payment (Razorpay & QR)
- Payment History
- Profile & Edit Profile
- Change Password
- Notifications
- Support Services
- Circulars
- Achievements
- Organisation Members

### Admin Screens
- Admin Dashboard
- Member Management
- Activity Form (Create/Edit)
- Content Management
- Fee Management
- Reports

## 🗄️ Database Schema

### Core Tables
- `Members` - User accounts
- `Roles` - Admin, Member roles
- `Activities` - Events and activities
- `ActivityRegistrations` - Member registrations
- `News`, `Media`, `Podcasts` - Content modules
- `Support` - Support services
- `Circulars` - GO & Circulars
- `Achievements` - Hall of Fame
- `Organisation` - Office bearers
- `Payments` - Payment transactions
- `Notifications` - Push notifications
- `Attachments` - File uploads
- `ContentPages` - Static pages

### Stored Procedures
All CRUD operations use stored procedures:
- `sp_Member_*` - Member operations
- `sp_Activity_*` - Activity operations
- `sp_Payment_*` - Payment operations
- etc.

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Activities
- `GET /api/activity` - Get all activities
- `GET /api/activity/{id}` - Get activity by ID
- `POST /api/activity` - Create activity (Admin)
- `PUT /api/activity/{id}` - Update activity (Admin)
- `DELETE /api/activity/{id}` - Delete activity (Admin)
- `POST /api/activity/register` - Register for activity
- `DELETE /api/activity/register/{id}` - Cancel registration

### Payments
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify-payment` - Verify payment
- `POST /api/payment/generate-qr` - Generate UPI QR
- `POST /api/payment/confirm-qr-payment` - Confirm QR payment
- `GET /api/payment/history/{memberId}` - Get payment history

### Notifications
- `GET /api/notification/user/{userId}` - Get user notifications
- `PUT /api/notification/{id}/read` - Mark as read
- `POST /api/notification` - Create notification (Admin)

### File Upload
- `POST /api/file/upload` - Upload single file
- `POST /api/file/upload-multiple` - Upload multiple files
- `POST /api/file/upload-profile-photo` - Upload profile photo
- `DELETE /api/file/delete/{attachmentId}` - Delete file

...and many more (70+ endpoints total)

## 🎨 UI/UX Design

- **Color Scheme**: Material Blue (#2196F3) as primary color
- **Design System**: Material Design via React Native Paper
- **Typography**: System default fonts
- **Icons**: Material Community Icons
- **Navigation**: Stack + Bottom Tabs + Material Top Tabs

## 📸 Screenshots

*(Add screenshots here)*

## 🧪 Testing

### Backend Testing
```bash
cd Backend
dotnet test
```

### Frontend Testing
```bash
cd Frontend
npm test
```

## 🚢 Deployment

### Backend Deployment
1. Publish the API:
   ```bash
   dotnet publish -c Release
   ```
2. Deploy to Azure App Service / IIS / Docker

### Frontend Deployment
1. Build APK/IPA:
   ```bash
   expo build:android
   expo build:ios
   ```
2. Or use EAS Build:
   ```bash
   eas build --platform android
   eas build --platform ios
   ```
3. Submit to Play Store / App Store

## 📝 Environment Variables

### Frontend (.env)
```
API_BASE_URL=http://localhost:5000/api
RAZORPAY_KEY_ID=your_key_id
```

### Backend (appsettings.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "..."
  },
  "JwtSettings": {
    "SecretKey": "...",
    "Issuer": "IME_API",
    "Audience": "IME_MobileApp",
    "ExpiryMinutes": 480
  },
  "Razorpay": {
    "KeyId": "...",
    "KeySecret": "..."
  }
}
```

## 🐛 Troubleshooting

### Backend Issues
1. **Connection String Error**: Check SQL Server is running and credentials are correct
2. **CORS Error**: Ensure frontend URL is added to CORS policy in `Program.cs`
3. **JWT Error**: Verify secret key length is at least 32 characters

### Frontend Issues
1. **API Connection Error**: Check API_BASE_URL in `.env` is correct
2. **Metro Bundler Cache**: Run `expo start -c` to clear cache
3. **Module Not Found**: Run `npm install` again
4. **Android Build Error**: Check Android SDK is installed correctly

## 📄 License

© 2024 Institution of Municipal Engineering. All rights reserved.

## 👥 Contributors

- Development Team
- Project Lead
- QA Team

## 📞 Support

For support, email: support@ime.org

## 🔄 Version History

### Version 1.0.0 (Phase 1)
- Initial release with core features
- Member and admin functionality
- Payment integration
- Push notifications
- File upload/download

## 🛣️ Roadmap (Phase 2)

- [ ] Event Calendar View
- [ ] In-app Chat/Messaging
- [ ] Document Library
- [ ] Member Directory
- [ ] CPD Hours Tracking
- [ ] Certificate Generation
- [ ] Meeting Minutes
- [ ] Attendance Tracking
- [ ] Advanced Reports & Analytics
- [ ] Multi-language Support

---

**Note**: This is Phase 1 implementation. Phase 2 features will be added in subsequent releases.
