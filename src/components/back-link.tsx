"use client";

import { useRouter } from "next/navigation";

export function BackLink({ href }: { href?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (href) {
          router.push(href);
          return;
        }
        router.back();
      }}
      className="inline-flex min-h-11 items-center text-sm font-medium text-[#416c6f]"
    >
      ← Back
    </button>
  );
}
