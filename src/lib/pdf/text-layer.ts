/**
 * A page counts as a text layer once it has this many letters or digits.
 * The bar is one short sentence, not a dense document. A higher cutoff
 * marks real digital EOBs as scans.
 */
export const MEANINGFUL_PAGE_CHARS = 20;

export function alphanumericCount(text: string): number {
  const matches = text.match(/[A-Za-z0-9]/g);
  return matches ? matches.length : 0;
}

export function pageHasText(text: string): boolean {
  return alphanumericCount(text) >= MEANINGFUL_PAGE_CHARS;
}

export function textFromItems(items: readonly unknown[]): string {
  return items
    .map((item) => {
      if (typeof item === "object" && item !== null && "str" in item && typeof item.str === "string") {
        return item.str;
      }
      return "";
    })
    .join(" ");
}
