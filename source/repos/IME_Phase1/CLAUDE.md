# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IME Phase 1 is a mobile application for the Institution of Municipal Engineering. The stack is:

- **Backend**: ASP.NET Core 8.0 Web API — pure ADO.NET, **no Entity Framework**
- **Frontend**: React Native 0.81.5 with Expo ~54.0.0
- **Database**: SQL Server (hosted), all operations via stored procedures

## Commands

### Backend

```bash
cd Backend
dotnet restore
dotnet build
cd IME.API && dotnet run   # Swagger at https://localhost:5001/swagger
```

### Frontend

```bash
cd Frontend
npm install
npm start          # Expo dev server — press 'a' for Android emulator, scan QR for device
```

### Database Setup

Execute scripts in order in SQL Server Management Studio:

```
Database/Tables/01_CreateTables.sql
Database/InitialData/02_InsertInitialData.sql
Database/StoredProcedures/03_AuthenticationProcedures.sql
Database/StoredProcedures/04_MemberProcedures.sql
Database/StoredProcedures/05_ModulesProcedures.sql
Database/StoredProcedures/06_NotificationsAndMiscProcedures.sql
```

## Architecture

### Backend — Clean Architecture + Repository Pattern

```
Controllers (IME.API/Controllers)
  → Repository Interfaces (IME.Core/Interfaces)
  → Repository Implementations (IME.Infrastructure/Repositories)
  → DatabaseContext (IME.Infrastructure/Data/DatabaseContext.cs)
  → SQL Server stored procedures
```

`DatabaseContext` manages `SqlConnection`. Every repository method opens a connection, executes a stored procedure via `SqlCommand`, and maps the `SqlDataReader` to model objects manually. No ORM is used anywhere.

All API responses use the `ApiResponse<T>` wrapper with `Success`, `Message`, and `Data` fields — the frontend expects this structure.

Services registered in `Program.cs`: `DatabaseContext` (singleton), repositories (scoped), `JwtService`, `PasswordService`, `FileStorageService`, `EmailService`.

### Frontend — Context + Services + Screens

```
App.js → AuthContext (global auth state + AsyncStorage persistence)
       → AppNavigator (Stack + Bottom Tabs + Material Top Tabs)
       → Screens → Services (axios calls) → api.js (axios instance)
```

`Frontend/src/utils/api.js` is the single axios instance. Its request interceptor injects the JWT from `AsyncStorage` and sets `Content-Type` (skips it for `FormData` to preserve multipart boundary). Its response interceptor clears `authToken` and `userData` from `AsyncStorage` on 401.

State management is React Context API only — no Redux.

## Key Configuration

**Backend** (`Backend/IME.API/appsettings.json`):
- `ConnectionStrings.DefaultConnection` — SQL Server connection string
- `JwtSettings.ExpiryMinutes` — defaults to 480 minutes
- `FileStorage.UploadPath` — where uploaded files are saved (`Uploads/`)
- `Razorpay` — payment gateway keys (test keys in repo)
- `EmailSettings` — Gmail SMTP for password-reset emails

**Frontend** (`Frontend/src/utils/api.js`):
- `API_BASE_URL` — change this per environment:
  - Android emulator: `http://10.0.2.2:<port>/api`
  - Physical device: `http://YOUR_MACHINE_IP:<port>/api`
  - Currently set to port `51150`

## Data Access Pattern

All repository methods follow this structure:

```csharp
using var connection = _databaseContext.GetConnection();
using var command = new SqlCommand("sp_ProcedureName", connection)
{
    CommandType = CommandType.StoredProcedure
};
command.Parameters.AddWithValue("@Param", value);
connection.Open();
using var reader = command.ExecuteReader();
while (reader.Read())
{
    // map reader columns to model
}
```

## Authentication

- JWT tokens contain `UserId`, `RoleId`, `RoleName`, `Email` claims
- BCrypt used for password hashing (`PasswordService`)
- `[Authorize]` = any authenticated user; `[Authorize(Roles = "Admin")]` = admin only
- Frontend reads `user.roleName` from `AuthContext` to show/hide admin UI elements (FAB buttons, admin tabs)

## File Uploads

- Backend: `FileStorageService` saves to `Uploads/<ModuleName>-<RecordId>/<guid>.<ext>`; files served as static content at `/Uploads/`
- Frontend: `expo-image-picker` for images, `expo-document-picker` for documents; sends as `FormData` (do not set `Content-Type` manually — let the native HTTP client handle the multipart boundary)
- Max upload size: 100 MB (configured in `Program.cs` Kestrel and `FormOptions`)

## Adding a New Feature (end-to-end pattern)

1. Write stored procedure(s) in `Database/StoredProcedures/`
2. Add model in `IME.Core/Models/`, DTOs in `IME.Core/DTOs/`
3. Add interface `IXRepository` in `IME.Core/Interfaces/`
4. Implement `XRepository` in `IME.Infrastructure/Repositories/` using ADO.NET pattern above
5. Register in `Program.cs`: `builder.Services.AddScoped<IXRepository, XRepository>()`
6. Add `XController` in `IME.API/Controllers/` — inject `IXRepository`, return `ApiResponse<T>`
7. Add `xService.js` in `Frontend/src/services/` — call `api.get/post/put/delete`
8. Create screen in `Frontend/src/screens/`, wire into `AppNavigator`

## Controllers Reference

Auth, Member, Activity, Payment, Feed, Fundraise, RaiseFundPayment, Support, Club, Chat, MunicipalCorp, Achievements, Organisation, Media, Content, News, Circular, Podcasts, Notification, File (20 controllers total)
