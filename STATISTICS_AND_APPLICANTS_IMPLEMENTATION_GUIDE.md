# Statistics and Applicants Feature Implementation Guide

## Overview
This document outlines the implementation of Statistics and Applicants features for the Department Head Dashboard in ETMS.

## Database Setup Required

### 1. Run SQL Migration
Execute `ADD_USER_MANAGEMENT_FEATURES.sql` in Supabase SQL Editor to add:
- Ban management columns to `profiles` table
- `activity_logs` table for audit trail
- Proper RLS policies

## Implementation Steps

### Phase 1: Database & Services (Priority)
1. ✅ Add sidebar menu items
2. ✅ Create SQL migration file
3. ⏳ Create `statisticsService.js` for analytics
4. ⏳ Create `applicantService.js` for user management
5. ⏳ Create `activityLogService.js` for audit logging

### Phase 2: Statistics Page
1. ⏳ Create `StatisticsPage.jsx`
2. ⏳ Implement dashboard cards with real-time counts
3. ⏳ Add charts (optional - can use simple progress bars initially)

### Phase 3: Applicants Page
1. ⏳ Create `ApplicantsPage.jsx` with list view
2. ⏳ Implement search, filter, pagination
3. ⏳ Create `StudentDetailPage.jsx` for full profile view
4. ⏳ Implement ban/unban/delete actions

### Phase 4: Notifications & Activity Logging
1. ⏳ Add notifications for ban/unban/delete
2. ⏳ Implement activity logging for all actions
3. ⏳ Add safety checks (cannot ban self or other dept heads)

### Phase 5: Routing & Testing
1. ⏳ Add routes in `App.tsx`
2. ⏳ Test all functionality
3. ⏳ Verify RLS policies work correctly

## Files to Create

### Services (src/lib/depthead/)
- `statisticsService.js` - System analytics
- `applicantService.js` - Student account management
- `activityLogService.js` - Audit trail logging

### Pages (src/pages/depthead/)
- `StatisticsPage.jsx` - Analytics dashboard
- `ApplicantsPage.jsx` - Student list management
- `StudentDetailPage.jsx` - Individual student profile

## Key Features

### Statistics Page
- Real-time counts from Supabase
- Categories: Students, Trips, Registrations, Reports, Complaints, Notifications
- Simple card-based layout matching existing design

### Applicants Page
- Searchable student list
- Filter by status (Active/Banned)
- Pagination (20 per page)
- Actions: View Profile, Ban, Unban, Delete

### Student Detail Page
- Complete profile overview
- All related data in tabs
- Quick actions menu

### Safety Features
- Confirmation dialogs for destructive actions
- Cannot ban/delete self
- Cannot ban/delete other department heads
- Activity logging for accountability
- Notifications to affected students

## Database Schema

### profiles table (additions)
```sql
is_banned BOOLEAN DEFAULT FALSE
ban_reason TEXT
banned_at TIMESTAMP WITH TIME ZONE
banned_by UUID REFERENCES profiles(id)
```

### activity_logs table (new)
```sql
id UUID PRIMARY KEY
admin_id UUID NOT NULL
action TEXT NOT NULL
target_user_id UUID
target_user_name TEXT
details JSONB
created_at TIMESTAMP WITH TIME ZONE
```

## Next Steps

1. **Run the SQL migration** in Supabase SQL Editor
2. **Create services** for data fetching and management
3. **Build pages** one at a time (Statistics → Applicants → Student Detail)
4. **Add routes** and test thoroughly

This is a large feature set that should be implemented incrementally to ensure quality and stability.
