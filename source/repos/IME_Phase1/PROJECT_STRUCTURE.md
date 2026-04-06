# IME Phase 1 - Project Structure Documentation

## Complete File Structure

```
IME_Phase1/
│
├── Backend/
│   ├── IME.API/                          # Web API Project
│   │   ├── Controllers/                  # API Controllers
│   │   │   ├── AuthController.cs         # Authentication endpoints
│   │   │   ├── MemberController.cs       # Member management
│   │   │   └── ActivityController.cs     # Activities management
│   │   ├── Properties/
│   │   │   └── launchSettings.json       # Launch configuration
│   │   ├── Uploads/                      # File storage directory
│   │   ├── appsettings.json              # Configuration
│   │   ├── appsettings.Development.json  # Dev configuration
│   │   ├── Program.cs                    # Application entry point
│   │   └── IME.API.csproj               # Project file
│   │
│   ├── IME.Core/                         # Domain Layer
│   │   ├── Models/                       # Domain models
│   │   │   ├── User.cs
│   │   │   ├── Member.cs
│   │   │   ├── Activity.cs
│   │   │   ├── News.cs
│   │   │   └── Role.cs
│   │   ├── DTOs/                         # Data Transfer Objects
│   │   │   ├── AuthDTOs.cs
│   │   │   ├── MemberDTOs.cs
│   │   │   ├── ActivityDTOs.cs
│   │   │   └── CommonDTOs.cs
│   │   ├── Interfaces/                   # Repository interfaces
│   │   │   ├── IAuthRepository.cs
│   │   │   ├── IMemberRepository.cs
│   │   │   └── IActivityRepository.cs
│   │   └── IME.Core.csproj
│   │
│   ├── IME.Infrastructure/               # Infrastructure Layer
│   │   ├── Data/                         # Database context
│   │   │   └── DatabaseContext.cs        # ADO.NET connection manager
│   │   ├── Repositories/                 # Repository implementations
│   │   │   ├── AuthRepository.cs         # Authentication data access
│   │   │   ├── MemberRepository.cs       # Member data access
│   │   │   └── ActivityRepository.cs     # Activity data access
│   │   ├── Services/                     # Business services
│   │   │   ├── JwtService.cs            # JWT token generation
│   │   │   ├── PasswordService.cs       # Password hashing (BCrypt)
│   │   │   └── FileStorageService.cs    # File management
│   │   └── IME.Infrastructure.csproj
│   │
│   └── IME.sln                           # Solution file
│
├── Frontend/                             # React Native Mobile App
│   ├── src/
│   │   ├── screens/                      # App screens
│   │   │   ├── SplashScreen.js
│   │   │   ├── LoginScreen.js
│   │   │   ├── SignupScreen.js
│   │   │   ├── ForgotPasswordScreen.js
│   │   │   ├── HomeScreen.js
│   │   │   ├── ProfileScreen.js
│   │   │   ├── ActivitiesScreen.js
│   │   │   ├── NewsScreen.js
│   │   │   └── NotificationsScreen.js
│   │   ├── components/                   # Reusable components
│   │   ├── services/                     # API service layer
│   │   │   ├── authService.js
│   │   │   ├── memberService.js
│   │   │   └── activityService.js
│   │   ├── navigation/                   # Navigation setup
│   │   │   └── AppNavigator.js
│   │   ├── context/                      # React Context
│   │   │   └── AuthContext.js
│   │   ├── utils/                        # Utilities
│   │   │   └── api.js                    # Axios configuration
│   │   └── assets/                       # Images, fonts
│   ├── App.js                            # App entry point
│   ├── app.json                          # Expo configuration
│   ├── babel.config.js                   # Babel config
│   └── package.json                      # Dependencies
│
├── Database/                             # Database scripts
│   ├── Tables/
│   │   └── 01_CreateTables.sql          # Create all tables
│   ├── StoredProcedures/
│   │   ├── 03_AuthenticationProcedures.sql
│   │   ├── 04_MemberProcedures.sql
│   │   ├── 05_ModulesProcedures.sql
│   │   └── 06_NotificationsAndMiscProcedures.sql
│   └── InitialData/
│       └── 02_InsertInitialData.sql     # Insert seed data
│
├── README.md                             # Main documentation
├── SETUP_GUIDE.md                        # Setup instructions
├── PAYMENT_INTEGRATION.md                # Payment guide
├── PROJECT_STRUCTURE.md                  # This file
└── .gitignore                            # Git ignore rules
```

