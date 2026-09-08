const campaignBaseUrl = document.getElementById("campaignBaseUrl");
const utmSource = document.getElementById("utmSource");
const utmMedium = document.getElementById("utmMedium");
const utmCampaign = document.getElementById("utmCampaign");
const utmContent = document.getElementById("utmContent");
const utmTerm = document.getElementById("utmTerm");
const campaignClearBtn = document.getElementById("campaignClearBtn");
const campaignSampleBtn = document.getElementById("campaignSampleBtn");
const campaignForm = document.getElementById("campaignForm");
const campaignGenerateBtn = document.getElementById("campaignGenerateBtn");
const campaignCopyBtn = document.getElementById("campaignCopyBtn");
const campaignOptionalFields = document.getElementById("campaignOptionalFields");
const campaignResultPanel = document.getElementById("campaignResultPanel");
const campaignStatusMessage = document.getElementById("campaignStatusMessage");
const campaignUrlStatus = document.getElementById("campaignUrlStatus");
const campaignRequiredStatus = document.getElementById("campaignRequiredStatus");
const campaignLength = document.getElementById("campaignLength");
const campaignParamCount = document.getElementById("campaignParamCount");
const campaignOutput = document.getElementById("campaignOutput");
const campaignTips = document.getElementById("campaignTips");
const campaignBaseUrlError = document.getElementById("campaignBaseUrlError");
const utmSourceError = document.getElementById("utmSourceError");
const utmMediumError = document.getElementById("utmMediumError");
const utmCampaignError = document.getElementById("utmCampaignError");

