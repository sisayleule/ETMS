# 🔧 Deployment Fix Guide - Login & Registration Issues

## 🚨 Problem
Your app shows "Failed to fetch" errors on login and registration pages with CORS errors in the console.

## ✅ Solution Checklist

### 1️⃣ **Vercel Environment Variables** (MOST IMPORTANT)

Your Vercel deployment needs the Supabase credentials. Follow these steps:

#### Steps:
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project: `etms-phi` or similar
3. Click **Settings** → **Environment Variables**
4. Add these two variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://vfllrtgmvpghrxafezet.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmbGxydGdtdnBnaHJ4YWZlemV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNDM1MjAsImV4cCI6MjA5ODgxOTUyMH0.COdFgUxBgzZZTcZzrXEV4Fro7tp6PP_yRVTcgYDhjO8` | Production, Preview, Development |

5. **IMPORTANT**: After adding variables, you MUST redeploy:
   - Go to **Deployments** tab
   - Click the three dots (•••) on the latest deployment
   - Click **Redeploy**

---

### 2️⃣ **Supabase Dashboard Settings**

#### A. Authentication Settings
1. Go to https://supabase.com/dashboard
2. Select your project: `vfllrtgmvpghrxafezet`
3. Go to **Authentication** → **URL Configuration**
4. Add your Vercel domain to **Site URL**:
   ```
   https://etms-phi.vercel.app
   ```
   (Replace with your actual Vercel URL)

5. Add **Redirect URLs** (all of these):
   ```
   https://etms-phi.vercel.app/**
   https://etms-phi.vercel.app/login
   https://etms-phi.vercel.app/register
   https://etms-phi.vercel.app/student/dashboard
   https://etms-phi.vercel.app/depthead/dashboard
   ```

#### B. CORS Configuration
1. Still in Supabase dashboard
2. Go to **Settings** → **API**
3. Scroll to **API Settings**
4. Under **CORS Allowed Origins**, add:
   ```
   https://etms-phi.vercel.app
   ```
   (Replace with your actual Vercel URL)

#### C. Email Auth Settings
1. Go to **Authentication** → **Providers**
2. Make sure **Email** provider is **ENABLED**
3. Check these settings:
   - ✅ Enable email provider
   - ✅ Confirm email (can be disabled for testing)
   - ✅ Enable auto-confirm for testing (optional)

---

### 3️⃣ **Database Setup - Create Test Accounts**

Your app expects these test accounts to exist. You need to create them in Supabase:

#### Option A: Using Supabase SQL Editor
1. Go to **SQL Editor** in Supabase dashboard
2. Run this SQL:

```sql
-- Create Department Head account
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'depthead@ambo.edu',
  crypt('DeptHead123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"departmentHead"}',
  FALSE,
  '',
  '',
  '',
  ''
);

-- Create Student account
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'student1@ambo.edu',
  crypt('Student123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"student"}',
  FALSE,
  '',
  '',
  '',
  ''
);
```

#### Option B: Register Manually
1. Once CORS is fixed, go to your registration page
2. Register with these credentials:
   - **Department Head**: depthead@ambo.edu / DeptHead123!
   - **Student**: student1@ambo.edu / Student123!

---

### 4️⃣ **Verify the Fix**

After completing steps 1-3:

1. **Clear browser cache** (Ctrl + Shift + Delete)
2. Open your Vercel URL in a **new incognito window**
3. Try to login with:
   - Email: `student1@ambo.edu`
   - Password: `Student123!`
4. Check browser console (F12) - should be no errors

---

## 🔍 Common Issues & Solutions

### Issue: Still getting "Failed to fetch"
**Solution**: 
- Verify environment variables are set in Vercel
- Make sure you redeployed AFTER adding variables
- Check Supabase project is active (not paused)

### Issue: "Invalid login credentials"
**Solution**:
- Test accounts might not exist yet
- Use registration page to create new account
- Or run the SQL script above

### Issue: "Email not confirmed"
**Solution**:
- Go to Supabase: **Authentication** → **Providers** → **Email**
- Disable "Confirm email" for testing
- Or check your email for confirmation link

### Issue: CORS errors persist
**Solution**:
- Double-check Vercel URL is EXACTLY as deployed (no typos)
- Make sure URL includes `https://`
- Try adding wildcard: `https://*.vercel.app`

---

## 📋 Quick Test Credentials

Once everything is configured:

| Role | Email | Password |
|------|-------|----------|
| Department Head | depthead@ambo.edu | DeptHead123! |
| Student | student1@ambo.edu | Student123! |

---

## 🆘 Still Not Working?

1. **Check Supabase Status**: https://status.supabase.com
2. **Check Vercel Logs**:
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on latest deployment → **Runtime Logs**
3. **Check Browser Console** (F12) for specific error messages
4. **Verify .env.local locally**:
   ```bash
   npm run dev
   ```
   If it works locally but not on Vercel, it's definitely environment variables!

---

## 🎯 Next Steps After Fix

1. Test login with both accounts
2. Test registration with a new email
3. Verify dashboard loads correctly
4. Check all main features work

---

**Need help?** Share the:
- Exact error message from console
- Vercel deployment URL
- Screenshot of Supabase auth settings
