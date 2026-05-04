import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/supabase/admin";

import NavbarClient from "./navbar-client";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = isAdminUser(user);

  return <NavbarClient initialEmail={user?.email ?? null} initialIsAdmin={isAdmin} />;
}