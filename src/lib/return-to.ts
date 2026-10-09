const historyKeys = ["sort", "status", "q"] as const;

export function historyHrefFromBack(back: string | null): string {
  const params = new URLSearchParams(back || "");
  const safe = new URLSearchParams();
  for (const key of historyKeys) {
    const value = params.get(key);
    if (value) safe.set(key, value.slice(0, 200));
  }
  const query = safe.toString();
  return query ? `/history?${query}` : "/history";
}

export function reviewParent(from: string | null, back: string | null) {
  if (from === "history") {
    return { href: historyHrefFromBack(back), label: "History" };
  }
  return { href: "/dashboard", label: "Dashboard" };
}

export function carryQuery(from: string | null, back: string | null) {
  if (from !== "history") return "";
  const params = new URLSearchParams();
  params.set("from", "history");
  if (back) params.set("back", back.slice(0, 300));
  return `?${params.toString()}`;
}
