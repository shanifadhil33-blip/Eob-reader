import { CustomerPortal } from "@polar-sh/nextjs";
import { createClient } from "@/lib/supabase/server";

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
  getCustomerId: async (req: Request) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: practice } = await supabase
      .from("practices")
      .select("polar_customer_id")
      .eq("auth_id", user.id)
      .single();

    if (!practice?.polar_customer_id) {
      throw new Error("No Polar customer found");
    }

    return practice.polar_customer_id;
  },
});
