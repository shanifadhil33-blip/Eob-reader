export interface OrderedItem {
  created_at: string;
  patient_name: string | null;
  check_amount: number | null;
}

export function compareOrderedItems(a: OrderedItem, b: OrderedItem, sort: string) {
  const nameA = a.patient_name || "";
  const nameB = b.patient_name || "";
  if (sort === "oldest") {
    return a.created_at.localeCompare(b.created_at) || nameA.localeCompare(nameB);
  }
  if (sort === "name") {
    return nameA.localeCompare(nameB) || a.created_at.localeCompare(b.created_at);
  }
  if (sort === "amount") {
    return (b.check_amount || 0) - (a.check_amount || 0) || nameA.localeCompare(nameB);
  }
  return b.created_at.localeCompare(a.created_at) || nameA.localeCompare(nameB);
}

export function sortOrderedItems<T extends OrderedItem>(items: T[], sort: string): T[] {
  return [...items].sort((a, b) => compareOrderedItems(a, b, sort));
}
