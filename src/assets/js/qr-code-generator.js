(function () {
  const contentInput = document.getElementById("qrContent");
  const sizeInput = document.getElementById("qrSize");
  const levelInput = document.getElementById("qrErrorLevel");
  const marginInput = document.getElementById("qrMargin");

  if (!contentInput || !sizeInput || !levelInput || !marginInput) return;

  const clearBtn = document.getElementById("qrClearBtn");
  const sampleBtn = document.getElementById("qrSampleBtn");
  const downloadPngBtn = document.getElementById("qrDownloadPngBtn");
  const downloadSvgBtn = document.getElementById("qrDownloadSvgBtn");

  const statusEl = document.getElementById("qrContentStatus");
  const sizeEl = document.getElementById("qrSelectedSize");
  const levelEl = document.getElementById("qrSelectedLevel");
  const marginEl = document.getElementById("qrSelectedMargin");
  const previewEl = document.getElementById("qrPreview");
  const tipsEl = document.getElementById("qrTips");

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getQrUrl(format) {
    const content = contentInput.value.trim();
    const size = sizeInput.value;
    const level = levelInput.value;
    const margin = marginInput.value;

    if (!content) return "";

    const params = new URLSearchParams({
      text: content,
      size: `${size}`,
      ecLevel: level,
      margin: `${margin}`,
      format: format
    });

    return `https://quickchart.io/qr?${params.toString()}`;
  }

  function renderTips(content, size, level, margin) {
    if (!content) {
      tipsEl.innerHTML = '<p class="muted">QR best-practice guidance will appear here as you fill in the fields.</p>';
      return;
    }

    const tips = [
      "<p><strong>Contrast:</strong> Dark QR modules on a light background scan most reliably.</p>",
      "<p><strong>Quiet zone:</strong> Keep a clear margin around the code. Four modules is the standard minimum.</p>",
      "<p><strong>Size:</strong> Larger codes scan more reliably, especially for print or distance scanning.</p>",
      `<p><strong>Your settings:</strong> ${size} × ${size}px, error correction ${level}, margin ${margin} modules.</p>`
    ];

    if (level === "H" || level === "Q") {
      tips.push("<p><strong>Error correction:</strong> Higher correction helps when the code may be damaged or partially covered, but it increases complexity.</p>");
    } else {
      tips.push("<p><strong>Error correction:</strong> Medium is a good default for general links and campaign QR codes.</p>");
    }

    tipsEl.innerHTML = tips.join("");
  }

  function renderPreview() {
    const content = contentInput.value.trim();
    const size = sizeInput.value;
    const level = levelInput.value;
    const margin = marginInput.value;

    statusEl.textContent = content ? "Ready" : "Empty";
    sizeEl.textContent = size;
    levelEl.textContent = level;
    marginEl.textContent = margin;

    if (!content) {
      previewEl.innerHTML = '<p class="muted">Your QR code preview will appear here.</p>';
      renderTips(content, size, level, margin);
      return;
    }

    const pngUrl = getQrUrl("png");

    previewEl.innerHTML = `
      <img
        src="${pngUrl}"
        alt="Generated QR code preview"
        width="${size}"
        height="${size}"
        loading="lazy"
        decoding="async"
        style="max-width:100%; height:auto; background:#fff; padding:16px; border-radius:12px;"
      />
      <p class="muted" style="margin-top:16px; text-align:center; word-break:break-word;">${escapeHtml(content)}</p>
    `;

    renderTips(content, size, level, margin);
  }

  function downloadFile(url, filename) {
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function clearAll() {
    contentInput.value = "";
    sizeInput.value = "300";
    levelInput.value = "M";
    marginInput.value = "4";
    renderPreview();
  }

  function loadSample() {
    contentInput.value = "https://udmarketing.online/tools/utm-builder/?utm_source=qr&utm_medium=offline&utm_campaign=summer-promo";
    sizeInput.value = "300";
    levelInput.value = "M";
    marginInput.value = "4";
    renderPreview();
  }

  [contentInput, sizeInput, levelInput, marginInput].forEach((element) => {
    element.addEventListener("input", renderPreview);
    element.addEventListener("change", renderPreview);
  });

  clearBtn.addEventListener("click", clearAll);
  sampleBtn.addEventListener("click", loadSample);

  downloadPngBtn.addEventListener("click", function () {
    const url = getQrUrl("png");
    if (!url) return;
    downloadFile(url, "qr-code.png");
  });

  downloadSvgBtn.addEventListener("click", function () {
    const url = getQrUrl("svg");
    if (!url) return;
    downloadFile(url, "qr-code.svg");
  });

  renderPreview();
})();