import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildExtractionRequest,
  buildHealthProbeRequest,
  EXTRACTION_MODELS,
  extractWithFallback,
  interpretHealthProbe,
  JSON_MODE_MODELS,
  OPENROUTER_TIMEOUT_MS,
  openRouterHeaders,
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

  it("tries Reclaim's text models in order", async () => {
    const calls = [];
    const original = console.error;
    console.error = () => {};
    try {
      await assert.rejects(
        extractWithFallback(async (model) => {
          calls.push(model);
          return { status: 429, content: null, errorSnippet: "rate limit" };
        })
      );
    } finally {
      console.error = original;
    }
    assert.deepEqual(calls, [...EXTRACTION_MODELS]);
  });

  it("logs a 404 data-policy body and tries the next model", async () => {
    const logs = [];
    const original = console.error;
    console.error = (...args) => {
      logs.push(args.map(String).join(" "));
    };
    const secret = "sk-or-v1-do-not-log";
    const previous = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = secret;
    try {
      const parsed = await extractWithFallback(
        async (model) => {
          if (model === "google/gemini-2.5-flash") {
            return {
              status: 404,
              content: null,
              errorSnippet: `No endpoints found matching your data policy Bearer ${secret}`,
            };
          }
          return { status: 200, content: JSON.stringify(dental) };
        },
        ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"]
      );
      assert.equal(parsed.patient_name, "Tamsin Fernleaf");
      assert.equal(logs.length, 1);
      assert.match(logs[0], /\[extract\] model=google\/gemini-2\.5-flash status=404/);
      assert.match(logs[0], /No endpoints found matching your data policy/);
      assert.equal(logs[0].includes(secret), false);
    } finally {
      console.error = original;
      if (previous === undefined) delete process.env.OPENROUTER_API_KEY;
      else process.env.OPENROUTER_API_KEY = previous;
    }
  });

  it("logs a network failure and keeps going", async () => {
    const logs = [];
    const original = console.error;
    console.error = (...args) => {
      logs.push(args.map(String).join(" "));
    };
    try {
      const parsed = await extractWithFallback(
        async (model) => {
          if (model === "first") throw new Error("socket hang up");
          return { status: 200, content: JSON.stringify(dental) };
        },
        ["first", "second"]
      );
      assert.equal(parsed.patient_name, "Tamsin Fernleaf");
      assert.match(logs[0], /model=first status=0/);
      assert.match(logs[0], /socket hang up/);
    } finally {
      console.error = original;
    }
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

describe("OpenRouter request", () => {
  it("matches Reclaim's text request with a 4000 token cap", () => {
    assert.deepEqual([...EXTRACTION_MODELS], [
      "google/gemini-2.5-flash",
      "google/gemini-2.5-flash-lite",
      "meta-llama/llama-3.3-70b-instruct",
    ]);
    assert.equal(JSON_MODE_MODELS.has("google/gemini-2.5-flash"), true);
    assert.equal(JSON_MODE_MODELS.has("google/gemini-2.5-flash-lite"), true);
    assert.equal(JSON_MODE_MODELS.has("meta-llama/llama-3.3-70b-instruct"), false);
    assert.equal(OPENROUTER_TIMEOUT_MS, 60_000);

    const headers = openRouterHeaders("test-key");
    assert.deepEqual(Object.keys(headers).sort(), ["Authorization", "Content-Type"]);
    assert.equal(headers.Authorization, "Bearer test-key");

    const gemini = buildExtractionRequest("google/gemini-2.5-flash", "Tamsin Fernleaf");
    assert.equal(gemini.temperature, 0.1);
    assert.equal(gemini.max_tokens, 4000);
    assert.deepEqual(gemini.response_format, { type: "json_object" });
    assert.deepEqual(
      gemini.messages.map((message) => message.role),
      ["system", "user"]
    );
    assert.equal(gemini.messages[1].content.includes("Tamsin Fernleaf"), true);
    assert.equal(gemini.messages[0].content.includes("Tamsin Fernleaf"), false);

    const llama = buildExtractionRequest("meta-llama/llama-3.3-70b-instruct", "Orin Hollowell");
    assert.equal(llama.response_format, undefined);
    assert.equal(llama.max_tokens, 4000);

    const probe = buildHealthProbeRequest("google/gemini-2.5-flash");
    assert.equal(probe.max_tokens, 5);
    assert.equal(probe.messages[0].content, "Reply OK");
    assert.equal("response_format" in probe, false);
  });
});

describe("interpretHealthProbe", () => {
  it("marks a 200 completion ok and keeps a 404 snippet", () => {
    const ok = interpretHealthProbe(
      "google/gemini-2.5-flash",
      200,
      JSON.stringify({ choices: [{ message: { content: "OK" } }] })
    );
    assert.equal(ok.ok, true);
    assert.equal(ok.error_snippet, null);

    const denied = interpretHealthProbe(
      "google/gemma-4-26b-a4b-it:free",
      404,
      JSON.stringify({ error: { message: "No endpoints found matching your data policy" } })
    );
    assert.equal(denied.ok, false);
    assert.equal(denied.status, 404);
    assert.match(denied.error_snippet, /No endpoints found matching your data policy/);
  });

  it("strips the API key from a probe snippet", () => {
    const secret = "sk-or-v1-health-secret";
    const previous = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = secret;
    try {
      const probe = interpretHealthProbe("google/gemini-2.5-flash", 401, `invalid key ${secret}`);
      assert.equal(probe.ok, false);
      assert.equal(probe.error_snippet.includes(secret), false);
      assert.match(probe.error_snippet, /\[redacted\]/);
    } finally {
      if (previous === undefined) delete process.env.OPENROUTER_API_KEY;
      else process.env.OPENROUTER_API_KEY = previous;
    }
  });
});
