import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error, data: sessionData } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      let finalNext = next;
      const user = sessionData?.session?.user;
      
      if (user) {
        // Evaluate if user is brand new (created in the last 2 minutes)
        const { data: practice } = await supabase
          .from("practices")
          .select("created_at")
          .eq("auth_id", user.id)
          .single();
          
        if (practice) {
          const createdAt = new Date(practice.created_at).getTime();
          if (Date.now() - createdAt < 2 * 60 * 1000) {
             finalNext = "/onboarding";
          }
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${finalNext}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${finalNext}`);
      } else {
        return NextResponse.redirect(`${origin}${finalNext}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
