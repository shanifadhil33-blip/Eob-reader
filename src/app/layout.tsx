import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { ClearServiceWorker } from "@/components/clear-service-worker";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EOB Reader",
  description:
    "Portfolio project that reads dental EOB PDFs, lets you review the draft, and exports an X12 835 or a PMS CSV. Not for real patient information.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#f2efe9] text-[#281a0d]">
        {children}
        <ClearServiceWorker />
        <Toaster />
      </body>
    </html>
  );
}
