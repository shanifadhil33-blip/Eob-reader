import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { initialDemoClaims } from "../src/lib/demo/sample-batch.ts";
import { sortOrderedItems } from "../src/lib/list-order.ts";
import { historyHrefFromBack, reviewParent } from "../src/lib/return-to.ts";

function names(sort) {
  return sortOrderedItems(initialDemoClaims, sort)
    .map((claim) => claim.patient_name)
    .join(", ");
}

describe("sortOrderedItems", () => {
  it("gives each demo sort a different order", () => {
    const newest = names("newest");
    const oldest = names("oldest");
    const byName = names("name");
    const byAmount = names("amount");
    assert.equal(newest, "Juniper Moss, Rowan Pebble, Cedar Brook, Maple Quill");
    assert.equal(oldest, "Maple Quill, Cedar Brook, Rowan Pebble, Juniper Moss");
    assert.equal(byName, "Cedar Brook, Juniper Moss, Maple Quill, Rowan Pebble");
    assert.equal(byAmount, "Rowan Pebble, Maple Quill, Cedar Brook, Juniper Moss");
    assert.equal(new Set([newest, oldest, byName, byAmount]).size, 4);
  });

  it("breaks ties with the patient name", () => {
    const tied = [
      { created_at: "2026-01-01T00:00:00.000Z", patient_name: "Zed", check_amount: 10 },
      { created_at: "2026-01-01T00:00:00.000Z", patient_name: "Ada", check_amount: 10 },
    ];
    assert.equal(sortOrderedItems(tied, "newest")[0].patient_name, "Ada");
    assert.equal(sortOrderedItems(tied, "amount")[0].patient_name, "Ada");
  });
});

describe("reviewParent", () => {
  it("returns to the filtered history list", () => {
    const parent = reviewParent("history", "sort=name&status=flagged&q=ada&evil=1");
    assert.equal(parent.label, "History");
    assert.equal(parent.href, "/history?sort=name&status=flagged&q=ada");
    assert.equal(historyHrefFromBack(null), "/history");
    assert.equal(reviewParent(null, null).href, "/dashboard");
  });
});
