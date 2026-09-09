const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function element(id = "") {
  return {
    id,
    value: "",
    textContent: "",
    innerHTML: "",
    disabled: false,
    dataset: {},
    attributes: {},
    handlers: {},
    classList: { toggle() {} },
    addEventListener(type, handler) { this.handlers[type] = handler; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    focus() { this.focused = true; }
  };
}

function runTool(filename, options = {}) {
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, element(id));
    return elements.get(id);
  };
  const resultPanel = element("resultPanel");
  Object.assign(resultPanel.dataset, options.resultState || {});
  const deviceButtons = options.devices
    ? ["desktop", "mobile"].map(device => {
      const button = element(`${device}Button`);
      button.dataset.serpDevice = device;
      return button;
    })
    : [];
  const clipboard = {
    value: "",
    writeText(value) {
      this.value = value;
      return Promise.resolve();
    }
  };
  const document = {
    getElementById: get,
    querySelector(selector) {
      return selector === options.resultSelector ? resultPanel : null;
    },
    querySelectorAll(selector) {
      return selector === "[data-serp-device]" ? deviceButtons : [];
    }
  };
  const script = fs.readFileSync(path.join(__dirname, `../src/assets/js/${filename}`), "utf8");
  vm.runInNewContext(script, {
    document,
    navigator: { clipboard },
    window: { setTimeout() {} },
    URL,
    Array,
    Object,
    String,
    RegExp,
    Math
  });
  return {
    get,
    resultPanel,
    deviceButtons,
    clipboard,
    input(id, value) {
      const input = get(id);
      input.value = value;
      input.handlers.input();
    },
    click(id) { return get(id).handlers.click(); }
  };
}

function wordCounter() {
  return runTool("word-counter.js", {
    resultSelector: "[data-word-state]",
    resultState: { wordState: "waiting" }
  });
}

function readabilityChecker() {
  return runTool("readability-checker.js", {
    resultSelector: "[data-readability-state]",
    resultState: { readabilityState: "waiting" }
  });
}

function serpPreview() {
  return runTool("serp-snippet-preview.js", {
    resultSelector: "[data-serp-state]",
    resultState: { serpState: "waiting" },
    devices: true
  });
}

test("Word Counter starts neutral and disables report copying", () => {
  const tool = wordCounter();
  assert.equal(tool.get("wordCount").textContent, 0);
  assert.equal(tool.get("wordCopyBtn").disabled, true);
  assert.equal(tool.resultPanel.dataset.wordState, "waiting");
});

test("Word Counter updates the complete live report", () => {
  const tool = wordCounter();
  tool.input("textInput", "One short sentence.\n\nA second useful paragraph has five words.");
  assert.equal(tool.get("wordCount").textContent, 10);
  assert.equal(tool.get("sentenceCount").textContent, 2);
  assert.equal(tool.get("paragraphCount").textContent, 2);
  assert.equal(tool.get("avgWordsPerSentence").textContent, "5.0");
  assert.equal(tool.resultPanel.dataset.wordState, "ready");
});

test("Word Counter example, copy, and reset remain functional", async () => {
  const tool = wordCounter();
  tool.click("sampleBtn");
  assert.ok(Number(tool.get("wordCount").textContent) > 0);
  await tool.click("wordCopyBtn");
  assert.match(tool.clipboard.value, /^Words: \d+/);
  assert.match(tool.get("wordStatus").textContent, /copied/i);
  tool.click("clearBtn");
  assert.equal(tool.get("textInput").value, "");
  assert.equal(tool.get("wordCopyBtn").disabled, true);
  assert.equal(tool.get("textInput").focused, true);
});

test("Readability Checker starts neutral and disables report copying", () => {
  const tool = readabilityChecker();
  assert.equal(tool.get("fleschScore").textContent, "0");
  assert.equal(tool.get("readabilityCopyBtn").disabled, true);
  assert.equal(tool.resultPanel.dataset.readabilityState, "waiting");
});

test("Readability Checker produces a complete ready result", () => {
  const tool = readabilityChecker();
  tool.input("readabilityText", "Clear writing helps people understand ideas. Short sentences improve focus.");
  assert.equal(tool.get("readabilityWords").textContent, 10);
  assert.equal(tool.get("readabilitySentences").textContent, 2);
  assert.notEqual(tool.get("fleschScore").textContent, "0");
  assert.equal(tool.get("readabilityCopyBtn").disabled, false);
  assert.equal(tool.resultPanel.dataset.readabilityState, "ready");
});

test("Readability example, copy, and reset remain functional", async () => {
  const tool = readabilityChecker();
  tool.click("readabilitySampleBtn");
  await tool.click("readabilityCopyBtn");
  assert.match(tool.clipboard.value, /Flesch Reading Ease:/);
  assert.match(tool.get("readabilityStatus").textContent, /copied/i);
  tool.click("readabilityClearBtn");
  assert.equal(tool.get("readabilityText").value, "");
  assert.equal(tool.get("readabilityCopyBtn").disabled, true);
  assert.equal(tool.get("readabilityText").focused, true);
});

test("SERP preview starts neutral with an honest placeholder state", () => {
  const tool = serpPreview();
  assert.equal(tool.get("serpCopyBtn").disabled, true);
  assert.equal(tool.resultPanel.dataset.serpState, "waiting");
  assert.equal(tool.get("serpTitleStatus").textContent, "Missing");
  assert.equal(tool.get("serpDescriptionStatus").textContent, "Missing");
});

test("SERP preview updates content, counts, and ready state", () => {
  const tool = serpPreview();
  tool.input("serpTitle", "Useful SERP Preview for Marketing Teams");
  tool.input("serpDescription", "A clear description for searchers.");
  tool.input("serpUrl", "https://example.com/guides/search-preview/");
  assert.equal(tool.get("serpPreviewTitle").textContent, "Useful SERP Preview for Marketing Teams");
  assert.equal(tool.get("serpPreviewUrl").textContent, "example.com \u203a guides \u203a search-preview");
  assert.equal(tool.get("serpCopyBtn").disabled, false);
  assert.equal(tool.resultPanel.dataset.serpState, "ready");
});

test("SERP device controls expose their selected state", () => {
  const tool = serpPreview();
  tool.deviceButtons[1].handlers.click();
  assert.equal(tool.get("serpPreview").dataset.device, "mobile");
  assert.equal(tool.deviceButtons[0].attributes["aria-pressed"], "false");
  assert.equal(tool.deviceButtons[1].attributes["aria-pressed"], "true");
});

test("SERP copy reports missing fields instead of placeholder content", async () => {
  const tool = serpPreview();
  tool.input("serpTitle", "Only a title");
  await tool.click("serpCopyBtn");
  assert.equal(tool.clipboard.value, "Title: Only a title\nDescription: Not provided\nURL: Not provided");
  assert.match(tool.get("serpStatus").textContent, /copied/i);
});

test("SERP example and reset restore their expected states", () => {
  const tool = serpPreview();
  tool.click("serpSampleBtn");
  assert.equal(tool.resultPanel.dataset.serpState, "ready");
  assert.equal(tool.get("serpTitle").focused, true);
  tool.click("serpClearBtn");
  assert.equal(tool.get("serpTitle").value, "");
  assert.equal(tool.get("serpCopyBtn").disabled, true);
  assert.equal(tool.resultPanel.dataset.serpState, "waiting");
});
