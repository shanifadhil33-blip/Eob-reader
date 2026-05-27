import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get practice info
  const { data: practice } = await supabase
    .from("practices")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  return (
    <AppShell
      user={{
        email: user.email || "",
        name: practice?.name || user.user_metadata?.full_name || "User",
        avatarUrl: user.user_metadata?.avatar_url,
      }}
      practice={practice}
    >
      {children}
    </AppShell>
  );
}
