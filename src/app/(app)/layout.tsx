import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl?.startsWith("http")) {
    redirect("/");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: practice } = await supabase
    .from("practices")
    .select("id, name, email, auth_id, default_pms")
    .eq("auth_id", user.id)
    .single();

  return (
    <AppShell
      user={{
        email: user.email || practice?.email || "",
        name: practice?.name || user.user_metadata?.full_name || "User",
      }}
    >
      {children}
    </AppShell>
  );
}
