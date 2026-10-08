/** Allow only same-site relative paths. Blocks protocol-relative and userinfo redirects. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return "/dashboard";
  if (!next.startsWith("/")) return "/dashboard";
  if (next.startsWith("//") || next.startsWith("/\\")) return "/dashboard";
  if (next.includes("\\") || next.includes("@") || next.includes("://")) {
    return "/dashboard";
  }
  return next;
}
