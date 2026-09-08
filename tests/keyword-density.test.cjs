const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "../src/assets/js/keyword-density.js"), "utf8");

function density() {
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, {
      value: "", textContent: "", innerHTML: "", disabled: false, handlers: {}, children: [], style: {},
      addEventListener(type, handler) { this.handlers[type] = handler; },
      focus() { this.focused = true; }, setAttribute() {}, select() {}, remove() {},
      querySelectorAll() { return []; }
    });
    return elements.get(id);
  };
  const clipboard = { value: "", writeText(value) { this.value = value; return Promise.resolve(); } };
  const document = {
    body: { appendChild() {} }, getElementById: get,
    createElement() { return { value: "", style: {}, setAttribute() {}, select() {}, remove() {} }; },
    execCommand() { return true; }
  };
  vm.runInNewContext(script, { document, navigator: { clipboard }, window: { setTimeout() {} }, Set, Object, Array });
  return {
    get, clipboard,
    input(value) { const el = get("densityText"); el.value = value; el.handlers.input(); },
    click(id) { get(id).handlers.click(); }
  };
}

test("empty state is neutral and copy is disabled", () => {
  const d = density();
  assert.equal(d.get("densityWordCount").textContent, 0);
  assert.equal(d.get("densityCopyBtn").disabled, true);
  assert.match(d.get("densityStatus").textContent, /Add content/);
});

test("counts short terms such as AI instead of silently dropping them", () => {
  const d = density();
  d.input("AI AI SEO SEO keyword density checker keyword density checker");
  assert.equal(d.get("densityWordCount").textContent, 10);
  assert.equal(d.get("densityTopKeyword").textContent, "ai");
  assert.equal(d.get("densityTopPercent").textContent, "20.00%");
  assert.match(d.get("densityResults").innerHTML, />ai</);
});

test("supports Unicode words and case-insensitive counting", () => {
  const d = density();
  d.input("Café CAFÉ 夏 夏 marketing");
  assert.equal(d.get("densityWordCount").textContent, 5);
  assert.match(d.get("densityResults").innerHTML, /café/);
  assert.match(d.get("densityResults").innerHTML, /夏/);
});

test("does not present unsupported SEO health thresholds", () => {
  const d = density();
  d.input("seo seo seo seo seo");
  assert.doesNotMatch(d.get("densityResults").innerHTML, /healthy|overuse|high/i);
  assert.doesNotMatch(script, /Potential overuse|Healthy range|Getting high/);
});

test("sample creates results and clear restores the waiting state", () => {
  const d = density();
  d.click("densitySampleBtn");
  assert.ok(Number(d.get("densityWordCount").textContent) > 0);
  assert.equal(d.get("densityCopyBtn").disabled, false);
  d.click("densityClearBtn");
  assert.equal(d.get("densityWordCount").textContent, 0);
  assert.equal(d.get("densityCopyBtn").disabled, true);
  assert.equal(d.get("densityText").focused, true);
});

test("copy report uses the current analysis and announces success", async () => {
  const d = density();
  d.input("campaign campaign review");
  d.click("densityCopyBtn");
  await Promise.resolve();
  assert.match(d.clipboard.value, /Top term: campaign/);
  assert.equal(d.get("densityStatus").textContent, "Report copied to clipboard.");
});
