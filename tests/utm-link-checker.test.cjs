const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "../src/assets/js/utm-link-checker.js"), "utf8");

function element(id = "") {
  return {
    id, value: "", textContent: "", innerHTML: "", disabled: false, hidden: false, tabIndex: 0,
    dataset: {}, handlers: {}, children: [], style: {}, attributes: {}, className: "", title: "",
    classList: { toggle() {} },
    addEventListener(type, handler) { this.handlers[type] = handler; },
    setAttribute(name, value) { this.attributes[name] = String(value); if (name === "tabindex") this.tabIndex = Number(value); },
    removeAttribute(name) { delete this.attributes[name]; },
    appendChild(child) { this.children.push(child); return child; },
    append(...children) { this.children.push(...children); },
    remove() {}, select() {}, focus() { this.focused = true; },
    querySelectorAll() { return []; }
  };
}

function checker() {
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, element(id));
    return elements.get(id);
  };
  const singleTab = element("utmSingleTab"); singleTab.dataset.utmMode = "single";
  const batchTab = element("utmBatchTab"); batchTab.dataset.utmMode = "batch"; batchTab.tabIndex = -1;
  const singlePane = element("utmSinglePane"); singlePane.dataset.utmPane = "single";
  const batchPane = element("utmBatchPane"); batchPane.dataset.utmPane = "batch"; batchPane.hidden = true;
  const panel = element(); panel.dataset.checkerState = "waiting";
  const root = element();
  root.querySelector = selector => selector === "[data-checker-state]" ? panel : null;
  root.querySelectorAll = selector => selector === "[data-utm-mode]" ? [singleTab, batchTab] : selector === "[data-utm-pane]" ? [singlePane, batchPane] : [];
  const clipboard = { value: "", writeText(value) { this.value = value; return Promise.resolve(); } };
  const document = {
    body: element("body"),
    querySelector(selector) { return selector === "[data-utm-checker]" ? root : null; },
    getElementById: get,
    createElement() { return element(); },
    execCommand() { return true; }
  };
  vm.runInNewContext(script, {
    document, navigator: { clipboard }, window: { setTimeout() {} }, URL, Blob,
    Array, Object, String, RegExp
  });
  return {
    get, panel, clipboard, singleTab, batchTab, singlePane, batchPane,
    input(id, value) { const el = get(id); el.value = value; if (el.handlers.input) el.handlers.input({ target: el }); },
    click(id) { get(id).handlers.click(); },
    check(value) { this.input("utmCheckUrl", value); this.click("utmCheckBtn"); }
  };
}

test("valid campaign URL reaches Ready and preserves non-UTM parameters", () => {
  const c = checker();
  c.check("https://example.com/offer?keep=yes&utm_source=newsletter&utm_medium=email&utm_campaign=launch#details");
  assert.equal(c.get("utmCheckStatus").textContent, "Ready");
  const output = new URL(c.get("utmCheckOutput").value);
  assert.equal(output.searchParams.get("keep"), "yes");
  assert.equal(output.hash, "#details");
  assert.equal(c.get("utmCopyUrlBtn").disabled, false);
});

test("malformed input is invalid and cannot be copied", () => {
  const c = checker();
  c.check("not-a-url");
  assert.equal(c.get("utmCheckStatus").textContent, "Invalid");
  assert.equal(c.panel.dataset.checkerState, "invalid");
  assert.equal(c.get("utmCopyUrlBtn").disabled, true);
  assert.equal(c.get("utmCheckUrl").attributes["aria-invalid"], "true");
});

test("editing a checked URL immediately invalidates stale output", () => {
  const c = checker();
  c.check("https://example.com/?utm_source=a&utm_medium=b&utm_campaign=c");
  assert.equal(c.get("utmCheckStatus").textContent, "Ready");
  c.input("utmCheckUrl", "https://example.com/?utm_source=changed");
  assert.equal(c.get("utmCheckStatus").textContent, "Needs recheck");
  assert.equal(c.get("utmCheckOutput").value, "");
  assert.equal(c.get("utmCopyUrlBtn").disabled, true);
  assert.equal(c.get("utmCopyReportBtn").disabled, true);
  assert.match(c.get("utmCheckNotice").textContent, /Run the checker again/);
});

test("duplicates remain a review issue and normalization keeps one value", () => {
  const c = checker();
  c.check("https://example.com/?utm_source=first&utm_source=second&utm_medium=email&utm_campaign=launch");
  assert.equal(c.get("utmCheckStatus").textContent, "Needs review");
  assert.deepEqual(new URL(c.get("utmCheckOutput").value).searchParams.getAll("utm_source"), ["first"]);
});

test("missing required fields never report Ready", () => {
  const c = checker();
  c.check("https://example.com/?utm_source=newsletter");
  assert.equal(c.get("utmCheckStatus").textContent, "Needs review");
  assert.equal(c.get("utmCheckRequired").textContent, "1 / 3");
});

test("reset clears state and returns focus to the URL field", () => {
  const c = checker();
  c.check("https://example.com/?utm_source=a&utm_medium=b&utm_campaign=c");
  c.click("utmCheckClearBtn");
  assert.equal(c.get("utmCheckStatus").textContent, "Not checked");
  assert.equal(c.get("utmCheckOutput").value, "");
  assert.equal(c.get("utmCheckUrl").focused, true);
});

test("arrow keys switch tabs with roving tabindex", () => {
  const c = checker();
  let prevented = false;
  c.singleTab.handlers.keydown({ key: "ArrowRight", preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(c.singleTab.tabIndex, -1);
  assert.equal(c.batchTab.tabIndex, 0);
  assert.equal(c.singlePane.hidden, true);
  assert.equal(c.batchPane.hidden, false);
  assert.equal(c.batchTab.focused, true);
});

test("copy URL uses the current checked result", async () => {
  const c = checker();
  c.check("https://example.com/?utm_source=a&utm_medium=b&utm_campaign=c");
  c.click("utmCopyUrlBtn");
  await Promise.resolve();
  assert.equal(c.clipboard.value, c.get("utmCheckOutput").value);
});
