#!/usr/bin/env node

/**
 * This script creates an admin user in Supabase.
 * 
 * SETUP:
 * 1. Copy your SUPABASE_SERVICE_ROLE_KEY from Supabase Dashboard → Settings → API Keys
 * 2. Run: SUPABASE_SERVICE_ROLE_KEY=your_key_here node setup-admin.js
 *
 * The service role key has elevated permissions to create users and set metadata.
 */

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!serviceKey || !projectUrl) {
  console.error("❌ Missing environment variables:");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  console.error("\nSet these in .env.local or pass them as env vars.");
  process.exit(1);
}

async function setupAdmin() {
  try {
    console.log("🚀 Creating admin user in Supabase...");

    const response = await fetch(`${projectUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        email: "admin@gmail.com",
        password: "estinsi",
        user_metadata: {
          role: "admin",
        },
        email_confirm: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.message?.includes("already exists")) {
        console.log("⚠️  User already exists. Updating metadata...");
        
        // Get the user first to update metadata
        const listResponse = await fetch(
          `${projectUrl}/auth/v1/admin/users?email=admin@gmail.com`,
          {
            headers: {
              Authorization: `Bearer ${serviceKey}`,
            },
          }
        );

        const listData = await listResponse.json();
        if (listData.users && listData.users.length > 0) {
          const userId = listData.users[0].id;
          const updateResponse = await fetch(
            `${projectUrl}/auth/v1/admin/users/${userId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceKey}`,
              },
              body: JSON.stringify({
                user_metadata: {
                  role: "admin",
                },
              }),
            }
          );

          if (updateResponse.ok) {
            console.log("✅ Admin user metadata updated!");
            console.log("   Email: admin@gmail.com");
            console.log("   Password: estinsi");
          }
        }
      } else {
        console.error("❌ Error:", data.message || data);
        process.exit(1);
      }
    } else {
      console.log("✅ Admin user created successfully!");
      console.log("   Email: admin@gmail.com");
      console.log("   Password: estinsi");
      console.log("\n📍 Next step: Sign in at /login with these credentials");
      console.log("   Then navigate to /admin to access the dashboard");
    }
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

setupAdmin();
