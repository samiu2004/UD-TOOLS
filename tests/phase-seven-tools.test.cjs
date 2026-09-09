const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const generatorScript = fs.readFileSync(path.join(__dirname, "../src/assets/js/qr-code-generator.js"), "utf8");
const scannerScript = fs.readFileSync(path.join(__dirname, "../src/assets/js/qr-barcode-scanner.js"), "utf8");
const headersTemplate = fs.readFileSync(path.join(__dirname, "../src/headers.njk"), "utf8");

function element(id = "") {
  return {
    id,
    value: "",
    textContent: "",
    innerHTML: "",
    disabled: false,
    hidden: false,
    files: [],
    dataset: {},
    attributes: {},
    handlers: {},
    addEventListener(type, handler) { this.handlers[type] = handler; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    focus() { this.focused = true; }
  };
}

function generator(options = {}) {
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, element(id));
    return elements.get(id);
  };
  get("qrSize").value = "300";
  get("qrErrorLevel").value = "M";
  get("qrMargin").value = "4";

  const resultPanel = element("resultPanel");
  resultPanel.dataset.qrState = "waiting";
  const image = element("previewImage");
  image.complete = options.imageComplete !== false;
  image.naturalWidth = options.imageError ? 0 : 300;
  get("qrPreview").querySelector = selector => selector === "img" ? image : null;

  const downloads = [];
  const document = {
    body: { appendChild() {} },
    getElementById: get,
    querySelector(selector) { return selector === "[data-qr-state]" ? resultPanel : null; },
    createElement(tag) {
      const link = element(tag);
      link.click = () => downloads.push({ href: link.href, download: link.download });
      link.remove = () => {};
      return link;
    }
  };

  vm.runInNewContext(generatorScript, {
    document,
    window: {},
    URLSearchParams,
    Array,
    Object,
    String
  });

  return {
    get,
    image,
    resultPanel,
    downloads,
    input(id, value) {
      const input = get(id);
      input.value = value;
      input.handlers.input();
    },
    change(id, value) {
      const input = get(id);
      input.value = value;
      input.handlers.change();
    },
    click(id) { return get(id).handlers.click(); }
  };
}

function scanner(options = {}) {
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, element(id));
    return elements.get(id);
  };
  get("scannerUploadStage").hidden = true;
  get("scannerVideo").readyState = 2;
  get("scannerVideo").videoWidth = 640;
  get("scannerVideo").videoHeight = 480;
  get("scannerVideo").play = () => Promise.resolve();

  const resultPanel = element("resultPanel");
  resultPanel.dataset.scannerState = "waiting";
  const clipboard = {
    value: "",
    writeText(value) { this.value = value; return Promise.resolve(); }
  };
  const context = {
    drawImage() {},
    getImageData() { return { data: new Uint8ClampedArray(4), width: 1, height: 1 }; }
  };
  const canvas = element("canvas");
  canvas.getContext = () => context;
  const document = {
    getElementById: get,
    querySelector(selector) { return selector === "[data-scanner-state]" ? resultPanel : null; },
    createElement(tag) { return tag === "canvas" ? canvas : element(tag); }
  };

  class FakeFileReader {
    readAsDataURL() {
      this.result = "data:image/png;base64,dGVzdA==";
      this.onload();
    }
  }

  class FakeImage {
    constructor() {
      this.width = 100;
      this.height = 100;
    }
    set src(value) {
      this._src = value;
      this.onload();
    }
    get src() { return this._src; }
  }

  const tracks = [{ stopped: false, stop() { this.stopped = true; } }];
  const stream = { getTracks() { return tracks; } };
  const mediaDevices = options.cameraSupported
    ? { getUserMedia() { return Promise.resolve(stream); } }
    : undefined;
  const window = {
    jsQR: options.decodedValue ? () => ({ data: options.decodedValue }) : () => null,
    addEventListener() {},
    setTimeout() {}
  };

  vm.runInNewContext(scannerScript, {
    document,
    window,
    navigator: { mediaDevices, clipboard },
    FileReader: FakeFileReader,
    Image: FakeImage,
    Uint8ClampedArray,
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() {},
    Array,
    Object,
    String,
    Promise
  });

  return {
    get,
    resultPanel,
    clipboard,
    tracks,
    click(id) { return get(id).handlers.click(); },
    async upload() {
      get("scannerFileInput").files = [{ name: "code.png" }];
      get("scannerFileInput").handlers.change();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    }
  };
}

test("QR Generator starts neutral with downloads disabled", () => {
  const tool = generator();
  assert.equal(tool.resultPanel.dataset.qrState, "waiting");
  assert.equal(tool.get("qrDownloadPngBtn").disabled, true);
  assert.equal(tool.get("qrDownloadSvgBtn").disabled, true);
  assert.equal(tool.get("qrContentStatus").textContent, "Empty");
});

