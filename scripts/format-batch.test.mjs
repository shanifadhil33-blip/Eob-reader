import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import { formatBatchTitle, formatLocalWhen } from "../src/lib/format-batch.ts";

describe("formatBatchTitle", () => {
  it("uses the process local clock, without seconds", () => {
    const iso = "2026-10-09T04:40:51.000Z";
    const date = new Date(iso);
    const hour24 = date.getHours();
    const hour12 = hour24 % 12 || 12;
    const minute = String(date.getMinutes()).padStart(2, "0");
    const period = hour24 < 12 ? "AM" : "PM";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const expected = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}, ${hour12}:${minute} ${period}`;
    assert.equal(formatLocalWhen(iso), expected);
    assert.equal(formatBatchTitle(iso), `Batch · ${expected}`);
    assert.doesNotMatch(formatBatchTitle(iso), /:\d{2}:\d{2}/);
  });

  it("reads 04:40 UTC as 8:40 AM when the viewer is four hours ahead", () => {
    const result = spawnSync(
      process.execPath,
      [
        "--experimental-strip-types",
        "--input-type=module",
        "-e",
        `import { formatBatchTitle } from "./src/lib/format-batch.ts";
         const title = formatBatchTitle("2026-10-09T04:40:51.000Z");
         if (title !== "Batch · Oct 9, 2026, 8:40 AM") {
           console.error(title);
           process.exit(1);
         }`,
      ],
      {
        cwd: new URL("..", import.meta.url),
        env: { ...process.env, TZ: "Asia/Dubai" },
        encoding: "utf8",
      }
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
  });

  it("falls back when the timestamp is missing", () => {
    assert.equal(formatLocalWhen("not-a-date"), "");
    assert.equal(formatBatchTitle(""), "Batch");
  });
});