if (campaignBaseUrl) {
  let validationRequested = false;

  function cleanValue(value) {
    return value.trim().toLowerCase().replace(/\s+/g, "-");
  }

  function setFieldValidity(field, error, invalid) {
    field.setAttribute?.("aria-invalid", invalid ? "true" : "false");
    if (error) error.hidden = !invalid;
  }

  function setResultState(state) {
    if (!campaignResultPanel) return;
    campaignResultPanel.dataset = campaignResultPanel.dataset || {};
    campaignResultPanel.dataset.state = state;
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

    let destination = null;
    let replacedUtm = false;
    const preservedQuery = [];

    try {
      // Reject URL-parser repairs that could disguise a mistyped destination.
      if (!/^https?:\/\//i.test(baseUrl) || /[\s\\\u0000-\u001f\u007f]/.test(baseUrl) || /%(?![\da-f]{2})/i.test(baseUrl)) {
        throw new Error("Invalid web URL");
      }
      const parsed = new URL(baseUrl);
      if (!parsed.hostname || parsed.username || parsed.password || !/^https?:\/\/[^/?#]/i.test(baseUrl)) {
        throw new Error("Invalid web destination");
      }
      // Keep non-UTM query segments verbatim; the form replaces all UTM keys.
      if (parsed.search) {
        parsed.search.slice(1).split("&").forEach(segment => {
          const key = new URLSearchParams(segment).keys().next().value;
          if (key && key.toLowerCase().startsWith("utm_")) {
            replacedUtm = true;
          } else {
            preservedQuery.push(segment);
          }
        });
      }
      destination = parsed;
    } catch {
      destination = null;
    }

    const requiredReady = Boolean(destination && source && medium && campaign);
    const paramCount =
      (source ? 1 : 0) +
      (medium ? 1 : 0) +
      (campaign ? 1 : 0) +
      (content ? 1 : 0) +
      (term ? 1 : 0);

    campaignUrlStatus.textContent = !baseUrl ? "Missing" : destination ? "Added" : "Invalid";
    campaignRequiredStatus.textContent = requiredReady ? "Ready" : "Incomplete";
    campaignParamCount.textContent = paramCount;

    let finalUrl = "";

    if (requiredReady) {
      destination.search = preservedQuery.concat(params.toString()).join("&");
      finalUrl = destination.href;
    }

    campaignOutput.value = finalUrl;
    campaignLength.textContent = finalUrl.length;

    const destinationInvalid = Boolean(baseUrl && !destination) || (validationRequested && !destination);
    setFieldValidity(campaignBaseUrl, campaignBaseUrlError, destinationInvalid);
    setFieldValidity(utmSource, utmSourceError, validationRequested && !source);
    setFieldValidity(utmMedium, utmMediumError, validationRequested && !medium);
    setFieldValidity(utmCampaign, utmCampaignError, validationRequested && !campaign);

    if (campaignCopyBtn) {
      campaignCopyBtn.disabled = !finalUrl;
      campaignCopyBtn.textContent = "Copy URL";
    }

    if (!baseUrl && !source && !medium && !campaign) {
      setResultState("waiting");
      if (campaignStatusMessage) campaignStatusMessage.textContent = "Add the destination and required campaign fields to generate a URL.";
    } else if (baseUrl && !destination) {
      setResultState("invalid");
      if (campaignStatusMessage) campaignStatusMessage.textContent = "The destination URL is invalid. Fix it before generating or copying a campaign URL.";
    } else if (requiredReady) {
      setResultState("ready");
      if (campaignStatusMessage) campaignStatusMessage.textContent = "Your campaign URL is ready. Review it, then copy it for your campaign.";
    } else {
      setResultState("waiting");
      if (campaignStatusMessage) campaignStatusMessage.textContent = "Complete Source, Medium, and Campaign to generate the URL.";
    }

    const tips = [];

    if (!baseUrl) {
      tips.push("Add the website URL first. This is the page you want people to visit.");
    } else if (!destination) {
      tips.push("Enter a complete http:// or https:// destination URL without spaces, credentials, or malformed encoding.");
    }

    if (replacedUtm && destination) {
      tips.push("Existing UTM parameters are replaced by the values in this form; non-UTM parameters and fragments are preserved.");
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

    if (requiredReady) {
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
    return requiredReady;
  }

  function clearCampaignFields() {
    campaignBaseUrl.value = "";
    utmSource.value = "";
    utmMedium.value = "";
    utmCampaign.value = "";
    utmContent.value = "";
    utmTerm.value = "";
    validationRequested = false;
    if (campaignOptionalFields) campaignOptionalFields.open = false;
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
    validationRequested = false;
    if (campaignOptionalFields) campaignOptionalFields.open = true;
    updateCampaignUrl();
    campaignBaseUrl.focus();
  }

  function generateCampaignUrl(event) {
    event?.preventDefault();
    validationRequested = true;
    const ready = updateCampaignUrl();

    if (ready) {
      if (campaignStatusMessage) campaignStatusMessage.textContent = "Campaign URL generated and ready to copy.";
      const outputRect = campaignOutput.getBoundingClientRect?.();
      if (outputRect && (outputRect.top < 92 || outputRect.bottom > window.innerHeight)) {
        campaignResultPanel?.scrollIntoView({ block: "start" });
        campaignOutput.focus({ preventScroll: true });
      } else {
        campaignOutput.focus();
      }
      return;
    }

    const firstInvalidField = [campaignBaseUrl, utmSource, utmMedium, utmCampaign].find(field => {
      if (field === campaignBaseUrl) return campaignUrlStatus.textContent !== "Added";
      return !cleanValue(field.value);
    });
    firstInvalidField?.focus();
  }

  async function copyCampaignUrl() {
    const value = campaignOutput.value;
    if (!value) return;

    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      setResultState("copied");
      campaignCopyBtn.textContent = "Copied";
      if (campaignStatusMessage) campaignStatusMessage.textContent = "Campaign URL copied to your clipboard.";
    } catch {
      setResultState("error");
      campaignCopyBtn.textContent = "Copy failed";
      if (campaignStatusMessage) campaignStatusMessage.textContent = "Copy failed. Select the generated URL and copy it manually.";
      campaignOutput.focus();
      campaignOutput.select?.();
    }
  }

  [campaignBaseUrl, utmSource, utmMedium, utmCampaign, utmContent, utmTerm].forEach(field => {
    field.addEventListener("input", updateCampaignUrl);
  });

  campaignClearBtn.addEventListener("click", clearCampaignFields);
  campaignSampleBtn.addEventListener("click", loadCampaignExample);
  campaignForm?.addEventListener("submit", generateCampaignUrl);
  campaignGenerateBtn?.addEventListener("click", event => {
    if (!campaignForm?.requestSubmit) generateCampaignUrl(event);
  });
  campaignCopyBtn?.addEventListener("click", copyCampaignUrl);

  updateCampaignUrl();
}
