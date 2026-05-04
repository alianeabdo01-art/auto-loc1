/**
 * ADMIN SETUP GUIDE
 *
 * To create the admin user account with email admin@gmail.com and password estinsi:
 *
 * OPTION 1: Via Supabase Dashboard (Easiest)
 * ==========================================
 * 1. Go to your Supabase project: https://supabase.com/dashboard
 * 2. Navigate to Authentication → Users
 * 3. Click "Create user"
 * 4. Fill in:
 *    - Email: admin@gmail.com
 *    - Password: estinsi
 * 5. Click "Create user"
 * 6. After creation, click on the user and go to "User metadata"
 * 7. Add this JSON:
 *    {
 *      "role": "admin"
 *    }
 * 8. Click "Update"
 *
 * OPTION 2: Using the SQL Editor
 * ===============================
 * If you have direct database access, run this in Supabase SQL Editor:
 *
 * -- Create or update admin metadata for a_aliane@estin.dz
 * update auth.users
 * set user_metadata = jsonb_set(coalesce(user_metadata, '{}'), '{role}', '"admin"')
 * where email = 'a_aliane@estin.dz';
 *
 * OPTION 3: Using Admin API (Advanced)
 * ====================================
 * Use the script in setup-admin.js (after setting SUPABASE_SERVICE_KEY env var)
 *
 * VERIFICATION
 * ============
 * After setting up the admin user:
 * 1. Sign in to /login with admin@gmail.com / estinsi
 * 2. Navigate to /admin
 * 3. You should see the admin dashboard with car management
 * 4. If redirected to home, the role wasn't set correctly
 */

export const adminSetupGuide = "See comments above";
