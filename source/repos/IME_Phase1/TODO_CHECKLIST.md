# TODO Checklist - Complete Phase 1

Use this checklist to track remaining work. Items are organized by priority.

---

## 🔴 HIGH PRIORITY (Complete First)

### Backend Controllers (8-10 hours)

#### Payment Module
- [ ] Create `Backend/IME.API/Controllers/PaymentController.cs`
  - [ ] POST `/api/payment/create-order` - Create Razorpay order
  - [ ] POST `/api/payment/verify-payment` - Verify payment
  - [ ] POST `/api/payment/generate-qr` - Generate QR code
  - [ ] POST `/api/payment/confirm-qr-payment` - Confirm QR payment
  - [ ] GET `/api/payment/history/{memberId}` - Payment history
  - [ ] GET `/api/payment/all` - All payments (Admin)

#### Notification Module
- [ ] Create `Backend/IME.API/Controllers/NotificationController.cs`
  - [ ] GET `/api/notification/user/{userId}` - Get user notifications
  - [ ] PUT `/api/notification/{id}/read` - Mark as read
  - [ ] GET `/api/notification/unread-count/{userId}` - Unread count
  - [ ] POST `/api/notification` - Create notification (internal)

#### News Module
- [ ] Create `Backend/IME.API/Controllers/NewsController.cs`
  - [ ] GET `/api/news` - Get all news
  - [ ] GET `/api/news/{id}` - Get by ID
  - [ ] POST `/api/news` - Create (Admin)
  - [ ] PUT `/api/news/{id}` - Update (Admin)
  - [ ] DELETE `/api/news/{id}` - Delete (Admin)

#### Media Module
- [ ] Create `Backend/IME.API/Controllers/MediaController.cs`
  - [ ] GET `/api/media` - Get all media
  - [ ] GET `/api/media/{id}` - Get by ID
  - [ ] POST `/api/media` - Upload media (Admin)
  - [ ] DELETE `/api/media/{id}` - Delete (Admin)

#### Podcast Module
- [ ] Create `Backend/IME.API/Controllers/PodcastsController.cs`
  - [ ] GET `/api/podcasts` - Get all podcasts
  - [ ] GET `/api/podcasts/{id}` - Get by ID
  - [ ] POST `/api/podcasts` - Create (Admin)
  - [ ] PUT `/api/podcasts/{id}` - Update (Admin)
  - [ ] DELETE `/api/podcasts/{id}` - Delete (Admin)

#### Support Module
- [ ] Create `Backend/IME.API/Controllers/SupportController.cs`
  - [ ] GET `/api/support/categories` - Get all categories
  - [ ] GET `/api/support/category/{categoryId}` - Get by category
  - [ ] GET `/api/support/{id}` - Get by ID
  - [ ] POST `/api/support` - Create (Admin)
  - [ ] PUT `/api/support/{id}` - Update (Admin)

#### Circular Module
- [ ] Create `Backend/IME.API/Controllers/CircularController.cs`
  - [ ] GET `/api/circular` - Get all circulars
  - [ ] GET `/api/circular/{id}` - Get by ID
  - [ ] POST `/api/circular` - Create (Admin)
  - [ ] PUT `/api/circular/{id}` - Update (Admin)

#### Achievements Module
- [ ] Create `Backend/IME.API/Controllers/AchievementsController.cs`
  - [ ] GET `/api/achievements` - Get all achievements
  - [ ] GET `/api/achievements/{id}` - Get by ID
  - [ ] POST `/api/achievements` - Create (Admin)
  - [ ] PUT `/api/achievements/{id}` - Update (Admin)

#### Organisation Module
- [ ] Create `Backend/IME.API/Controllers/OrganisationController.cs`
  - [ ] GET `/api/organisation` - Get all members
  - [ ] GET `/api/organisation/{id}` - Get by ID
  - [ ] POST `/api/organisation` - Create (Admin)
  - [ ] PUT `/api/organisation/{id}` - Update (Admin)
  - [ ] DELETE `/api/organisation/{id}` - Delete (Admin)

#### Content Module
- [ ] Create `Backend/IME.API/Controllers/ContentController.cs`
  - [ ] GET `/api/content/{key}` - Get by key (History, AboutInstitution)
  - [ ] PUT `/api/content/{key}` - Update (Admin)

### File Upload (3-4 hours)

#### Backend
- [ ] Create `Backend/IME.API/Controllers/FileController.cs`
  - [ ] POST `/api/file/upload` - Upload file (multipart/form-data)
  - [ ] GET `/api/file/{path}` - Get file
  - [ ] DELETE `/api/file/{path}` - Delete file
- [ ] Add file upload to existing controllers:
  - [ ] Profile photo in MemberController
  - [ ] Activity attachments in ActivityController
  - [ ] News attachments in NewsController

#### Frontend
- [ ] Create `Frontend/src/components/ImagePicker.js`
- [ ] Create `Frontend/src/components/DocumentPicker.js`
- [ ] Create `Frontend/src/components/FileUploadButton.js`
- [ ] Create `Frontend/src/services/fileService.js`
- [ ] Add profile photo upload to ProfileScreen
- [ ] Add attachment upload to relevant screens

