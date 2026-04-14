# IME API Documentation

Base URL: `http://localhost:5000/api`

## Authentication Endpoints

### POST /auth/login
Login with email and password
```json
Request:
{
  "email": "admin@ime.org",
  "password": "Admin@123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "memberId": 1,
    "fullName": "Admin User",
    "email": "admin@ime.org",
    "roleName": "Admin"
  }
}
```

### POST /auth/register
Register new member
```json
Request:
{
  "email": "newuser@example.com",
  "password": "Password@123",
  "fullName": "John Doe",
  "phoneNumber": "9876543210"
}
```

### POST /auth/forgot-password
Request password reset
```json
Request:
{
  "email": "user@example.com"
}
```

## Activity Endpoints

### GET /activity
Get all activities

### GET /activity/{id}
Get activity details with participants and attachments

### POST /activity (Admin only)
Create new activity
```json
Request:
{
  "title": "Technical Workshop",
  "description": "Workshop on advanced engineering topics",
  "activityDate": "2024-06-15T10:00:00",
  "venue": "IME Office",
  "coordinator": "John Doe",
  "registrationDeadline": "2024-06-10T23:59:59",
  "status": "Upcoming"
}
```

### PUT /activity/{id} (Admin only)
Update activity

### DELETE /activity/{id} (Admin only)
Delete activity

### POST /activity/register
Register for an activity
```json
Request:
{
  "activityId": 1,
  "memberId": 5
}
```

## News Endpoints

### GET /news
Get all news articles

### GET /news/{id}
Get news detail with attachments

### POST /news (Admin only)
Create news article

### PUT /news/{id} (Admin only)
Update news article

### DELETE /news/{id} (Admin only)
Delete news article

## Media Endpoints

### GET /media?mediaType=Photo
Get media (photos/videos)
- Query params: `mediaType` (optional): "Photo" or "Video"

### GET /media/{id}
Get media details

### POST /media (Admin only)
Create media entry

### DELETE /media/{id} (Admin only)
Delete media

## Podcast Endpoints

### GET /podcasts
Get all podcasts

### GET /podcasts/{id}
Get podcast details

### POST /podcasts (Admin only)
Create podcast

### PUT /podcasts/{id} (Admin only)
Update podcast

### DELETE /podcasts/{id} (Admin only)
Delete podcast

## Support Endpoints

### GET /support/categories
Get all support categories

### GET /support/category/{categoryId}
Get support services by category
- Category IDs: 1=Technical, 2=Legal, 3=Health, 4=Financial, 5=Higher Education

### POST /support (Admin only)
Create support service

## Circular Endpoints

### GET /circular
Get all circulars (GO & Circular)

### GET /circular/{id}
Get circular details

### POST /circular (Admin only)
Create circular

## Achievement Endpoints

### GET /achievements
Get all achievements (Hall of Fame)

### POST /achievements (Admin only)
Add new achievement

## Organisation Endpoints

### GET /organisation
Get all organisation members (office bearers)

### POST /organisation (Admin only)
Add organisation member

## Content Endpoints

### GET /content/{pageKey}
Get static page content
- Page keys: "about", "history"

### PUT /content/{pageKey} (Admin only)
Update static page content

## Payment Endpoints

### POST /payment/create-order
Create Razorpay payment order
```json
Request:
{
  "memberId": 1,
  "amount": 5000.00,
  "description": "Annual Membership Fee 2024"
}
```

### POST /payment/verify-payment
Verify Razorpay payment
```json
Request:
{
  "orderId": "order_xxx",
  "paymentId": "pay_xxx",
  "signature": "sig_xxx"
}
```

### POST /payment/generate-qr
Generate UPI QR code for payment
```json
Request:
{
  "memberId": 1,
  "amount": 5000.00
}
```

### POST /payment/confirm-qr-payment
Confirm QR code payment
```json
Request:
{
  "paymentRequestId": 1,
  "transactionId": "123456789012"
}
```

### GET /payment/history/{memberId}
Get payment history for a member

### GET /payment/all (Admin only)
Get all payment transactions

### GET /payment/current-fee
Get current year annual fee

### POST /payment/set-fee (Admin only)
Set annual membership fee
```json
Request:
{
  "year": 2024,
  "feeAmount": 5000.00
}
```

## Notification Endpoints

### GET /notification/user/{userId}
Get user notifications

### PUT /notification/{notificationId}/read
Mark notification as read

### GET /notification/unread-count/{userId}
Get unread notification count

### POST /notification (Admin only)
Create notification
```json
Request:
{
  "userId": null,  // null for broadcast
  "title": "New Activity",
  "message": "Check out the new workshop",
  "type": "Activity",
  "referenceId": 1
}
```

### POST /notification/send-to-all (Admin only)
Send notification to all members

## File Upload Endpoints

### POST /file/upload
Upload single file (multipart/form-data)
- Form fields: `file`, `moduleName`, `recordId`

### POST /file/upload-multiple
Upload multiple files

### POST /file/upload-profile-photo
Upload profile photo
- Updates Members table with photo path

### GET /file/download/{*filePath}
Download file

### DELETE /file/delete/{attachmentId}?tableName=Activity
Delete uploaded file

## Member Endpoints (Admin)

### GET /member
Get all members (with pagination)

### POST /member/{memberId}/approve (Admin only)
Approve member registration

### PUT /member/{memberId}/reject (Admin only)
Reject member registration

### DELETE /member/{memberId} (Admin only)
Delete member

## Authorization

All authenticated endpoints require JWT Bearer token:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Admin-only endpoints require user to have "Admin" role.

## Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // validation errors if any
}
```

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error
