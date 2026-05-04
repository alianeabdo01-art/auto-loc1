import type { User } from "@supabase/supabase-js";

export function isAdminUser(user: User | null | undefined) {
  if (!user) {
    return false;
  }

    const appRole = (user as any).app_metadata?.role;
  const userRole = (user as any).user_metadata?.role;
  const directRole = (user as any).role;
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

  return [appRole, userRole, directRole].some((value) => value === "admin") ||
    (!!adminEmail && user.email?.toLowerCase() === adminEmail);
}