### Payment Screens (4-5 hours)

#### Frontend Payment Flow
- [ ] Create `Frontend/src/screens/PaymentScreen.js`
  - [ ] Display current membership fee
  - [ ] Razorpay payment button
  - [ ] QR code payment button
- [ ] Create `Frontend/src/screens/QRPaymentScreen.js`
  - [ ] Display QR code
  - [ ] Transaction reference input
  - [ ] Confirm button
- [ ] Create `Frontend/src/screens/PaymentHistoryScreen.js`
  - [ ] List all payments
  - [ ] Payment status
  - [ ] Receipt download
- [ ] Create `Frontend/src/screens/AdminPaymentsScreen.js` (Admin)
  - [ ] List all member payments
  - [ ] Filters (date, status)
  - [ ] Export button
- [ ] Create `Frontend/src/services/paymentService.js`
  - [ ] Implement all payment API calls
- [ ] Add navigation routes

---

## 🟡 MEDIUM PRIORITY (Complete Next)

### Frontend Detail Screens (6-8 hours)

- [ ] Create `Frontend/src/screens/ActivityDetailScreen.js`
  - [ ] Display full activity details
  - [ ] Show attachments
  - [ ] Download attachments
  
- [ ] Create `Frontend/src/screens/NewsDetailScreen.js`
  - [ ] Display full news article
  - [ ] Show cover image
  - [ ] Show attachments

- [ ] Create `Frontend/src/screens/MediaDetailScreen.js`
  - [ ] Photo gallery view
  - [ ] Video player
  - [ ] Full screen mode

- [ ] Create `Frontend/src/screens/PodcastDetailScreen.js`
  - [ ] Audio player
  - [ ] Play/pause controls
  - [ ] Progress bar

- [ ] Create `Frontend/src/screens/SupportDetailScreen.js`
  - [ ] Sheet view layout
  - [ ] Display all support details
  - [ ] Attachments list
  - [ ] Download button

- [ ] Create `Frontend/src/screens/CircularDetailScreen.js`
  - [ ] Display circular details
  - [ ] Attachments
  - [ ] Download/Print options

- [ ] Create `Frontend/src/screens/AchievementDetailScreen.js`
  - [ ] Display achievement details
  - [ ] Member photo
  - [ ] Supporting documents

### Frontend Content Screens (4-6 hours)

- [ ] Create `Frontend/src/screens/SupportScreen.js`
  - [ ] 5 tabs for categories
  - [ ] List items per category
  - [ ] Navigation to detail

- [ ] Create `Frontend/src/screens/CircularListScreen.js`
  - [ ] List all circulars
  - [ ] Search functionality
  - [ ] Filter by date

- [ ] Create `Frontend/src/screens/AchievementsScreen.js`
  - [ ] Grid/list of achievements
  - [ ] Photos
  - [ ] Navigation to detail

- [ ] Create `Frontend/src/screens/OrganisationScreen.js`
  - [ ] Display office bearers
  - [ ] Photos and designations
  - [ ] Contact info

- [ ] Create `Frontend/src/screens/HistoryScreen.js`
  - [ ] HTML content viewer
  - [ ] Formatted display

- [ ] Create `Frontend/src/screens/AboutInstitutionScreen.js`
  - [ ] HTML content viewer
  - [ ] Formatted display

### Frontend Admin Screens (8-10 hours)

- [ ] Create `Frontend/src/screens/Admin/AddActivityScreen.js`
- [ ] Create `Frontend/src/screens/Admin/AddNewsScreen.js`
- [ ] Create `Frontend/src/screens/Admin/AddMediaScreen.js`
- [ ] Create `Frontend/src/screens/Admin/AddPodcastScreen.js`
- [ ] Create `Frontend/src/screens/Admin/AddSupportScreen.js`
- [ ] Create `Frontend/src/screens/Admin/AddCircularScreen.js`
- [ ] Create `Frontend/src/screens/Admin/AddAchievementScreen.js`
- [ ] Create `Frontend/src/screens/Admin/AddOrganisationMemberScreen.js`
- [ ] Create `Frontend/src/screens/Admin/EditContentScreen.js`
- [ ] Create `Frontend/src/screens/Admin/RoleManagementScreen.js`
- [ ] Create `Frontend/src/screens/Admin/MemberApprovalScreen.js`

### Push Notifications (4-5 hours)

#### Backend
- [ ] Create `Backend/IME.Infrastructure/Services/PushNotificationService.cs`
  - [ ] RegisterDeviceToken method
  - [ ] SendNotification method
  - [ ] SendToAll method
  - [ ] SendToRole method
- [ ] Add notification triggers:
  - [ ] After creating activity
  - [ ] After creating news
  - [ ] After creating media
  - [ ] After creating podcast
  - [ ] After creating support
  - [ ] After creating circular
  - [ ] After creating achievement