## Architecture Overview

### Backend Architecture

```
┌─────────────────────────────────────────┐
│         API Controllers Layer           │
│  (AuthController, MemberController)     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Service Layer                   │
│  (JwtService, PasswordService)          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Repository Layer (Interfaces)      │
│  (IAuthRepository, IMemberRepository)   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Repository Implementation (ADO.NET)    │
│  (AuthRepository, MemberRepository)     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│        Database Context                 │
│     (SqlConnection, SqlCommand)         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         SQL Server Database             │
│     (Stored Procedures, Tables)         │
└─────────────────────────────────────────┘
```

### Frontend Architecture

```
┌─────────────────────────────────────────┐
│            UI Screens                   │
│  (LoginScreen, HomeScreen, etc.)        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│          Context Layer                  │
│         (AuthContext)                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Service Layer                   │
│  (authService, memberService)           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│          API Client (Axios)             │
│     (HTTP requests with JWT)            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Backend API                     │
│    (ASP.NET Core Web API)               │
└─────────────────────────────────────────┘
```

## Key Components Explanation

### Backend Components

#### 1. Controllers
- **Purpose:** Handle HTTP requests and responses
- **Responsibilities:**
  - Route mapping
  - Request validation
  - Call appropriate services/repositories
  - Return formatted responses

#### 2. Models
- **Purpose:** Represent database entities
- **Examples:** User, Member, Activity, News
- **Properties:** Map to database columns

#### 3. DTOs (Data Transfer Objects)
- **Purpose:** Transfer data between layers
- **Types:**
  - Request DTOs (incoming data)
  - Response DTOs (outgoing data)
- **Benefits:**
  - Hide internal structure
  - Reduce data transfer
  - Validation

#### 4. Interfaces
- **Purpose:** Define contracts for repositories
- **Benefits:**
  - Loose coupling
  - Easy testing
  - Dependency injection

#### 5. Repositories
- **Purpose:** Data access logic using ADO.NET
- **Methods:**
  - CRUD operations
  - Call stored procedures
  - Map data to models

#### 6. Services
- **JwtService:** Generate and validate JWT tokens
- **PasswordService:** Hash and verify passwords using BCrypt
- **FileStorageService:** Handle file uploads and storage

### Frontend Components

#### 1. Screens
- **Purpose:** UI views for different features
- **Examples:**
  - Authentication: Login, Signup
  - Main: Home, Profile, Activities
  - Content: News, Media, Notifications

#### 2. Services
- **Purpose:** API communication layer
- **Responsibilities:**
  - Make HTTP requests
  - Handle responses
  - Error handling

#### 3. Context
- **Purpose:** Global state management
- **AuthContext:**
  - User authentication state
  - Login/logout functions
  - Token management

#### 4. Navigation
- **Purpose:** App navigation structure
- **Types:**
  - Stack Navigator (auth flow)
  - Tab Navigator (main app)

### Database Components

#### 1. Tables
- **Purpose:** Store application data
- **Categories:**
  - User management (Users, Roles, Members)
  - Content (Activities, News, Media)
  - Support (Notifications, Attachments)

#### 2. Stored Procedures
- **Purpose:** Encapsulate database logic
- **Benefits:**
  - Better performance
  - Security
  - Maintainability
  - Reusability

#### 3. Relationships
```
Users ←→ Members (One-to-One)
Users ←→ Roles (Many-to-One)
Members ←→ Designation (Many-to-One)
Activities ←→ ActivityAttachments (One-to-Many)
Members ←→ MembershipPayment (One-to-Many)
```

## Data Flow Examples

### 1. Login Flow

```
User enters credentials
        ↓
LoginScreen (Frontend)
        ↓
authService.login()
        ↓
API: POST /api/auth/login
        ↓
AuthController.Login()
        ↓
PasswordService.VerifyPassword()
        ↓
AuthRepository.ValidateUserCredentialsAsync()
        ↓
Execute sp_UserLogin stored procedure
        ↓
Return User data
        ↓
JwtService.GenerateToken()
        ↓
Return token to frontend
        ↓
Store token in AsyncStorage
        ↓
Update AuthContext
        ↓
Navigate to HomeScreen
```

