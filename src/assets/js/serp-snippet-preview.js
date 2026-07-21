const serpTitle = document.getElementById("serpTitle");
const serpDescription = document.getElementById("serpDescription");
const serpUrl = document.getElementById("serpUrl");
const serpTitleCount = document.getElementById("serpTitleCount");
const serpDescriptionCount = document.getElementById("serpDescriptionCount");
const serpTitleStatus = document.getElementById("serpTitleStatus");
const serpDescriptionStatus = document.getElementById("serpDescriptionStatus");
const serpPreviewTitle = document.getElementById("serpPreviewTitle");
const serpPreviewDescription = document.getElementById("serpPreviewDescription");
const serpPreviewUrl = document.getElementById("serpPreviewUrl");
const serpPreview = document.getElementById("serpPreview");
const serpClearBtn = document.getElementById("serpClearBtn");
const serpSampleBtn = document.getElementById("serpSampleBtn");
const serpCopyBtn = document.getElementById("serpCopyBtn");
const serpDeviceButtons = document.querySelectorAll("[data-serp-device]");

if (serpTitle) {
  const defaults = {
    title: "Your page title will appear here",
    description: "Add a meta description to preview how your page could look in Google search results.",
    url: "https://example.com/page/"
  };

  function getLengthStatus(length, min, max) {
    if (!length) return { label: "Missing", tone: "missing" };
    if (length < min) return { label: "Short", tone: "warning" };
    if (length > max) return { label: "Long", tone: "warning" };
    return { label: "Good", tone: "good" };
  }

  function formatUrl(value) {
    if (!value) return defaults.url;

    try {
      const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
      const parsed = new URL(normalized);
      const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
      return `${parsed.hostname}${path.replaceAll("/", " › ")}`;
    } catch {
      return value;
    }
  }

  function applyStatus(element, status) {
    element.textContent = status.label;
    element.dataset.tone = status.tone;
  }

  function updatePreview() {
    const title = serpTitle.value.trim();
    const description = serpDescription.value.trim();
    const url = serpUrl.value.trim();
    const titleStatus = getLengthStatus(title.length, 30, 60);
    const descriptionStatus = getLengthStatus(description.length, 120, 160);

    serpTitleCount.textContent = `${title.length} / 60`;
    serpDescriptionCount.textContent = `${description.length} / 160`;
    applyStatus(serpTitleStatus, titleStatus);
    applyStatus(serpDescriptionStatus, descriptionStatus);

    serpPreviewTitle.textContent = title || defaults.title;
    serpPreviewDescription.textContent = description || defaults.description;
    serpPreviewUrl.textContent = formatUrl(url);
  }

  function setDevice(device) {
    serpPreview.dataset.device = device;
    serpDeviceButtons.forEach(button => {
      const isActive = button.dataset.serpDevice === device;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  async function copyPreview() {
    const report = [
      `Title: ${serpTitle.value.trim() || defaults.title}`,
      `Description: ${serpDescription.value.trim() || defaults.description}`,
      `URL: ${serpUrl.value.trim() || defaults.url}`
    ].join("\n");

    try {
      await navigator.clipboard.writeText(report);
      serpCopyBtn.textContent = "Copied";
      window.setTimeout(() => {
        serpCopyBtn.textContent = "Copy Preview";
      }, 1600);
    } catch {
      serpCopyBtn.textContent = "Copy failed";
    }
  }

  [serpTitle, serpDescription, serpUrl].forEach(field => {
    field.addEventListener("input", updatePreview);
  });

  serpDeviceButtons.forEach(button => {
    button.addEventListener("click", () => setDevice(button.dataset.serpDevice));
  });

  serpClearBtn.addEventListener("click", () => {
    serpTitle.value = "";
    serpDescription.value = "";
    serpUrl.value = "";
    updatePreview();
    serpTitle.focus();
  });

  serpSampleBtn.addEventListener("click", () => {
    serpTitle.value = "SERP Snippet Preview Tool for Better Search Listings";
    serpDescription.value = "Preview a page title, URL, and meta description before publishing. Check practical length guidance for desktop and mobile search results.";
    serpUrl.value = "https://udmarketing.online/tools/serp-snippet-preview/";
    updatePreview();
    serpTitle.focus();
  });

  serpCopyBtn.addEventListener("click", copyPreview);
  setDevice("desktop");
  updatePreview();
}
