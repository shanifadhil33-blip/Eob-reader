import { headers } from "next/headers";
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

  // Set by proxy after a single getUser(). Reading it here avoids a second
  // auth refresh in this Server Component, which crashed the first dashboard
  // paint after Google sign-in.
  const headerStore = await headers();
  const userId = headerStore.get("x-eob-user-id");
  if (!userId) {
    redirect("/");
  }

  return (
    <AppShell
      user={{
        email: headerStore.get("x-eob-user-email") || "",
        name: headerStore.get("x-eob-user-name") || "User",
      }}
    >
      {children}
    </AppShell>
  );
}
