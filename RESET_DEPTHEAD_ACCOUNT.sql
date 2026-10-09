-- =====================================================================================================================
-- RESET DEPARTMENT HEAD ACCOUNT - Clean deletion and recreation
-- =====================================================================================================================
-- This script will safely remove all related data and reset the department head account

-- =====================================================================================================================
-- STEP 1: Find the department head user ID
-- =====================================================================================================================

-- First, let's see what we're working with
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'depthead@ambo.edu';

-- Copy the ID from the result above and use it in the next steps

-- =====================================================================================================================
-- STEP 2: Delete all related data (Replace USER_ID with actual ID from Step 1)
-- =====================================================================================================================

-- Get the user ID into a variable
DO $$
DECLARE
    dept_head_id UUID;
BEGIN
    -- Get the department head user ID
    SELECT id INTO dept_head_id
    FROM auth.users
    WHERE email = 'depthead@ambo.edu';
    
    -- If user exists, clean up related data
    IF dept_head_id IS NOT NULL THEN
        -- Delete notifications created by this user
        DELETE FROM public.notifications WHERE created_by = dept_head_id;
        
        -- Delete notifications sent to this user
        DELETE FROM public.notifications WHERE user_id = dept_head_id;
        
        -- Delete any complaints related to this user
        DELETE FROM public.complaints WHERE student_id = dept_head_id;
        
        -- Delete any trips created by this user
        DELETE FROM public.trips WHERE created_by = dept_head_id;
        
        -- Delete any reports by this user
        DELETE FROM public.trip_reports WHERE student_id = dept_head_id;
        
        -- Delete any registrations by this user
        DELETE FROM public.trip_registrations WHERE student_id = dept_head_id;
        
        -- Delete any documents uploaded by this user
        DELETE FROM public.uploaded_documents WHERE student_id = dept_head_id;
        
        -- Delete any health info
        DELETE FROM public.health_info WHERE student_id = dept_head_id;
        
        -- Delete any emergency contacts
        DELETE FROM public.emergency_contacts WHERE student_id = dept_head_id;
        
        -- Delete profile
        DELETE FROM public.profiles WHERE id = dept_head_id;
        
        -- Finally, delete from auth.users
        DELETE FROM auth.users WHERE id = dept_head_id;
        
        RAISE NOTICE 'Successfully deleted department head account and all related data';
    ELSE
        RAISE NOTICE 'Department head account not found';
    END IF;
END $$;

-- =====================================================================================================================
-- STEP 3: Verify deletion
-- =====================================================================================================================

-- This should return no rows
SELECT id, email 
FROM auth.users 
WHERE email = 'depthead@ambo.edu';

-- =====================================================================================================================
-- STEP 4: Now you can create the user in Supabase Dashboard
-- =====================================================================================================================

-- After running this script:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User"
-- 3. Email: depthead@ambo.edu
-- 4. Password: DeptHead123!
-- 5. Check "Auto confirm user"
-- 6. Click Create
-- 7. Then run STEP 5 below to create the profile

-- =====================================================================================================================
-- STEP 5: Create the profile after creating user in dashboard
-- =====================================================================================================================

-- Run this AFTER creating the user in Supabase Dashboard
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
  phone_number = '+251911000000';

-- =====================================================================================================================
-- STEP 6: Verify everything is correct
-- =====================================================================================================================

SELECT 
  au.email,
  au.email_confirmed_at,
  p.full_name,
  p.role,
  CASE 
    WHEN p.role = 'departmentHead' THEN '✅ Ready to login!'
    ELSE '❌ Something wrong'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'depthead@ambo.edu';

-- Expected output:
-- email: depthead@ambo.edu
-- email_confirmed_at: (should have timestamp)
-- full_name: Department Head Admin
-- role: departmentHead
-- status: ✅ Ready to login!
