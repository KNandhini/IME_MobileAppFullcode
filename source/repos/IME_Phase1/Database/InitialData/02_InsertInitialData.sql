-- Initial Data for IME Application
USE [db_a85a40_ime];
GO

-- Insert Default Roles
INSERT INTO Roles (RoleName, IsActive) VALUES ('Admin', 1);
INSERT INTO Roles (RoleName, IsActive) VALUES ('Member', 1);
GO

-- Insert Default Designations
INSERT INTO Designation (DesignationName, IsActive) VALUES ('Municipal Engineer', 1);
INSERT INTO Designation (DesignationName, IsActive) VALUES ('Assistant Engineer', 1);
INSERT INTO Designation (DesignationName, IsActive) VALUES ('Executive Engineer', 1);
INSERT INTO Designation (DesignationName, IsActive) VALUES ('Superintendent Engineer', 1);
INSERT INTO Designation (DesignationName, IsActive) VALUES ('Chief Engineer', 1);
INSERT INTO Designation (DesignationName, IsActive) VALUES ('Junior Engineer', 1);
INSERT INTO Designation (DesignationName, IsActive) VALUES ('Project Manager', 1);
INSERT INTO Designation (DesignationName, IsActive) VALUES ('Others', 1);
GO

-- Insert Support Categories
INSERT INTO SupportCategory (CategoryName, IsActive) VALUES ('Technical Support', 1);
INSERT INTO SupportCategory (CategoryName, IsActive) VALUES ('Legal Support', 1);
INSERT INTO SupportCategory (CategoryName, IsActive) VALUES ('Health Support', 1);
INSERT INTO SupportCategory (CategoryName, IsActive) VALUES ('Financial Support', 1);
INSERT INTO SupportCategory (CategoryName, IsActive) VALUES ('Higher Education Support', 1);
GO

-- Insert Default Admin User
-- Password: Admin@123 (this should be hashed in actual implementation using BCrypt)
DECLARE @AdminRoleId INT = (SELECT RoleId FROM Roles WHERE RoleName = 'Admin');

INSERT INTO Users (Email, PasswordHash, RoleId, IsActive)
VALUES ('admin@ime.org', '$2a$11$XqYvZ9BQRwI5E4TJqpKmPuXf3h3.tKP5L/hx0rJEX0M0yGZn8qGDO', @AdminRoleId, 1);
-- Note: Above hash is sample. In real implementation, use BCrypt.HashPassword("Admin@123")

DECLARE @AdminUserId INT = SCOPE_IDENTITY();

INSERT INTO Members (UserId, FullName, Address, ContactNumber, Gender, Age, DateOfBirth, Place, DesignationId, MembershipStatus)
VALUES (@AdminUserId, 'System Administrator', 'IME Head Office', '1234567890', 'Male', 35, '1989-01-01', 'Chennai', 5, 'Active');
GO

-- Insert Default Membership Fee
INSERT INTO MembershipFee (Amount, IsActive, EffectiveFrom, CreatedBy)
VALUES (1000.00, 1, GETDATE(), 1);
GO

-- Insert Static Content Pages
INSERT INTO StaticContentPages (PageKey, PageTitle, Content, CreatedBy)
VALUES
('History', 'History of Municipal Engineering',
'<h1>History of Municipal Engineering</h1>
<p>Municipal engineering is a branch of civil engineering that deals with the planning, design, construction, and maintenance of public infrastructure and services in urban areas. The field emerged during the Industrial Revolution as cities grew rapidly and needed organized systems for water supply, sewage, roads, and public buildings.</p>
<h2>Evolution</h2>
<p>The profession has evolved from basic sanitation and infrastructure to encompass sustainable development, smart cities, environmental protection, and advanced urban planning. Municipal engineers play a crucial role in creating livable, sustainable, and efficient urban environments.</p>
<h2>Key Milestones</h2>
<ul>
<li>19th Century: Development of modern sewage systems and water supply</li>
<li>20th Century: Focus on urban planning and transportation</li>
<li>21st Century: Smart cities, sustainability, and green infrastructure</li>
</ul>', 1),

('AboutInstitution', 'About Institution of Municipal Engineering',
'<h1>About Institution of Municipal Engineering</h1>
<p>The Institution of Municipal Engineering (IME) is a professional body dedicated to advancing the practice of municipal engineering and supporting professionals in this field.</p>
<h2>Our Mission</h2>
<p>To promote excellence in municipal engineering through education, professional development, networking, and advocacy for better urban infrastructure and services.</p>
<h2>Our Vision</h2>
<p>To be the leading professional organization for municipal engineers, fostering innovation and sustainable urban development.</p>
<h2>Activities</h2>
<ul>
<li>Professional development programs and workshops</li>
<li>Technical conferences and seminars</li>
<li>Networking opportunities for members</li>
<li>Recognition of outstanding achievements</li>
<li>Support services for members</li>
<li>Advocacy for the profession</li>
</ul>
<h2>Membership Benefits</h2>
<p>Members enjoy access to technical resources, professional networking, career support, continuing education opportunities, and exclusive member events.</p>', 1);
GO

PRINT 'Initial data inserted successfully';