test("QR Generator creates a ready preview and updates settings", () => {
  const tool = generator();
  tool.input("qrContent", "https://example.com/campaign/?source=qr");
  assert.equal(tool.resultPanel.dataset.qrState, "ready");
  assert.equal(tool.get("qrDownloadPngBtn").disabled, false);
  assert.match(tool.get("qrPreview").innerHTML, /quickchart\.io\/qr\?/);
  tool.change("qrSize", "600");
  tool.change("qrErrorLevel", "H");
  assert.equal(tool.get("qrSelectedSize").textContent, "600");
  assert.equal(tool.get("qrSelectedLevel").textContent, "H");
});

test("production content security policy allows QuickChart QR previews", () => {
  const sitePolicy = headersTemplate
    .split(/\r?\n/)
    .find(line => line.includes("script-src"));

  assert.match(sitePolicy, /img-src[^;]*https:\/\/quickchart\.io(?:\s|;)/);
});

test("QR Generator reports a failed external preview honestly", () => {
  const tool = generator({ imageError: true });
  tool.input("qrContent", "https://example.com/");
  assert.equal(tool.resultPanel.dataset.qrState, "error");
  assert.match(tool.get("qrStatus").textContent, /could not generate/i);
  assert.equal(tool.get("qrDownloadPngBtn").disabled, true);
});

test("QR Generator example and reset preserve usable focus and defaults", () => {
  const tool = generator();
  tool.click("qrSampleBtn");
  assert.match(tool.get("qrContent").value, /^https:\/\//);
  assert.equal(tool.get("qrContent").focused, true);
  tool.change("qrSize", "600");
  tool.click("qrClearBtn");
  assert.equal(tool.get("qrContent").value, "");
  assert.equal(tool.get("qrSize").value, "300");
  assert.equal(tool.resultPanel.dataset.qrState, "waiting");
});

test("QR Generator downloads use the current format and content", () => {
  const tool = generator();
  tool.input("qrContent", "https://example.com/");
  tool.click("qrDownloadPngBtn");
  tool.click("qrDownloadSvgBtn");
  assert.equal(tool.downloads[0].download, "qr-code.png");
  assert.match(tool.downloads[0].href, /format=png/);
  assert.equal(tool.downloads[1].download, "qr-code.svg");
  assert.match(tool.downloads[1].href, /format=svg/);
});

test("QR Scanner starts in a clear waiting state", () => {
  const tool = scanner();
  assert.equal(tool.resultPanel.dataset.scannerState, "waiting");
  assert.equal(tool.get("scannerCopyBtn").disabled, true);
  assert.equal(tool.get("scannerStopBtn").disabled, true);
});

test("QR Scanner gives an upload recovery when camera is unavailable", async () => {
  const tool = scanner();
  await tool.click("scannerStartBtn");
  assert.equal(tool.get("scannerCameraStatus").textContent, "Unsupported");
  assert.equal(tool.resultPanel.dataset.scannerState, "review");
  assert.match(tool.get("scannerStatus").textContent, /Upload an image/);
});

test("QR Scanner decodes an uploaded image and copies the result", async () => {
  const tool = scanner({ decodedValue: "https://example.com/decoded" });
  await tool.upload();
  assert.equal(tool.get("scannerResult").value, "https://example.com/decoded");
  assert.equal(tool.resultPanel.dataset.scannerState, "ready");
  assert.equal(tool.get("scannerCopyBtn").disabled, false);
  await tool.click("scannerCopyBtn");
  assert.equal(tool.clipboard.value, "https://example.com/decoded");
  assert.match(tool.get("scannerStatus").textContent, /copied/i);
});

test("QR Scanner reports an uploaded image without a code", async () => {
  const tool = scanner();
  await tool.upload();
  assert.equal(tool.get("scannerResult").value, "");
  assert.equal(tool.get("scannerDetectedFormat").textContent, "Not found");
  assert.equal(tool.resultPanel.dataset.scannerState, "review");
  assert.equal(tool.get("scannerCopyBtn").disabled, true);
});

test("QR Scanner starts and stops a supported camera cleanly", async () => {
  const tool = scanner({ cameraSupported: true });
  await tool.click("scannerStartBtn");
  await Promise.resolve();
  assert.equal(tool.get("scannerCameraStatus").textContent, "Scanning");
  assert.equal(tool.get("scannerStartBtn").disabled, true);
  assert.equal(tool.get("scannerStopBtn").disabled, false);
  tool.click("scannerStopBtn");
  assert.equal(tool.get("scannerCameraStatus").textContent, "Stopped");
  assert.equal(tool.tracks[0].stopped, true);
});

test("QR Scanner clear restores the initial result state", async () => {
  const tool = scanner({ decodedValue: "decoded" });
  await tool.upload();
  tool.click("scannerClearBtn");
  assert.equal(tool.get("scannerResult").value, "");
  assert.equal(tool.get("scannerFileInput").value, "");
  assert.equal(tool.get("scannerUploadStage").hidden, true);
  assert.equal(tool.resultPanel.dataset.scannerState, "waiting");
  assert.equal(tool.get("scannerStartBtn").focused, true);
});
