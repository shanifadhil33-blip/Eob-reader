import { Webhooks } from "@polar-sh/nextjs";
import { createClient } from "@supabase/supabase-js";

// Use service role client to bypass RLS for webhook updates
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {

    switch (payload.type) {
      case "subscription.created": {
        const sub = payload.data;
        const customerEmail = sub.customer?.email;

        if (!customerEmail) {
          break;
        }

        // Find the practice by email
        const { data: practice, error: findError } = await supabase
          .from("practices")
          .select("id")
          .eq("email", customerEmail)
          .single();

        if (findError || !practice) {
          break;
        }

        // Upgrade to pro
        const { error: updateError } = await supabase
          .from("practices")
          .update({
            subscription_status: "pro",
            polar_customer_id: sub.customer?.id || null,
            polar_subscription_id: sub.id,
            current_period_end: sub.currentPeriodEnd || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", practice.id);

        if (updateError) {
          throw new Error("Failed to upgrade practice to pro");
        }
        break;
      }

      case "subscription.updated": {
        const sub = payload.data;
        const subId = sub.id;

        // Find practice by polar_subscription_id
        const { data: practice } = await supabase
          .from("practices")
          .select("id")
          .eq("polar_subscription_id", subId)
          .single();

        if (!practice) {
          // Try by customer email as fallback
          const customerEmail = sub.customer?.email;
          if (customerEmail) {
            const { data: practiceByEmail } = await supabase
              .from("practices")
              .select("id")
              .eq("email", customerEmail)
              .single();

            if (!practiceByEmail) {
              break;
            }

            // Update with the correct subscription ID and proceed
            await supabase
              .from("practices")
              .update({ polar_subscription_id: subId })
              .eq("id", practiceByEmail.id);
          } else {
            break;
          }
        }

        const practiceId = practice?.id;
        if (!practiceId) break;

        // Map Polar subscription status to our status
        const polarStatus = sub.status;
        let newStatus: string;

        switch (polarStatus) {
          case "active":
            newStatus = "pro";
            break;
          case "canceled":
            newStatus = "canceled";
            break;
          case "revoked":
          case "past_due":
          case "unpaid":
            newStatus = "expired";
            break;
          default:
            newStatus = "pro";
        }

        await supabase
          .from("practices")
          .update({
            subscription_status: newStatus,
            current_period_end: sub.currentPeriodEnd || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", practiceId);

        break;
      }

      case "order.created": {
        // Renewal payment - update the period end
        const order = payload.data;
        const customerEmail = order.customer?.email;

        if (!customerEmail) break;

        const { data: practice } = await supabase
          .from("practices")
          .select("id")
          .eq("email", customerEmail)
          .single();

        if (practice) {
          await supabase
            .from("practices")
            .update({
              subscription_status: "pro",
              updated_at: new Date().toISOString(),
            })
            .eq("id", practice.id);
        }
        break;
      }

      default:
        // Unhandled event type — silently ignore
        break;
    }
  },
});
