# IME App – Phase 1 Master Prompt (Without Entity Framework)

## Project Requirement
Build a **Phase 1 mobile application** for the **Institution of Municipal Engineering (IME)** using:

- **Frontend:** React Native with Expo
- **Backend:** ASP.NET Core Web API (**without Entity Framework**)
- **Database:** SQL Server
- **Authentication:** JWT Token based authentication
- **Data Access:** **ADO.NET / Stored Procedures / SQL Queries only** (Do NOT use Entity Framework or EF Core)
- **Notifications:** Push notifications for all newly added content except new member registration
- **Roles:** Admin and Member
- **Attachments:** Store files in module-wise folders using naming convention like `ModuleName-Id`
- **Payment:** Use sample payment integration (Razorpay sample configuration / QR based sample flow)

---

## Important Technical Constraint
**Do NOT use Entity Framework / EF Core anywhere in the project.**

### Use only:
- `SqlConnection`
- `SqlCommand`
- `SqlDataReader`
- `SqlDataAdapter`
- `DataTable`
- Stored Procedures
- Parameterized SQL Queries
- Repository / Service pattern with ADO.NET

### Example DB Connection
```txt
Data Source=SQL5113.site4now.net;Initial Catalog=db_a85a40_ime;User Id=db_a85a40_ime_admin;Password=YOUR_DB_PASSWORD;Encrypt=True;TrustServerCertificate=True;
```

---

# Phase 1 Modules (Must Have)

## 1. Login / JWT Authentication
Create a login module with:
- Login using **email id + password**
- Password must be **hashed before storing in DB** (do not store plain text)
- Use **JWT token** after successful login
- Token should contain:
  - UserId
  - RoleId
  - RoleName
  - MemberId (if applicable)
  - Expiry
- Add refresh strategy if needed (optional for Phase 1)
- Role based authorization for Admin and Member

### Forgot Password
- User enters:
  - Email ID
  - Date of Birth
- If matched, allow reset password
- Reset password should:
  - Validate user
  - Hash the new password
  - Update in DB

---

## 2. Sign Up / Membership Registration
Create membership sign-up page where a new user can apply for IME membership.

### Required fields
- Full Name
- Address
- Contact Number
- Gender
- Age
- Email ID
- Date of Birth
- Place
- Designation
- If designation = **Others**, allow adding new designation inline and store it
- Profile Photo
- IME Role (default Member for signup)
- Membership Type (optional if needed later)

### Payment
- Membership registration should include a **sample payment flow**
- Show **Google Pa or some others payment gateway via QR code** (sample display)
- Also provide **sample Razorpay configuration code**
- On successful payment:
  - Create member record
  - Store payment record
  - Mark membership as active/pending based on admin decision

### Database Requirement
Create a **Member table** with:
- `DesignationId`
- `RoleId`

---

## 3. Member Profile Page
Create a profile page for logged-in members to:
- View personal details
- Update personal details
- Update profile photo
- View membership status
- View payment history
- Provide a link/button to reset password using:
  - Email ID
  - DOB validation

---

## 4. Role Management
Admin-only module.

### Features
- Create roles
- Update roles
- Activate / deactivate roles
- Map users/members to roles

### Minimum roles
- Admin
- Member

### Requirement
- Role based screen access
- Role based API authorization
- Role based menu visibility

---

## 5. Designation Management
No separate full page required.

### Behavior
- Show Designation as dropdown in signup/profile/admin forms
- If user selects **Others**:
  - Show input field to add new designation
  - Save new designation into Designation table
  - Refresh and include in dropdown list

---

## 6. Membership Amount & Payment Management
Admin should be able to:
- Set / update membership fee amount
- Activate current fee
- Maintain fee history (optional)

### Member View
- Show current membership amount
- Show payment status
- Allow sample payment

### Admin View
- Show list of members who paid
- Show:
  - Member Name
  - Designation
  - Amount
  - Payment Date
  - Payment Mode
  - Transaction Reference
  - Status

