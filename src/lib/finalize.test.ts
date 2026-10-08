import { test } from "node:test";
import assert from "node:assert/strict";
import type { DocumentBundle } from "./documents";
import { certificateLines } from "./finalize";

const signedAt = new Date("2026-10-08T03:00:00Z");

function signer(name: string) {
  return { name, signedAt, signedIp: "203.0.113.7", signedUserAgent: "UA" };
}

test("the countersigner is listed last with a neutral role", () => {
  const bundle = {
    document: { clientName: "Acme Corp" },
    signers: [signer("Alicia Reyes"), signer("Bong Santos")],
  } as unknown as DocumentBundle;

  const lines = certificateLines(bundle, {
    name: "Deane Santos",
    ip: "198.51.100.2",
    userAgent: "Admin UA",
    signedAt,
  });

  assert.deepEqual(
    lines.map((l) => [l.name, l.role]),
    [
      ["Alicia Reyes", "Signer for Acme Corp"],
      ["Bong Santos", "Signer for Acme Corp"],
      ["Deane Santos", "Countersigned"],
    ],
  );
});
