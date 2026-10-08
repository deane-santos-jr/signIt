import { test } from "node:test";
import assert from "node:assert/strict";
import { newSignerRows } from "./documents";

test("signers keep the order they were entered in", () => {
  const rows = newSignerRows("doc1", [
    { name: "Alicia Reyes", email: "alicia@example.test" },
    { name: "Bong Santos", email: "" },
    { name: "Carmela Uy" },
  ]);
  assert.deepEqual(
    rows.map((r) => [r.position, r.name, r.email]),
    [
      [0, "Alicia Reyes", "alicia@example.test"],
      [1, "Bong Santos", null],
      [2, "Carmela Uy", null],
    ],
  );
  assert.ok(rows.every((r) => r.documentId === "doc1"));
  assert.equal(new Set(rows.map((r) => r.token)).size, 3);
});