### Output
- This page must support:
  - Download
  - Print

---

## 7. Activities Module
### Member & Admin View Page
Show activities like a scrolling/newsletter style list.

### Admin Add Page
Admin can add future activities such as:
- Activity Name
- Details / Description
- Date
- Venue
- Time
- Chief Guest (optional)
- Poster / Invitation attachments

### Example
“Plant 100 trees on Friday”

### Required Features
- List view
- Details view
- Attachment download

- Push notification when new activity is added

---

## 8. News / Media / Podcasts
Create a combined module with **3 separate tabs**:
- News
- Media
- Podcasts

### View Access
- Both Admin and Member can view

### Admin Access
- Only Admin can add/update/delete content

### UI Behavior
- When user clicks each tab, show only respective content
- Style can be similar to story/feed style

### Data Types
#### News
- Title
- Short Description
- Full Content
- Date
- Cover Image
- Attachments

#### Media
- Photos
- Videos
- Event Album style view

#### Podcasts
- Audio/Video podcast entries
- Title
- Speaker / Host
- Description
- Media file / link

### Notification
Send push notification when new content is added

---

## 9. Notifications Module
Implement notifications for:
- Activities
- News
- Media
- Podcasts
- Support entries
- GO & Circular
- Achievements
- Admin / Organisation updates
- Any newly added content **except new member registration**

### Requirement
- Use push notifications in mobile app
- Maintain notification history in DB
- Show in-app notification list
- Mark as read / unread
- Deep link to respective module if possible

---

## 10. Support Module
Create a single page with tabs for:

- Technical Support
- Legal Support
- Health Support
- Financial Support
- Higher Education Support

### UI Requirements
- Each support type should be a tab
- Add icon/button to create new support entry (Admin only)
- On clicking a tab, show list of respective support items
- Show:
  - Supported person’s photo
  - Name
  - Title (highlighted)
- On clicking title:
  - Open full support detail like a **sheet view**
  - Sheet should be printable / downloadable
- If attachments exist:
  - Show attachment names below the sheet
  - Allow download

### Common Fields
- Photo
- Title (max 20 chars for summary)
- Description
- Attachments
- Date
- Company or Individual
- Full detail sheet output

### Notification
Send push notification when new support entry is added

---

## 11. GO & Circular Corner
Create an announcements / circulars module.

### Features
- Admin can add GO / circular / announcement
- Members & Admin can view
- Attachments supported
- Download / print supported
- Notification on new circular

---

## 12. Members Achievements (Hall of Fame)
### Member & Admin View
- Show achievement cards/list
- Include photo
- Highlight achievement

### Admin Add Page
- Admin can add achievements

### Fields
- Member Name
- Photo
- Achievement Title
- Description
- Date
- Supporting attachment (optional)

### Notification
Push notification when new achievement is added

---

## 13. Admin / Organisation Page
Create a page to display:
- All admin / office bearer photos
- Name
- Designation
- Role / position

### Admin Maintenance
Admin can add/update/remove organisation entries

---

## 14. History of Municipal Engineering
Create a **1-page content module**.

### Requirement
- Fetch/prepare content from internet as reference (admin manageable content in DB)
- Store content in DB
- Display as formatted read-only page in app
- Admin can edit/update content later

---

## 15. About Institution of Municipal Engineering
Create a **1-page content module**.

### Requirement
- Fetch/prepare content from internet as reference (admin manageable content in DB)
- Store content in DB
- Display as formatted read-only page in app
- Admin can edit/update content later

---

# File / Attachment Storage Requirement
All attachments must be stored physically in module-wise folders.

## Naming convention
Use:
- `Activities-1`
- `News-5`
- `Support-10`
- `Circular-3`
- `Achievement-2`

### Rule
- Folder name = `ModuleName-RecordId`
- Save file path/link in DB
- Allow download by stored path
- Preserve original file name for display if needed

---