#### Frontend
- [ ] Configure `Frontend/app.json` for notifications
- [ ] Update `Frontend/App.js`:
  - [ ] Request notification permissions
  - [ ] Register for push notifications
  - [ ] Get Expo push token
  - [ ] Send token to backend
  - [ ] Handle notification received
  - [ ] Handle notification tapped
- [ ] Configure deep linking:
  - [ ] Update app.json with scheme
  - [ ] Setup linking configuration
  - [ ] Handle navigation from notifications
- [ ] Update NotificationsScreen:
  - [ ] Load notifications from API
  - [ ] Mark as read functionality
  - [ ] Badge count

---

## 🟢 LOW PRIORITY (Polish & Enhancement)

### Download/Print Features (3-4 hours)

#### Backend
- [ ] Install PDF library: `dotnet add package iTextSharp`
- [ ] Create `Backend/IME.Infrastructure/Services/PDFService.cs`
  - [ ] GeneratePaymentReceipt method
  - [ ] GenerateMembershipReport method
  - [ ] GenerateCircularPDF method
- [ ] Add PDF endpoints to controllers

#### Frontend
- [ ] Install print library: `npm install expo-print`
- [ ] Add download buttons to:
  - [ ] Payment history
  - [ ] Circulars
  - [ ] Support details
  - [ ] Reports
- [ ] Implement share functionality

### UI Enhancements (3-4 hours)

- [ ] Add loading skeletons to list screens
- [ ] Improve error messages
- [ ] Add image placeholders
- [ ] Implement pull-to-refresh on all lists
- [ ] Add empty state illustrations
- [ ] Loading indicators on buttons
- [ ] Success/error toast messages
- [ ] Form validation improvements

### Additional Features (2-3 hours)

- [ ] Search functionality across modules
- [ ] Filters (date, category, status)
- [ ] Sorting options (date, name)
- [ ] Pagination UI controls
- [ ] Infinite scroll
- [ ] Image caching
- [ ] Offline support basics

### Inline Designation Add (1 hour)

- [ ] Update `Frontend/src/screens/SignupScreen.js`
  - [ ] Add "Others" option to designation picker
  - [ ] Show modal when "Others" selected
  - [ ] Input field for new designation
  - [ ] API call to create designation
  - [ ] Refresh dropdown
  - [ ] Auto-select new designation

---

## 📋 Testing Checklist

### Backend Testing
- [ ] Test all API endpoints in Swagger
- [ ] Test authentication with different roles
- [ ] Test file upload with different file types
- [ ] Test payment flow (test mode)
- [ ] Test notification creation
- [ ] Verify database records after operations

### Frontend Testing
- [ ] Test login flow
- [ ] Test signup flow
- [ ] Test forgot password flow
- [ ] Test all navigation routes
- [ ] Test pull-to-refresh on lists
- [ ] Test file upload
- [ ] Test payment flow
- [ ] Test notifications
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Test on physical device

### Integration Testing
- [ ] End-to-end signup to login
- [ ] Create activity and verify notification
- [ ] Upload file and verify storage
- [ ] Complete payment and verify status
- [ ] Admin actions and member visibility

---

## 📊 Progress Tracking

**Overall Progress:** 68%

**By Category:**
- Database: 100% ✅
- Backend API: 71% 🟡
- Frontend: 34% 🔴
- Documentation: 100% ✅

**Estimated Completion:**
- High Priority: 15-20 hours
- Medium Priority: 18-23 hours
- Low Priority: 8-11 hours
- **Total: 41-54 hours**

---

## 🎯 Quick Wins (Do These First)

1. **Payment Module** (2-3 hours)
   - Add PaymentController
   - Add PaymentScreen
   - Test with Razorpay test mode

2. **File Upload** (3-4 hours)
   - Add FileController
   - Add image/document pickers
   - Test profile photo upload

3. **News Module** (2-3 hours)
   - Add NewsController
   - Update NewsScreen to load data
   - Add NewsDetailScreen

4. **Notifications** (3-4 hours)
   - Add NotificationController
   - Update NotificationsScreen to load data
   - Add mark as read

**Complete these 4 items = 10-14 hours = Significant progress!**

---

## 💡 Tips for Faster Completion

1. **Follow Patterns:**
   - Copy ActivityController for other controllers
   - Copy ActivitiesScreen for other list screens
   - Same patterns throughout

2. **Use Tools:**
   - Swagger for API testing
   - Hot reload in Expo for UI
   - SQL Server Management Studio for DB

3. **Test as You Go:**
   - Test each controller in Swagger immediately
   - Test each screen in app immediately
   - Don't accumulate bugs

4. **Parallel Work:**
   - One person: Backend controllers
   - Another: Frontend screens
   - Can work simultaneously

5. **Reference Docs:**
   - PAYMENT_INTEGRATION.md for payment code
   - PROJECT_STRUCTURE.md for architecture
   - Existing code for patterns

---

**Start with High Priority items and work your way down!**

Good luck! 🚀
