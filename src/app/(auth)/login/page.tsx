"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Verification code sent to your email!");
        setStep("otp");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !otp) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        toast.success("Successfully logged in!");
        
        // Check if practice exists and has onboarding complete
        const { data: practice } = await supabase
          .from("practices")
          .select("name")
          .eq("auth_id", data.user.id)
          .single();
          
        if (!practice || !practice.name) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to verify code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 selection:bg-black selection:text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-100/40 rounded-full blur-[100px]" />
      </div>

      <Card className="w-full max-w-lg relative z-10 bg-white border border-black/5 shadow-2xl shadow-black/5 p-4 md:p-8 rounded-3xl">
        <CardHeader className="text-center pb-8 space-y-4">
          <Link href="/" className="flex items-center justify-center gap-3 mb-4">
            <Image src="/logo.png" alt="EOB Reader" width={48} height={48} className="rounded-xl shadow-md" />
            <span className="text-3xl font-extrabold text-black tracking-tight">
              EOB Reader
            </span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight">Welcome back</h1>
          <p className="text-base text-black/50 font-medium">
            Sign in to your account to continue
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Supabase Setup Required Banner */}
          {!isSupabaseConfigured && (
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-orange-700">
                    Supabase Setup Required
                  </p>
                  <p className="text-xs text-orange-700/70 mt-1 font-medium">
                    To enable authentication, create a Supabase project at{" "}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-orange-600 font-bold"
                    >
                      supabase.com
                    </a>{" "}
                    and add your credentials to{" "}
                    <code className="bg-orange-100 px-1 rounded text-orange-800">
                      .env.local
                    </code>
                    :
                  </p>
                  <pre className="mt-2 text-xs text-orange-800/80 bg-orange-100/50 p-3 rounded-lg font-mono overflow-x-auto border border-orange-200/50">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="email" className="text-black/60 font-semibold text-sm">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl bg-gray-50/50 border-black/10 focus:border-black/30 placeholder:text-black/30 text-black px-4 py-3"
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-black hover:bg-black/90 text-white font-bold rounded-xl shadow-md transition-all hover:shadow-lg flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Login Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="otp" className="text-black/60 font-semibold text-sm">
                  Verification Code (OTP)
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  className="h-12 rounded-xl bg-gray-50/50 border-black/10 focus:border-black/30 placeholder:text-black/30 text-black font-mono tracking-widest text-center text-lg px-4 py-3"
                  disabled={loading}
                />
                <p className="text-xs text-black/40 font-medium text-center mt-2">
                  We sent a 6-digit verification code to <span className="font-bold text-black/60">{email}</span>.
                </p>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-black hover:bg-black/90 text-white font-bold rounded-xl shadow-md transition-all hover:shadow-lg flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify & Log In
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("email")}
                disabled={loading}
                className="w-full h-10 text-black/50 hover:text-black font-semibold rounded-xl hover:bg-black/5"
              >
                Back to email
              </Button>
            </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/5" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-black/30 font-bold">Or continue with</span>
            </div>
          </div>

          {/* Google OAuth */}
          <Button
            variant="outline"
            className="w-full h-auto bg-white border-black/10 text-black hover:bg-black/5 hover:text-black py-4 md:py-6 text-lg font-bold shadow-sm transition-all hover:shadow-md rounded-2xl"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="text-center pt-4 border-t border-black/5">
            <p className="text-sm font-medium text-black/50">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-black font-bold hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
