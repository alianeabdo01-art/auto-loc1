import { createClient } from "@/lib/supabase/server";

import NavbarClient from "./navbar-client";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <NavbarClient initialEmail={user?.email ?? null} />;
}