import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractWithFallback,
  OUTPUT_TOKEN_CAP,
  parseExtractionJson,
  READER_BUSY_MESSAGE,
  shouldTryNextModel,
} from "../src/lib/extraction/model-chain.ts";

const dental = {
  patient_name: "Tamsin Fernleaf",
  payer_name: "Birchwood Dental Mutual",
  line_items: [
    { procedure_code: "D0120", insurance_paid: 45 },
    { procedure_code: "D1110", insurance_paid: 100 },
    { procedure_code: "D0274", insurance_paid: 40 },
  ],
};

const denial = {
  patient_name: "Orin Hollowell",
  payer_name: "Harborlight Health Plan",
  line_items: [
    { procedure_code: "99214", insurance_paid: 120, adjustment_code: "CO-45", adjustment_amount: 65 },
    { procedure_code: "93000", insurance_paid: 0, adjustment_code: "CO-50", adjustment_amount: 95 },
    { procedure_code: "80053", insurance_paid: 0, adjustment_code: "CO-197", adjustment_amount: 60 },
  ],
};

describe("parseExtractionJson", () => {
  it("reads a claims wrapper and code fences", () => {
    const raw = "```json\n" + JSON.stringify({ claims: [dental] }) + "\n```";
    const parsed = parseExtractionJson(raw);
    assert.equal(parsed.patient_name, "Tamsin Fernleaf");
    assert.equal(parsed.payer_name, "Birchwood Dental Mutual");
    assert.deepEqual(
      parsed.line_items.map((line) => [line.procedure_code, line.insurance_paid]),
      [
        ["D0120", 45],
        ["D1110", 100],
        ["D0274", 40],
      ]
    );
  });

  it("reads a top-level array and numeric strings", () => {
    const parsed = parseExtractionJson(
      JSON.stringify([
        {
          ...denial,
          line_items: denial.line_items.map((line) => ({
            ...line,
            insurance_paid: String(line.insurance_paid),
            adjustment_amount: `$${line.adjustment_amount}.00`,
          })),
        },
      ])
    );
    const denied = parsed.line_items.filter((line) => line.insurance_paid === 0);
    assert.deepEqual(
      denied.map((line) => [line.procedure_code, line.adjustment_code, line.adjustment_amount]),
      [
        ["93000", "CO-50", 95],
        ["80053", "CO-197", 60],
      ]
    );
  });
});

describe("extractWithFallback", () => {
  it("caps output tokens in the free range", () => {
    assert.ok(OUTPUT_TOKEN_CAP >= 3000 && OUTPUT_TOKEN_CAP <= 4000);
    assert.equal(shouldTryNextModel(402), true);
    assert.equal(shouldTryNextModel(429), true);
    assert.equal(shouldTryNextModel(404), true);
    assert.equal(shouldTryNextModel(503), true);
    assert.equal(shouldTryNextModel(200), false);
  });

  it("skips a 402 credit error and uses the next model's JSON", async () => {
    const calls = [];
    const parsed = await extractWithFallback(async (model) => {
      calls.push(model);
      if (calls.length === 1) {
        return {
          status: 402,
          content:
            "This request requires more credits, or fewer max_tokens. You requested up to 16384 tokens.",
        };
      }
      return { status: 200, content: "Sure:\n```json\n" + JSON.stringify(dental) + "\n```" };
    }, ["paid/model", "google/gemma-4-26b-a4b-it:free"]);

    assert.deepEqual(calls, ["paid/model", "google/gemma-4-26b-a4b-it:free"]);
    assert.equal(parsed.patient_name, "Tamsin Fernleaf");
  });

  it("tries the next model when the first JSON cannot be parsed", async () => {
    let attempt = 0;
    const parsed = await extractWithFallback(async () => {
      attempt += 1;
      if (attempt === 1) return { status: 200, content: "I cannot help with that." };
      return { status: 200, content: JSON.stringify(denial) };
    }, ["first", "second"]);
    assert.equal(parsed.payer_name, "Harborlight Health Plan");
    assert.equal(attempt, 2);
  });

  it("hides the provider error when every model fails", async () => {
    await assert.rejects(
      extractWithFallback(
        async () => ({
          status: 402,
          content: "402 You requested up to 16384 tokens, but can only afford 5421.",
        }),
        ["a:free", "b:free"]
      ),
      (error) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, READER_BUSY_MESSAGE);
        assert.equal(error.message.includes("16384"), false);
        assert.equal(error.message.includes("credits"), false);
        return true;
      }
    );
  });
});
