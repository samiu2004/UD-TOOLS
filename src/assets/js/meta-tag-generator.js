const metaTitle = document.getElementById("metaTitle");
const metaDescription = document.getElementById("metaDescription");
const metaCanonical = document.getElementById("metaCanonical");
const metaRobots = document.getElementById("metaRobots");
const metaOgImage = document.getElementById("metaOgImage");
const metaClearBtn = document.getElementById("metaClearBtn");
const metaSampleBtn = document.getElementById("metaSampleBtn");
const metaTitleCount = document.getElementById("metaTitleCount");
const metaDescriptionCount = document.getElementById("metaDescriptionCount");
const metaCanonicalStatus = document.getElementById("metaCanonicalStatus");
const metaImageStatus = document.getElementById("metaImageStatus");
const metaOutput = document.getElementById("metaOutput");
const metaTips = document.getElementById("metaTips");

if (metaTitle) {
  function updateMetaTags() {
    const title = metaTitle.value.trim();
    const description = metaDescription.value.trim();
    const canonical = metaCanonical.value.trim();
    const robots = metaRobots.value.trim() || "index, follow";
    const image = metaOgImage.value.trim();

    metaTitleCount.textContent = title.length;
    metaDescriptionCount.textContent = description.length;
    metaCanonicalStatus.textContent = canonical ? "Added" : "Missing";
    metaImageStatus.textContent = image ? "Added" : "Missing";

    const output = [];

    if (title) {
      output.push(`<title>${title}</title>`);
      output.push(`<meta name="title" content="${title}">`);
      output.push(`<meta property="og:title" content="${title}">`);
      output.push(`<meta name="twitter:title" content="${title}">`);
    }

    if (description) {
      output.push(`<meta name="description" content="${description}">`);
      output.push(`<meta property="og:description" content="${description}">`);
      output.push(`<meta name="twitter:description" content="${description}">`);
    }

    if (canonical) {
      output.push(`<link rel="canonical" href="${canonical}">`);
      output.push(`<meta property="og:url" content="${canonical}">`);
      output.push(`<meta name="twitter:url" content="${canonical}">`);
    }

    output.push(`<meta name="robots" content="${robots}">`);
    output.push(`<meta property="og:type" content="website">`);
    output.push(`<meta name="twitter:card" content="summary_large_image">`);

    if (image) {
      output.push(`<meta property="og:image" content="${image}">`);
      output.push(`<meta name="twitter:image" content="${image}">`);
    }

    metaOutput.value = output.join("\n");

    const tips = [];

    if (!title) {
      tips.push("Add a page title so search engines and social platforms have a primary heading.");
    } else if (title.length < 30) {
      tips.push("Your title is short. Consider adding more context if it still reads naturally.");
    } else if (title.length > 60) {
      tips.push("Your title is long. It may get truncated in search results.");
    } else {
      tips.push("Your title length looks solid for most search previews.");
    }

    if (!description) {
      tips.push("Add a meta description to improve search snippet control.");
    } else if (description.length < 120) {
      tips.push("Your description is short. You can add more context or a stronger value statement.");
    } else if (description.length > 160) {
      tips.push("Your description is long. It may be cut off in search results.");
    } else {
      tips.push("Your description length is in a strong range for many search snippets.");
    }

    if (!canonical) {
      tips.push("Add a canonical URL to point search engines to the preferred version of the page.");
    }

    if (!image) {
      tips.push("Add an image URL so shared links can show a richer preview on social platforms.");
    }

    metaTips.innerHTML = tips.map(tip => `<p>${tip}</p>`).join("");
  }

  function clearMetaFields() {
    metaTitle.value = "";
    metaDescription.value = "";
    metaCanonical.value = "";
    metaRobots.value = "index, follow";
    metaOgImage.value = "";
    updateMetaTags();
    metaTitle.focus();
  }

  function loadMetaExample() {
    metaTitle.value = "Free Meta Tag Generator for SEO and Social Sharing";
    metaDescription.value = "Generate clean title tags, meta descriptions, canonical URLs, Open Graph tags, and Twitter card markup for better search and social previews.";
    metaCanonical.value = "https://udmarketing.online/tools/meta-tag-generator/";
    metaRobots.value = "index, follow";
    metaOgImage.value = "https://udmarketing.online/assets/images/og-image.png";
    updateMetaTags();
    metaTitle.focus();
  }

  [metaTitle, metaDescription, metaCanonical, metaRobots, metaOgImage].forEach(field => {
    field.addEventListener("input", updateMetaTags);
  });

  metaClearBtn.addEventListener("click", clearMetaFields);
  metaSampleBtn.addEventListener("click", loadMetaExample);

  updateMetaTags();
}
