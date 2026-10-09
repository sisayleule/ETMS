-- =====================================================================================================================
-- FIX EXISTING ACCOUNTS - Reset passwords and ensure correct roles
-- =====================================================================================================================
-- Run this in Supabase SQL Editor if accounts already exist but you can't login

-- =====================================================================================================================
-- STEP 1: Check what accounts exist and their current roles
-- =====================================================================================================================

SELECT 
  au.email,
  au.email_confirmed_at,
  au.created_at,
  p.full_name,
  p.role,
  p.student_id_number,
  p.year_of_study
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email IN ('depthead@ambo.edu', 'student1@ambo.edu')
ORDER BY au.email;

-- =====================================================================================================================
-- STEP 2: Fix/Create profiles with correct roles
-- =====================================================================================================================

-- Fix Department Head Profile (update or insert)
INSERT INTO public.profiles (id, full_name, role, student_id_number, year_of_study, phone_number, profile_photo, photo_locked)
SELECT 
  au.id,
  'Department Head Admin',
  'departmentHead',
  NULL,
  NULL,
  '+251911000000',
  NULL,
  false
FROM auth.users au
WHERE au.email = 'depthead@ambo.edu'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'departmentHead',
  full_name = 'Department Head Admin',
  phone_number = '+251911000000',
  student_id_number = NULL,
  year_of_study = NULL;

-- Fix Student Profile (update or insert)
INSERT INTO public.profiles (id, full_name, role, student_id_number, year_of_study, phone_number, profile_photo, photo_locked)
SELECT 
  au.id,
  'Test Student',
  'student',
  'AMB2024001',
  '3',
  '+251911111111',
  NULL,
  false
FROM auth.users au
WHERE au.email = 'student1@ambo.edu'
ON CONFLICT (id)
DO UPDATE SET 
  role = 'student',
  full_name = 'Test Student',
  student_id_number = 'AMB2024001',
  year_of_study = '3',
  phone_number = '+251911111111';

-- =====================================================================================================================
-- STEP 3: Verify the fix
-- =====================================================================================================================

-- Check if profiles are now correct
SELECT 
  au.email,
  p.full_name,
  p.role,
  p.student_id_number,
  CASE 
    WHEN p.role IS NULL THEN '❌ No profile'
    WHEN p.role = 'departmentHead' AND au.email = 'depthead@ambo.edu' THEN '✅ Correct'
    WHEN p.role = 'student' AND au.email = 'student1@ambo.edu' THEN '✅ Correct'
    ELSE '❌ Wrong role'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email IN ('depthead@ambo.edu', 'student1@ambo.edu')
ORDER BY au.email;

-- =====================================================================================================================
-- OPTIONAL: If you need to reset the password (Supabase Dashboard is easier)
-- =====================================================================================================================

-- NOTE: You cannot directly set passwords via SQL for security reasons.
-- Instead, use ONE of these methods:

-- METHOD A: Reset Password via Supabase Dashboard (EASIEST)
-- 1. Go to Authentication > Users
-- 2. Find the user (depthead@ambo.edu)
-- 3. Click the three dots (•••) on the right
-- 4. Click "Reset Password"
-- 5. This will send a password reset email
-- OR
-- 6. Use "Send Magic Link" for instant login

-- METHOD B: Delete and Recreate User (if password reset doesn't work)
-- ONLY do this if you're sure you want to delete the user data!
-- 1. Go to Authentication > Users
-- 2. Find depthead@ambo.edu
-- 3. Click three dots > Delete User
-- 4. Click "Add User" button
-- 5. Email: depthead@ambo.edu
-- 6. Password: DeptHead123!
-- 7. Check "Auto Confirm User"
-- 8. Click Create
-- 9. Run the profile fix SQL above again

-- =====================================================================================================================
-- TROUBLESHOOTING: If login still fails
-- =====================================================================================================================

-- Check if email is confirmed
SELECT 
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
    ELSE '❌ Not confirmed - need to confirm email'
  END as confirmation_status
FROM auth.users
WHERE email IN ('depthead@ambo.edu', 'student1@ambo.edu');

-- If email is not confirmed, you can confirm it manually:
-- Go to Supabase Dashboard > Authentication > Users > Click user > Send Email Confirmation
-- OR set auto-confirm when creating users
