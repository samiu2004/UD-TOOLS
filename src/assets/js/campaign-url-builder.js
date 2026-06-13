const campaignBaseUrl = document.getElementById("campaignBaseUrl");
const utmSource = document.getElementById("utmSource");
const utmMedium = document.getElementById("utmMedium");
const utmCampaign = document.getElementById("utmCampaign");
const utmContent = document.getElementById("utmContent");
const utmTerm = document.getElementById("utmTerm");
const campaignClearBtn = document.getElementById("campaignClearBtn");
const campaignSampleBtn = document.getElementById("campaignSampleBtn");
const campaignUrlStatus = document.getElementById("campaignUrlStatus");
const campaignRequiredStatus = document.getElementById("campaignRequiredStatus");
const campaignLength = document.getElementById("campaignLength");
const campaignParamCount = document.getElementById("campaignParamCount");
const campaignOutput = document.getElementById("campaignOutput");
const campaignTips = document.getElementById("campaignTips");

if (campaignBaseUrl) {
  function cleanValue(value) {
    return value.trim().toLowerCase().replace(/\s+/g, "-");
  }

  function updateCampaignUrl() {
    const baseUrl = campaignBaseUrl.value.trim();
    const source = cleanValue(utmSource.value);
    const medium = cleanValue(utmMedium.value);
    const campaign = cleanValue(utmCampaign.value);
    const content = cleanValue(utmContent.value);
    const term = cleanValue(utmTerm.value);

    const params = new URLSearchParams();

    if (source) params.set("utm_source", source);
    if (medium) params.set("utm_medium", medium);
    if (campaign) params.set("utm_campaign", campaign);
    if (content) params.set("utm_content", content);
    if (term) params.set("utm_term", term);

    const requiredReady = baseUrl && source && medium && campaign;
    const paramCount =
      (source ? 1 : 0) +
      (medium ? 1 : 0) +
      (campaign ? 1 : 0) +
      (content ? 1 : 0) +
      (term ? 1 : 0);

    campaignUrlStatus.textContent = baseUrl ? "Added" : "Missing";
    campaignRequiredStatus.textContent = requiredReady ? "Ready" : "Incomplete";
    campaignParamCount.textContent = paramCount;

    let finalUrl = "";

    if (baseUrl) {
      finalUrl = paramCount ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}${params.toString()}` : baseUrl;
    }

    campaignOutput.value = finalUrl;
    campaignLength.textContent = finalUrl.length;

    const tips = [];

    if (!baseUrl) {
      tips.push("Add the website URL first. This is the page you want people to visit.");
    }

    if (!source) {
      tips.push("Add utm_source to show where the traffic came from, such as google, newsletter, or linkedin.");
    }

    if (!medium) {
      tips.push("Add utm_medium to describe the channel, such as email, cpc, or social.");
    }

    if (!campaign) {
      tips.push("Add utm_campaign to name the promotion, launch, or offer you are tracking.");
    }

    if (source && medium && campaign) {
      tips.push("Your main tracking fields are in place. This URL is ready for campaign reporting.");
    }

    if (content) {
      tips.push("utm_content helps separate different ad versions, button links, or creative variations.");
    }

    if (term) {
      tips.push("utm_term is useful when you want to track paid keywords or audience terms.");
    }

    if (finalUrl.length > 0 && finalUrl.length < 60) {
      tips.push("Your campaign URL is short and clean.");
    } else if (finalUrl.length > 120) {
      tips.push("Your campaign URL is getting long. Keep naming simple so links stay manageable.");
    }

    campaignTips.innerHTML = tips.map(tip => `<p>${tip}</p>`).join("");
  }

  function clearCampaignFields() {
    campaignBaseUrl.value = "";
    utmSource.value = "";
    utmMedium.value = "";
    utmCampaign.value = "";
    utmContent.value = "";
    utmTerm.value = "";
    updateCampaignUrl();
    campaignBaseUrl.focus();
  }

  function loadCampaignExample() {
    campaignBaseUrl.value = "https://udmarketing.online/tools/keyword-density-checker/";
    utmSource.value = "newsletter";
    utmMedium.value = "email";
    utmCampaign.value = "weekly-seo-tools";
    utmContent.value = "hero-button";
    utmTerm.value = "";
    updateCampaignUrl();
    campaignBaseUrl.focus();
  }

  [campaignBaseUrl, utmSource, utmMedium, utmCampaign, utmContent, utmTerm].forEach(field => {
    field.addEventListener("input", updateCampaignUrl);
  });

  campaignClearBtn.addEventListener("click", clearCampaignFields);
  campaignSampleBtn.addEventListener("click", loadCampaignExample);

  updateCampaignUrl();
}