# Architecture Requirement (Very Important)
## Backend must use:
- ASP.NET Core Web API
- **ADO.NET only**
- Stored procedures preferred
- Repository pattern
- Service layer
- DTOs / ViewModels
- JWT authentication
- SQL Server

## Explicitly Do NOT Use
- Entity Framework
- EF Core
- LINQ-to-Entities
- Code First Migrations

---

# Suggested SQL Server Tables (Phase 1)
Create SQL tables for:

- `Roles`
- `Users`
- `Members`
- `Designation`
- `MembershipFee`
- `MembershipPayment`
- `Activities`
- `ActivityAttachments`
- `News`
- `NewsAttachments`
- `Media`
- `MediaAttachments`
- `Podcasts`
- `PodcastAttachments`
- `Notifications`
- `SupportCategory`
- `SupportEntries`
- `SupportAttachments`
- `GOCircular`
- `GOCircularAttachments`
- `Achievements`
- `AchievementAttachments`
- `OrganisationMembers`
- `StaticContentPages` (for History / About Institution)
- `AuditLog` (optional but recommended)

---

# Security Requirements
- Hash passwords using:
  - BCrypt (preferred) or PBKDF2
- Never store plain text passwords
- JWT secret in configuration
- Secure API endpoints with `[Authorize]`
- Use role-based policies
- Validate file uploads
- Restrict file types and file size
- Use parameterized SQL queries only
- Prevent SQL injection
- Log exceptions

---

# API Expectations
Create REST APIs for all Phase 1 modules using:
- Controllers
- Services
- Repositories (ADO.NET)
- Stored procedures or SQL queries

### Example
- `/api/auth/login`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`
- `/api/member/signup`
- `/api/member/profile`
- `/api/roles`
- `/api/designation`
- `/api/membership-fee`
- `/api/membership-payment`
- `/api/activities`
- `/api/news`
- `/api/media`
- `/api/podcasts`
- `/api/notifications`
- `/api/support`
- `/api/go-circular`
- `/api/achievements`
- `/api/organisation`
- `/api/content-pages`

---

# Mobile App Expectations (React Native + Expo)
Build screens for:
- Splash screen
- Login
- Forgot password
- Signup / Membership registration
- OTP/verification placeholder (optional if added later)
- Home dashboard
- Profile
- Activities
- News / Media / Podcasts (tabbed)
- Notifications
- Support (tabbed)
- GO & Circular
- Achievements / Hall of Fame
- Admin / Organisation
- History
- About Institution
- Membership payment
- Paid members list (admin)
- Role management (admin)
- Static content admin editor (optional admin screen)

---

# Payment Requirement
Use **sample payment implementation only** for Phase 1.

### Include
- Sample Razorpay configuration code
- QR code based Google Pay display option
- Payment success/failure callback handling
- Save transaction details in DB

---

# Push Notification Requirement
Implement push notifications using Expo push notifications (or compatible service).

### Trigger notification when:
- New Activity added
- New News/Media/Podcast added
- New Support entry added
- New GO/Circular added
- New Achievement added
- New Organisation update added
- Any new content except new member registration

---

# Deliverable Expectation
Generate the project as a **production-ready Phase 1 blueprint** with:

1. SQL Server table design
2. Stored procedures
3. ASP.NET Core Web API using **ADO.NET only**
4. JWT authentication
5. Role based authorization
6. React Native Expo screen structure
7. File upload & folder storage logic
8. Push notification flow
9. Sample payment integration
10. Download / print support for applicable pages

---

# Final Instruction for the Generator / Developer
**Build the entire Phase 1 solution strictly WITHOUT Entity Framework.**
Use:
- SQL Server
- Stored Procedures
- ADO.NET
- ASP.NET Core Web API
- React Native with Expo

If any sample code is generated, it must:
- Avoid EF Core packages
- Avoid `DbContext`
- Avoid migrations
- Use repository classes with `SqlConnection`
- Use DTOs and stored procedures
- Be modular and scalable for future Phase 2 expansion
