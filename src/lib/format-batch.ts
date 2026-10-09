const whenOptions: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
};

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((item) => item.type === type)?.value ?? "";
}

/** Viewer's local clock, friendly and without seconds. Example: Oct 9, 2026, 8:40 AM */
export function formatLocalWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", whenOptions).formatToParts(date);
  const month = part(parts, "month");
  const day = part(parts, "day");
  const year = part(parts, "year");
  const hour = part(parts, "hour");
  const minute = part(parts, "minute");
  const dayPeriod = part(parts, "dayPeriod").toUpperCase();
  if (!month || !day || !year || !hour || !minute || !dayPeriod) return "";
  return `${month} ${day}, ${year}, ${hour}:${minute} ${dayPeriod}`;
}

/** Batch title in the viewer's local time. Example: Batch · Oct 9, 2026, 8:40 AM */
export function formatBatchTitle(iso: string): string {
  const when = formatLocalWhen(iso);
  return when ? `Batch · ${when}` : "Batch";
}
