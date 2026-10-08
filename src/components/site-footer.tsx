import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#d1b996] bg-[#eee0c7]">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-[#281a0d]">Built by Adhil Shanif</p>
          <a
            className="mt-1 inline-block text-sm text-[#416c6f] underline-offset-2 hover:underline"
            href="mailto:shanifadhil33@gmail.com"
          >
            shanifadhil33@gmail.com
          </a>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#614f38]">
          <Link href="/privacy" className="hover:text-[#281a0d]">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-[#281a0d]">
            Terms
          </Link>
          <Link href="/hipaa" className="hover:text-[#281a0d]">
            Data handling
          </Link>
        </nav>
      </div>
    </footer>
  );
}
