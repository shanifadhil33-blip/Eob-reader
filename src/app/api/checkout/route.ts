import { Checkout } from "@polar-sh/nextjs";

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgraded=true`,
});
