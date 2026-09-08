const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "../src/assets/js/campaign-url-builder.js"), "utf8");

// Run the actual browser script and event handlers without a DOM dependency.
function builder() {
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, {
        value: "", textContent: "", innerHTML: "", handlers: {},
        addEventListener(event, handler) { this.handlers[event] = handler; },
        focus() {}
      });
      return elements.get(id);
    }
  };
  vm.runInNewContext(script, { document, URL, URLSearchParams });
  const get = id => document.getElementById(id);
  return {
    get,
    input(id, value) { get(id).value = value; get(id).handlers.input(); },
    click(id) { get(id).handlers.click(); },
    complete(url) {
      this.input("campaignBaseUrl", url);
      this.input("utmSource", "newsletter");
      this.input("utmMedium", "email");
      this.input("utmCampaign", "launch");
    },
    output() { return get("campaignOutput").value; },
    assertNotReady() {
      assert.equal(this.output(), "");
      assert.equal(Number(get("campaignLength").textContent), 0);
      assert.equal(get("campaignRequiredStatus").textContent, "Incomplete");
      assert.doesNotMatch(get("campaignTips").innerHTML, /ready for campaign reporting|short and clean/);
    }
  };
}

test("plain HTTPS URL generates a ready campaign link", () => {
  const b = builder(); b.complete("https://example.com/offer");
  assert.equal(b.output(), "https://example.com/offer?utm_source=newsletter&utm_medium=email&utm_campaign=launch");
  assert.equal(b.get("campaignRequiredStatus").textContent, "Ready");
  assert.match(b.get("campaignTips").innerHTML, /ready for campaign reporting/);
});

test("allows HTTP and surrounding whitespace", () => {
  const b = builder(); b.complete("  http://example.com/offer  ");
  assert.match(b.output(), /^http:\/\/example.com\/offer\?/);
});

test("preserves non-UTM query encoding, duplicates and empty values", () => {
  const b = builder();
  const query = "q=a%20b&tag=one&tag=two&empty=&flag&token=a%2Bb%2f~";
  b.complete("https://example.com/?" + query);
  assert.ok(b.output().startsWith("https://example.com/?" + query + "&utm_source="));
  assert.deepEqual(new URL(b.output()).searchParams.getAll("tag"), ["one", "two"]);
});

test("parameters precede a fragment that contains a question mark", () => {
  const b = builder(); b.complete("https://example.com/offer#pricing?tab=one");
  const url = new URL(b.output());
  assert.equal(url.hash, "#pricing?tab=one");
  assert.equal(url.searchParams.get("utm_source"), "newsletter");
});

test("preserves existing query and encoded fragment together", () => {
  const b = builder(); b.complete("https://example.com/offer?product=42#price%20table");
  const url = new URL(b.output());
  assert.equal(url.searchParams.get("product"), "42");
  assert.equal(url.hash, "#price%20table");
});

test("replaces all UTM keys, including encoded and mixed-case duplicates", () => {
  const b = builder();
  b.complete("https://example.com/?utm_source=old&UTM_SOURCE=other&%75tm_source=third&utm_content=old&utm_id=legacy&keep=yes");
  const url = new URL(b.output());
  assert.deepEqual(url.searchParams.getAll("utm_source"), ["newsletter"]);
  for (const key of ["UTM_SOURCE", "utm_content", "utm_id"]) assert.equal(url.searchParams.has(key), false);
  assert.equal(url.searchParams.get("keep"), "yes");
  assert.match(b.get("campaignTips").innerHTML, /Existing UTM parameters are replaced/);
});

test("retains UTM-like non-UTM names", () => {
  const b = builder(); b.complete("https://example.com/?my_utm_source=keep&utm=keep&x=utm_source");
  const params = new URL(b.output()).searchParams;
  assert.equal(params.get("my_utm_source"), "keep");
  assert.equal(params.get("utm"), "keep");
  assert.equal(params.get("x"), "utm_source");
});

for (const value of [
  "not-a-url", "example.com", "/relative", "//example.com", "https://", "https:///example.com",
  "https:example.com", "https://exa mple.com", "https://example.com/a b", "https://example.com/%ZZ",
  "https://example.com:99999/", "https://[bad]/", "https://example.com/\\other", "https://example.com/\npath",
  "javascript:alert(1)", "data:text/html,test", "file:///tmp/test", "ftp://example.com/file",
  "https://user:password@example.com/"
]) {
  test("rejects destination " + JSON.stringify(value), () => {
    const b = builder(); b.complete(value); b.assertNotReady();
    assert.equal(b.get("campaignUrlStatus").textContent, "Invalid");
    assert.match(b.get("campaignTips").innerHTML, /Enter a complete/);
  });
}

test("supports Unicode domain, path, fragment and campaign value", () => {
  const b = builder(); b.complete("https://m\u00fcnich.example/caf\u00e9?label=%E2%9C%93#r\u00e9sum\u00e9");
  b.input("utmCampaign", "\u590f\u306e\u30bb\u30fc\u30eb");
  const url = new URL(b.output());
  assert.equal(url.hostname, "xn--mnich-kva.example");
  assert.equal(decodeURIComponent(url.pathname), "/caf\u00e9");
  assert.equal(decodeURIComponent(url.hash), "#r\u00e9sum\u00e9");
  assert.equal(url.searchParams.get("utm_campaign"), "\u590f\u306e\u30bb\u30fc\u30eb");
  assert.equal(url.searchParams.get("label"), "\u2713");
});

for (const id of ["campaignBaseUrl", "utmSource", "utmMedium", "utmCampaign"]) {
  test("missing required field clears ready output: " + id, () => {
    const b = builder(); b.complete("https://example.com/"); b.input(id, "   "); b.assertNotReady();
  });
}

test("existing UTM values do not bypass required form fields", () => {
  const b = builder();
  b.input("campaignBaseUrl", "https://example.com/?utm_source=old&utm_medium=email&utm_campaign=old");
  b.assertNotReady();
});

test("invalid edit clears output; correcting it restores Ready", () => {
  const b = builder(); b.complete("https://example.com/");
  b.input("campaignBaseUrl", "not-a-url"); b.assertNotReady();
  b.input("campaignBaseUrl", "https://example.com/#ok");
  assert.equal(b.get("campaignRequiredStatus").textContent, "Ready");
  assert.equal(new URL(b.output()).hash, "#ok");
});

test("optional fields retain existing normalization and can be removed", () => {
  const b = builder(); b.complete("https://example.com/");
  b.input("utmContent", " Hero Button "); b.input("utmTerm", "SEO & Paid");
  const url = new URL(b.output());
  assert.equal(url.searchParams.get("utm_content"), "hero-button");
  assert.equal(url.searchParams.get("utm_term"), "seo-&-paid");
  b.input("utmContent", "");
  assert.equal(new URL(b.output()).searchParams.has("utm_content"), false);
});

test("example and clear handlers work", () => {
  const b = builder(); b.assertNotReady(); b.click("campaignSampleBtn");
  assert.equal(b.get("campaignRequiredStatus").textContent, "Ready");
  b.click("campaignClearBtn"); b.assertNotReady();
  assert.equal(b.get("campaignUrlStatus").textContent, "Missing");
});
