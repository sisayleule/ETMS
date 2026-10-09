# 🔑 Test Account Setup Guide

## ✅ Expected Test Accounts

Your application expects these accounts to exist:

### 👨‍💼 **Department Head Account**
```
Email: depthead@ambo.edu
Password: DeptHead123!
Role: departmentHead
```

### 👨‍🎓 **Student Account**
```
Email: student1@ambo.edu
Password: Student123!
Role: student
```

---

## 🚀 How to Create These Accounts

### **Method 1: Using Supabase Dashboard (EASIEST)**

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `vfllrtgmvpghrxafezet`

2. **Navigate to Authentication**
   - Click **Authentication** in left sidebar
   - Click **Users** tab
   - Click **Add User** button (green button, top right)

3. **Create Department Head Account**
   - Email: `depthead@ambo.edu`
   - Password: `DeptHead123!`
   - ✅ Check **Auto Confirm User** (IMPORTANT!)
   - Click **Create User**

4. **Create Student Account**
   - Click **Add User** again
   - Email: `student1@ambo.edu`
   - Password: `Student123!`
   - ✅ Check **Auto Confirm User** (IMPORTANT!)
   - Click **Create User**

5. **Set Up Profiles**
   - Go to **SQL Editor** (left sidebar)
   - Copy and paste the SQL from `CREATE_TEST_ACCOUNTS.sql`
   - Click **Run** to execute
   - This will set the correct roles and profile data

---

### **Method 2: Using Registration Page (ALTERNATIVE)**

If your registration page is working after fixing CORS:

1. **Register Department Head** (You'll need to modify code temporarily)
   - Currently registration only creates students
   - Would need code changes to support dept head registration

2. **Register Student**
   - Go to: `https://your-vercel-url.vercel.app/register`
   - Fill in:
     - Full Name: Test Student
     - Email: student1@ambo.edu
     - Phone: +251911111111
     - Student ID: AMB2024001
     - Year of Study: 3
     - Password: Student123!
     - Confirm Password: Student123!
   - Click **Create Account**

---

## 🔍 Verify Accounts Were Created

### Check in Supabase Dashboard:

1. **Check Auth Users**
   - Go to **Authentication** → **Users**
   - You should see both emails listed
   - Status should be **Confirmed** (green checkmark)

2. **Check Profiles**
   - Go to **Table Editor** → **profiles** table
   - Find the rows for both users
   - Verify:
     - `depthead@ambo.edu` has `role = 'departmentHead'`
     - `student1@ambo.edu` has `role = 'student'`

### Run SQL Verification Query:

```sql
-- Copy and paste this in SQL Editor
SELECT 
  au.email,
  au.email_confirmed_at,
  p.full_name,
  p.role,
  p.student_id_number
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email IN ('depthead@ambo.edu', 'student1@ambo.edu')
ORDER BY au.email;
```

Expected output:
| email | email_confirmed_at | full_name | role | student_id_number |
|-------|-------------------|-----------|------|-------------------|
| depthead@ambo.edu | 2024-XX-XX ... | Department Head Admin | departmentHead | NULL |
| student1@ambo.edu | 2024-XX-XX ... | Test Student | student | AMB2024001 |

---

## 🐛 Troubleshooting

### Problem: "Invalid login credentials"

**Possible Causes:**
1. Account doesn't exist in Supabase
2. Password is incorrect
3. Email is not confirmed

**Solutions:**
- Go to Supabase → Authentication → Users
- Check if the email exists
- Look at the "Confirmed At" column - should have a timestamp
- If empty, click the user → Click **Send Email Confirmation**
- OR delete and recreate with "Auto Confirm User" checked

---

### Problem: Login works but redirects to wrong page

**Possible Cause:**
Role is not set correctly in profiles table

**Solution:**
Run this SQL in Supabase SQL Editor:

```sql
-- Fix Department Head role
UPDATE public.profiles
SET role = 'departmentHead'
WHERE id = (SELECT id FROM auth.users WHERE email = 'depthead@ambo.edu');

-- Fix Student role  
UPDATE public.profiles
SET role = 'student'
WHERE id = (SELECT id FROM auth.users WHERE email = 'student1@ambo.edu');
```

---

### Problem: "Could not load your profile"

**Possible Cause:**
Profile row doesn't exist in profiles table

**Solution:**
Run the SQL from `CREATE_TEST_ACCOUNTS.sql` to create/update profiles

---

### Problem: Still can't login after creating accounts

**Checklist:**
1. ✅ Environment variables set in Vercel?
2. ✅ Redeployed after adding env vars?
3. ✅ CORS configured in Supabase?
4. ✅ Site URL set in Supabase Auth settings?
5. ✅ Email confirmed (Auto Confirm checked)?
6. ✅ Profile exists with correct role?

---

## 📋 Quick Reference

### Login Page URL (Local)
```
http://localhost:5173/login
```

### Login Page URL (Production)
```
https://your-vercel-url.vercel.app/login
```

### Test Credentials
Copy these to test login:

**Department Head:**
```
depthead@ambo.edu
DeptHead123!
```

**Student:**
```
student1@ambo.edu
Student123!
```

---

## 🎯 Next Steps After Accounts Created

1. Clear browser cache
2. Open incognito window
3. Go to login page
4. Click "Department Head" quick access button
5. Click "Sign In to Portal"
6. Should redirect to department head dashboard

If it works: ✅ Setup complete!
If not: Check the troubleshooting section above.