### 2. Create Activity Flow

```
Admin fills activity form
        ↓
ActivitiesScreen (Frontend)
        ↓
activityService.create()
        ↓
API: POST /api/activity [Authorize(Roles="Admin")]
        ↓
ActivityController.Create()
        ↓
Extract UserId from JWT token
        ↓
ActivityRepository.CreateActivityAsync()
        ↓
Execute sp_CreateActivity stored procedure
        ↓
Return ActivityId
        ↓
Trigger notification service
        ↓
Send push notification to members
        ↓
Return success response
        ↓
Refresh activities list on frontend
```

### 3. File Upload Flow

```
User selects file
        ↓
Frontend (expo-image-picker)
        ↓
Convert to multipart/form-data
        ↓
API: POST /api/upload
        ↓
FileStorageService.SaveFileAsync()
        ↓
Create folder: ModuleName-RecordId
        ↓
Generate unique filename
        ↓
Save file to disk
        ↓
Store file path in database
        ↓
Return file URL
        ↓
Update record with attachment path
```

## Security Implementation

### 1. Authentication
- JWT tokens for stateless auth
- Token includes: UserId, RoleId, RoleName, MemberId
- Token expiry: 480 minutes (configurable)

### 2. Authorization
- Role-based access control
- `[Authorize]` attribute on controllers
- `[Authorize(Roles = "Admin")]` for admin-only endpoints

### 3. Password Security
- BCrypt hashing algorithm
- Salt automatically generated
- Work factor: 11 (default)

### 4. SQL Injection Prevention
- Parameterized queries
- Stored procedures
- No dynamic SQL

### 5. API Security
- HTTPS only in production
- CORS configuration
- Request validation
- File upload validation

## File Naming Conventions

### Backend C# Files
- **Controllers:** `{Entity}Controller.cs` (e.g., AuthController.cs)
- **Models:** `{Entity}.cs` (e.g., User.cs, Member.cs)
- **DTOs:** `{Entity}DTOs.cs` (e.g., AuthDTOs.cs)
- **Repositories:** `{Entity}Repository.cs` (e.g., AuthRepository.cs)
- **Interfaces:** `I{Entity}Repository.cs` (e.g., IAuthRepository.cs)
- **Services:** `{Name}Service.cs` (e.g., JwtService.cs)

### Frontend JavaScript Files
- **Screens:** `{Name}Screen.js` (e.g., LoginScreen.js)
- **Services:** `{entity}Service.js` (e.g., authService.js)
- **Components:** `{Name}.js` (e.g., Header.js, ActivityCard.js)
- **Context:** `{Name}Context.js` (e.g., AuthContext.js)

### Database Files
- **Tables:** `01_CreateTables.sql`
- **Initial Data:** `02_InsertInitialData.sql`
- **Stored Procedures:** `{Number}_{Category}Procedures.sql`

## Development Workflow

### Adding a New Feature

1. **Database:**
   - Create/modify tables
   - Create stored procedures
   - Test procedures

2. **Backend:**
   - Create/update models
   - Create DTOs
   - Create repository interface
   - Implement repository
   - Create/update controller
   - Test with Swagger

3. **Frontend:**
   - Create service methods
   - Create/update screens
   - Update navigation
   - Test on device

### Testing Checklist

- [ ] Database procedures work correctly
- [ ] API endpoints return expected responses
- [ ] Authentication/Authorization works
- [ ] Frontend displays data correctly
- [ ] Error handling works
- [ ] File uploads work
- [ ] Notifications trigger properly

## Best Practices

### Backend
- Use async/await for database calls
- Implement proper error handling
- Return consistent API responses
- Use DTOs for all API communication
- Never expose sensitive data
- Log important operations

### Frontend
- Handle loading states
- Display user-friendly errors
- Validate input before sending
- Use pull-to-refresh on lists
- Implement proper navigation
- Cache data when appropriate

### Database
- Use stored procedures
- Index frequently queried columns
- Avoid N+1 queries
- Use transactions for multi-step operations
- Implement soft deletes where appropriate

---

This structure ensures:
- ✅ Clean separation of concerns
- ✅ Easy to test and maintain
- ✅ Scalable for future features
- ✅ Secure implementation
- ✅ Following industry best practices
