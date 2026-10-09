-- =====================================================================================================================
-- CREATE TEST ACCOUNTS FOR ETMS
-- Run this in your Supabase SQL Editor to create working test accounts
-- =====================================================================================================================

-- IMPORTANT: Run this query in Supabase Dashboard > SQL Editor

-- =====================================================================================================================
-- METHOD 1: Use Supabase Auth Admin (Recommended - Easier)
-- =====================================================================================================================
-- Go to Supabase Dashboard > Authentication > Users
-- Click "Add User" and manually create:

-- Department Head:
--   Email: depthead@ambo.edu
--   Password: DeptHead123!
--   Auto Confirm User: YES (check this box)

-- Student:
--   Email: student1@ambo.edu  
--   Password: Student123!
--   Auto Confirm User: YES (check this box)

-- Then run this to update their profiles:

-- Update Department Head Profile
INSERT INTO public.profiles (id, full_name, role, student_id_number, year_of_study, phone_number)
SELECT 
  id,
  'Department Head Admin',
  'departmentHead',
  NULL,
  NULL,
  '+251911000000'
FROM auth.users 
WHERE email = 'depthead@ambo.edu'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'departmentHead',
  full_name = 'Department Head Admin',
  phone_number = '+251911000000';

-- Update Student Profile  
INSERT INTO public.profiles (id, full_name, role, student_id_number, year_of_study, phone_number)
SELECT 
  id,
  'Test Student',
  'student',
  'AMB2024001',
  '3',
  '+251911111111'
FROM auth.users 
WHERE email = 'student1@ambo.edu'
ON CONFLICT (id)
DO UPDATE SET 
  role = 'student',
  full_name = 'Test Student',
  student_id_number = 'AMB2024001',
  year_of_study = '3',
  phone_number = '+251911111111';

-- =====================================================================================================================
-- VERIFICATION QUERIES
-- =====================================================================================================================

-- Check if users exist in auth.users
SELECT 
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email IN ('depthead@ambo.edu', 'student1@ambo.edu')
ORDER BY email;

-- Check if profiles are correctly set up
SELECT 
  p.full_name,
  p.role,
  p.student_id_number,
  au.email
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
WHERE au.email IN ('depthead@ambo.edu', 'student1@ambo.edu')
ORDER BY au.email;

-- =====================================================================================================================
-- ALTERNATIVE: Create more test accounts
-- =====================================================================================================================

-- Additional Student Account (student2)
-- Manually create in Dashboard with:
--   Email: student2@ambo.edu
--   Password: Student123!

-- Additional Department Head (depthead2)  
-- Manually create in Dashboard with:
--   Email: depthead2@ambo.edu
--   Password: DeptHead123!
