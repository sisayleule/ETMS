-- =====================================================================================================================
-- UPDATE PASSWORD FOR DEPARTMENT HEAD
-- =====================================================================================================================
-- This will directly update the password hash in the database

-- =====================================================================================================================
-- STEP 1: Check if user exists and is confirmed
-- =====================================================================================================================

SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email confirmed'
    ELSE '❌ Email not confirmed'
  END as confirmation_status
FROM auth.users 
WHERE email = 'depthead@ambo.edu';

-- =====================================================================================================================
-- STEP 2: Update the password to DeptHead123!
-- =====================================================================================================================

-- This will set the password to exactly: DeptHead123!
UPDATE auth.users 
SET 
  encrypted_password = crypt('DeptHead123!', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'depthead@ambo.edu';

-- =====================================================================================================================
-- STEP 3: Verify the profile exists with correct role
-- =====================================================================================================================

SELECT 
  au.email,
  p.full_name,
  p.role,
  CASE 
    WHEN p.id IS NULL THEN '❌ No profile found!'
    WHEN p.role = 'departmentHead' THEN '✅ Profile correct'
    ELSE '❌ Wrong role: ' || COALESCE(p.role, 'NULL')
  END as profile_status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'depthead@ambo.edu';

-- =====================================================================================================================
-- STEP 4: If profile doesn't exist or has wrong role, fix it
-- =====================================================================================================================

INSERT INTO public.profiles (id, full_name, role, phone_number, profile_photo, photo_locked)
SELECT 
  id,
  'Department Head Admin',
  'departmentHead',
  '+251911000000',
  NULL,
  false
FROM auth.users 
WHERE email = 'depthead@ambo.edu'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'departmentHead',
  full_name = 'Department Head Admin',
  phone_number = '+251911000000',
  updated_at = NOW();

-- =====================================================================================================================
-- STEP 5: Final verification - Everything should be ✅
-- =====================================================================================================================

SELECT 
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  p.full_name,
  p.role,
  CASE 
    WHEN au.email_confirmed_at IS NULL THEN '❌ Email not confirmed'
    WHEN p.id IS NULL THEN '❌ No profile'
    WHEN p.role != 'departmentHead' THEN '❌ Wrong role'
    ELSE '✅ READY TO LOGIN!'
  END as final_status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'depthead@ambo.edu';

-- =====================================================================================================================
-- Expected final result:
-- email: depthead@ambo.edu
-- email_confirmed: true
-- full_name: Department Head Admin
-- role: departmentHead
-- final_status: ✅ READY TO LOGIN!
-- =====================================================================================================================

-- NOW YOU CAN LOGIN WITH:
-- Email: depthead@ambo.edu
-- Password: DeptHead123!
