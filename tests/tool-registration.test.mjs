import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const { loadExtensions } = await import(process.env.PI_EXTENSION_LOADER || "@earendil-works/pi-coding-agent/dist/core/extensions/loader.js");
const root = fileURLToPath(new URL("../", import.meta.url));

test("Pi loader accepts all four workflow tools and execute receives params", async () => {
  const result = await loadExtensions([`${root}src/index.ts`], root);
  assert.deepEqual(result.errors, []);
  const tools = result.extensions[0].tools;
  assert.deepEqual([...tools.keys()], ["dev_checkpoint", "github_create_issue", "github_create_pr", "github_merge_pr"]);
  for (const { definition } of tools.values()) {
    assert.equal(definition.parameters.type, "object");
    assert.equal(typeof definition.execute, "function");
    assert.ok(definition.label);
  }
  const response = await tools.get("dev_checkpoint").definition.execute(
    "test-call", { phase: "all-completed", summary: "registration smoke test" }, undefined, undefined, {},
  );
  assert.equal(response.details.phase, "all-completed");
  assert.match(response.content[0].text, /registration smoke test/);
});
