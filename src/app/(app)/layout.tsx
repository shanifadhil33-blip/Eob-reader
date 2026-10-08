import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

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
  // The proxy already validated this request with getUser(). A second
  // getUser() here can rotate the single-use refresh token and then
  // cookies().set() throws: cookie writes are rejected while a Server
  // Component is rendering. That failed render is the first dashboard
  // load ("This page couldn't load", with Back, because the error has no
  // digest). A reload works because the proxy already stored the new cookie.
  // getSession() reads the cookie and does not contact Auth while the
  // access token is still valid, which it is right after sign-in.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect("/");
  }

  const metadata = user.user_metadata;
  const name =
    typeof metadata?.full_name === "string"
      ? metadata.full_name
      : typeof metadata?.name === "string"
        ? metadata.name
        : "User";

  return (
    <AppShell
      user={{
        email: user.email || "",
        name,
      }}
    >
      {children}
    </AppShell>
  );
}
