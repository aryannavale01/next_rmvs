# NGO ERP Management System - Product Requirements Document (PRD)

Version: 2.0
Status: Frontend Complete

## 1. Executive Summary
This document defines the functional and non-functional requirements for a production-grade NGO ERP built with Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma, Supabase PostgreSQL, Better Auth, and Supabase Storage.

## 2. Vision
Build a centralized ERP that manages public website, beneficiaries, members, courses, enrollments, certificates, training, coupons, notifications, reports, and administration.

## 3. Objectives
- Digital-first NGO operations
- Secure role-based access
- Responsive UI
- Auditability
- Scalability
- Automation

## 4. Stakeholders
- Visitors
- Registered Users
- Trainers
- Admins
- Super Admins
- NGO Management

## 5. Roles & Permissions
### Visitor
View public pages, browse courses, register.
### User
Profile, enrollments, certificates, notifications.
### Trainer
Assigned courses, attendance, student progress.
### Admin
CRUD for users, courses, certificates, coupons, reports.
### Super Admin
System settings, RBAC, audit logs, admin management.

## 6. Functional Modules
### Authentication
Login, Register, Email Verification, Forgot Password, Session Management.
Acceptance:
- Protected routes
- Role-based redirects
- Secure cookies

### Public Website
Home, About, Programs, Courses, Events, Gallery, Testimonials, Contact, FAQ.

### User Dashboard
Dashboard, Profile, My Courses, Applications, Certificates, Notifications, Activity.

### Admin Dashboard
Dashboard analytics, User Management, Course Management, Enrollment Management, Trainer Management, Certificate Management, Coupon Management, Reports, Gallery, CMS, Settings.

### Course Management
Create/edit/delete/archive, syllabus upload, trainer assignment, seats, duration, eligibility, status.

### Enrollment Workflow
Draft -> Submitted -> Under Review -> Approved/Rejected -> Enrolled -> Completed -> Certified.

### Certificate System
Unique certificate ID, QR verification, PDF generation, download, public verification page.

### Notifications
In-app + email, read/unread, announcement broadcasts.

### Reports
User, enrollment, course completion, certificate, exports.

## 7. Database (High Level)
Users, Roles, Profiles, Courses, Categories, Enrollments, Trainers, Attendance, Certificates, Coupons, Notifications, AuditLogs, Settings, Gallery.

## 8. API Guidelines
REST endpoints under /api/v1
CRUD standards
Pagination, filtering, sorting
Consistent error responses.

## 9. Validation Rules
Email uniqueness, strong passwords, required profile fields, upload validation, server-side validation.

## 10. Security
RBAC, CSRF protection, XSS mitigation, SQL injection prevention via Prisma, rate limiting, audit logging.

## 11. Performance
Lighthouse >90, lazy loading, image optimization, caching, pagination.

## 12. Accessibility
WCAG AA, keyboard navigation, ARIA labels, color contrast.

## 13. Testing
Unit, integration, Playwright E2E, regression, accessibility.

## 14. Deployment
Frontend: Vercel
Backend: Node.js
Database: Supabase PostgreSQL
Storage: Supabase Storage

## 15. Development Roadmap
Phase 1 Frontend ✅
Phase 2 Database
Phase 3 Authentication
Phase 4 APIs
Phase 5 Business Logic
Phase 6 Testing
Phase 7 Optimization
Phase 8 Production Deployment

## 16. Acceptance Criteria
Every module has complete CRUD, validation, responsive UI, RBAC, logging, and automated tests before release.

