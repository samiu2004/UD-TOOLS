(function () {
  "use strict";

  var root = document.querySelector("[data-utm-checker]");
  if (!root) return;

  var requiredKeys = ["utm_source", "utm_medium", "utm_campaign"];
  var knownKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"];
  var labels = {
    utm_source: "Campaign source",
    utm_medium: "Campaign medium",
    utm_campaign: "Campaign name",
    utm_content: "Campaign content",
    utm_term: "Campaign term",
    utm_id: "Campaign ID"
  };

  var singleInput = document.getElementById("utmCheckUrl");
  var singleStatus = document.getElementById("utmCheckStatus");
  var singleRequired = document.getElementById("utmCheckRequired");
  var singleIssues = document.getElementById("utmCheckIssues");
  var singleWarnings = document.getElementById("utmCheckWarnings");
  var singleNotice = document.getElementById("utmCheckNotice");
  var singleResults = document.getElementById("utmCheckResults");
  var singleOutput = document.getElementById("utmCheckOutput");
  var copyReportButton = document.getElementById("utmCopyReportBtn");
  var copyUrlButton = document.getElementById("utmCopyUrlBtn");
  var batchInput = document.getElementById("utmBatchUrls");
  var batchResults = document.getElementById("utmBatchResults");
  var batchCsvButton = document.getElementById("utmBatchCsvBtn");
  var lastSingleResult = null;
  var lastBatchResults = [];

  function normalizeValue(value) {
    return value.trim().toLowerCase().replace(/\s+/g, "_");
  }

  function analyzeUrl(rawValue) {
    var raw = rawValue.trim();
    var result = {
      raw: raw,
      parsed: null,
      rows: [],
      errors: [],
      warnings: [],
      requiredCount: 0,
      normalizedUrl: "",
      status: "Invalid"
    };

    if (!raw) {
      result.errors.push("No URL was entered.");
      return result;
    }

    if (!/^https?:\/\//i.test(raw)) {
      result.errors.push("Use a complete URL beginning with http:// or https://.");
      return result;
    }

    try {
      result.parsed = new URL(raw);
    } catch (error) {
      result.errors.push("The URL could not be parsed. Check its spelling and special characters.");
      return result;
    }

    if (!/^https?:$/.test(result.parsed.protocol) || !result.parsed.hostname) {
      result.errors.push("The destination must use HTTP or HTTPS and include a hostname.");
      return result;
    }

    var occurrences = {};
    var originalKeys = {};
    result.parsed.searchParams.forEach(function (value, key) {
      var normalizedKey = key.toLowerCase();
      if (normalizedKey.indexOf("utm_") !== 0) return;
      if (!occurrences[normalizedKey]) occurrences[normalizedKey] = [];
      occurrences[normalizedKey].push(value);
      if (!originalKeys[normalizedKey]) originalKeys[normalizedKey] = [];
      originalKeys[normalizedKey].push(key);
    });

    if (result.parsed.hash && /utm_/i.test(result.parsed.hash)) {
      result.errors.push("UTM parameters appear after the # fragment and may not be read as query parameters.");
    }

    if ((raw.match(/\?/g) || []).length > 1) {
      result.warnings.push("The URL contains more than one question mark. Check the query-string structure.");
    }

    knownKeys.forEach(function (key) {
      var values = occurrences[key] || [];
      var isRequired = requiredKeys.indexOf(key) !== -1;
      var nonEmptyValues = values.filter(function (value) { return value.trim() !== ""; });
      var row = {
        key: key,
        label: labels[key],
        value: values.length ? values.join(" | ") : "-",
        tone: "optional",
        status: "Optional",
        recommendation: "Add only when it supports a reporting decision."
      };

      if (!values.length && isRequired) {
        row.tone = "error";
        row.status = "Missing";
        row.recommendation = "Add this required parameter before publishing the link.";
        result.errors.push(key + " is missing.");
      } else if (!values.length) {
        row.recommendation = "Not included, which is fine when this detail is not needed.";
      } else {
        if (isRequired && nonEmptyValues.length) result.requiredCount += 1;

        if (!nonEmptyValues.length) {
          row.tone = isRequired ? "error" : "warning";
          row.status = "Empty";
          row.recommendation = isRequired
            ? "Enter a meaningful value for this required parameter."
            : "Remove the empty optional parameter or give it a useful value.";
          if (isRequired) result.errors.push(key + " has an empty value.");
          else result.warnings.push(key + " has an empty value.");
        } else if (values.length > 1) {
          row.tone = "error";
          row.status = "Duplicate";
          row.recommendation = "Keep one value for this parameter.";
          result.errors.push(key + " appears more than once.");
        } else {
          var value = values[0];
          var keyUsesUppercase = originalKeys[key].some(function (item) { return item !== item.toLowerCase(); });
          var valueUsesUppercase = value !== value.toLowerCase();
          var valueUsesSpaces = /\s/.test(value);

          if (keyUsesUppercase || valueUsesUppercase || valueUsesSpaces) {
            row.tone = "warning";
            row.status = "Review";
            row.recommendation = "Use consistent lowercase naming and replace spaces with one separator style.";
            result.warnings.push(key + " uses capitalization or spaces that may split reports.");
          } else {
            row.tone = "good";
            row.status = "Ready";
            row.recommendation = "This parameter is present and consistently formatted.";
          }
        }
      }

      result.rows.push(row);
    });

    Object.keys(occurrences).forEach(function (key) {
      if (knownKeys.indexOf(key) !== -1) return;
      var values = occurrences[key];
      result.rows.push({
        key: key,
        label: "Custom UTM field",
        value: values.join(" | ") || "-",
        tone: values.length > 1 || values.every(function (value) { return !value.trim(); }) ? "warning" : "good",
        status: values.length > 1 ? "Duplicate" : "Detected",
        recommendation: "Confirm that your analytics workflow expects this custom parameter."
      });
      if (values.length > 1) result.warnings.push(key + " appears more than once.");
    });

    if (raw.length > 2000) {
      result.warnings.push("The URL is longer than 2,000 characters and may be difficult to use across platforms.");
    }

    result.normalizedUrl = buildNormalizedUrl(result.parsed, occurrences);
    result.status = result.errors.length ? "Needs review" : result.warnings.length ? "Review" : "Ready";
    return result;
  }

  function buildNormalizedUrl(parsed, occurrences) {
    var normalized = new URL(parsed.href);
    var preserved = [];
    normalized.searchParams.forEach(function (value, key) {
      if (key.toLowerCase().indexOf("utm_") !== 0) preserved.push([key, value]);
    });

    normalized.search = "";
    preserved.forEach(function (pair) {
      normalized.searchParams.append(pair[0], pair[1]);
    });

    Object.keys(occurrences).forEach(function (key) {
      var firstUseful = occurrences[key].find(function (value) { return value.trim() !== ""; });
      if (typeof firstUseful !== "undefined") normalized.searchParams.set(key.toLowerCase(), normalizeValue(firstUseful));
    });

    return normalized.href;
  }

  function createStatusBadge(text, tone) {
    var badge = document.createElement("span");
    badge.className = "utm-status-badge";
    badge.dataset.tone = tone;
    badge.textContent = text;
    return badge;
  }

  function renderSingle(result) {
    lastSingleResult = result;
    singleStatus.textContent = result.status;
    singleRequired.textContent = result.requiredCount + " / 3";
    singleIssues.textContent = result.errors.length;
    singleWarnings.textContent = result.warnings.length;
    singleOutput.value = result.normalizedUrl;
    copyReportButton.disabled = !result.parsed;
    copyUrlButton.disabled = !result.normalizedUrl;
    singleResults.textContent = "";

    if (!result.parsed) {
      var emptyRow = document.createElement("tr");
      var emptyCell = document.createElement("td");
      emptyCell.colSpan = 4;
      emptyCell.textContent = result.errors[0] || "The URL could not be checked.";
      emptyRow.appendChild(emptyCell);
      singleResults.appendChild(emptyRow);
      singleNotice.dataset.tone = "error";
      singleNotice.textContent = result.errors[0] || "Enter a valid campaign URL.";
      return;
    }

    result.rows.forEach(function (row) {
      var tr = document.createElement("tr");
      var parameterCell = document.createElement("td");
      var valueCell = document.createElement("td");
      var statusCell = document.createElement("td");
      var recommendationCell = document.createElement("td");
      var code = document.createElement("code");

      code.textContent = row.key;
      parameterCell.appendChild(code);
      valueCell.textContent = row.value;
      statusCell.appendChild(createStatusBadge(row.status, row.tone));
      recommendationCell.textContent = row.recommendation;
      tr.append(parameterCell, valueCell, statusCell, recommendationCell);
      singleResults.appendChild(tr);
    });

    if (result.errors.length) {
      singleNotice.dataset.tone = "error";
      singleNotice.textContent = result.errors[0] + (result.errors.length > 1 ? " " + (result.errors.length - 1) + " more issues need attention." : "");
    } else if (result.warnings.length) {
      singleNotice.dataset.tone = "warning";
      singleNotice.textContent = "The link has all required fields, but " + result.warnings.length + " formatting warning" + (result.warnings.length === 1 ? " needs" : "s need") + " review.";
    } else {
      singleNotice.dataset.tone = "good";
      singleNotice.textContent = "The link has a valid destination and all three required UTM parameters.";
    }
  }

  function buildReport(result) {
    var lines = [
      "UTM Link Checker report",
      "Status: " + result.status,
      "Required fields: " + result.requiredCount + "/3",
      "Issues: " + result.errors.length,
      "Warnings: " + result.warnings.length,
      ""
    ];

    result.rows.forEach(function (row) {
      lines.push(row.key + ": " + row.value + " - " + row.status + ". " + row.recommendation);
    });
    if (result.normalizedUrl) lines.push("", "Normalized URL: " + result.normalizedUrl);
    return lines.join("\n");
  }

  function copyText(text, button, successLabel) {
    if (!text) return;
    var showSuccess = function () {
      var original = button.textContent;
      button.textContent = successLabel;
      window.setTimeout(function () { button.textContent = original; }, 1400);
    };
    var fallbackCopy = function () {
      var helper = document.createElement("textarea");
      helper.value = text;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
      showSuccess();
    };

    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      fallbackCopy();
      return;
    }

    navigator.clipboard.writeText(text).then(showSuccess).catch(fallbackCopy);
  }

  function renderBatch(results) {
    lastBatchResults = results;
    var ready = results.filter(function (item) { return item.status === "Ready"; }).length;
    var invalid = results.filter(function (item) { return !item.parsed || item.errors.length; }).length;
    var review = results.length - ready - invalid;
    document.getElementById("utmBatchTotal").textContent = results.length;
    document.getElementById("utmBatchValid").textContent = ready;
    document.getElementById("utmBatchReview").textContent = review;
    document.getElementById("utmBatchInvalid").textContent = invalid;
    batchCsvButton.disabled = !results.length;
    batchResults.textContent = "";

    if (!results.length) {
      var emptyRow = document.createElement("tr");
      var emptyCell = document.createElement("td");
      emptyCell.colSpan = 5;
      emptyCell.textContent = "Add at least one URL to create a batch report.";
      emptyRow.appendChild(emptyCell);
      batchResults.appendChild(emptyRow);
      return;
    }

    results.forEach(function (result, index) {
      var tr = document.createElement("tr");
      var indexCell = document.createElement("td");
      var urlCell = document.createElement("td");
      var statusCell = document.createElement("td");
      var requiredCell = document.createElement("td");
      var issuesCell = document.createElement("td");
      indexCell.textContent = index + 1;
      urlCell.textContent = result.raw;
      urlCell.className = "utm-batch-url";
      urlCell.title = result.raw;
      statusCell.appendChild(createStatusBadge(result.status, !result.parsed || result.errors.length ? "error" : result.warnings.length ? "warning" : "good"));
      requiredCell.textContent = result.requiredCount + "/3";
      issuesCell.textContent = result.errors.length + result.warnings.length;
      tr.append(indexCell, urlCell, statusCell, requiredCell, issuesCell);
      batchResults.appendChild(tr);
    });
  }

  function csvEscape(value) {
    return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"';
  }

  function downloadBatchCsv() {
    if (!lastBatchResults.length) return;
    var rows = [["URL", "Status", "Required fields", "Issues", "Warnings", "Normalized URL"]];
    lastBatchResults.forEach(function (result) {
      rows.push([
        result.raw,
        result.status,
        result.requiredCount + "/3",
        result.errors.join(" "),
        result.warnings.join(" "),
        result.normalizedUrl
      ]);
    });
    var csv = rows.map(function (row) { return row.map(csvEscape).join(","); }).join("\r\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "utm-link-check-report.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  root.querySelectorAll("[data-utm-mode]").forEach(function (button) {
    button.addEventListener("click", function () {
      var mode = button.dataset.utmMode;
      root.querySelectorAll("[data-utm-mode]").forEach(function (item) {
        var active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", active ? "true" : "false");
      });
      root.querySelectorAll("[data-utm-pane]").forEach(function (pane) {
        pane.hidden = pane.dataset.utmPane !== mode;
      });
    });
  });

  document.getElementById("utmCheckBtn").addEventListener("click", function () {
    renderSingle(analyzeUrl(singleInput.value));
  });

  document.getElementById("utmCheckSampleBtn").addEventListener("click", function () {
    singleInput.value = "https://example.com/offer/?UTM_Source=Newsletter&utm_medium=email&utm_campaign=Summer Launch&utm_content=hero_button";
    renderSingle(analyzeUrl(singleInput.value));
  });

  document.getElementById("utmCheckClearBtn").addEventListener("click", function () {
    singleInput.value = "";
    lastSingleResult = null;
    singleStatus.textContent = "Not checked";
    singleRequired.textContent = "0 / 3";
    singleIssues.textContent = "0";
    singleWarnings.textContent = "0";
    singleOutput.value = "";
    copyReportButton.disabled = true;
    copyUrlButton.disabled = true;
    singleResults.innerHTML = '<tr><td colspan="4">No link checked yet.</td></tr>';
    singleNotice.dataset.tone = "neutral";
    singleNotice.textContent = "Paste a campaign URL and run the checker to see its UTM fields.";
  });

  copyReportButton.addEventListener("click", function () {
    if (lastSingleResult) copyText(buildReport(lastSingleResult), copyReportButton, "Copied");
  });

  copyUrlButton.addEventListener("click", function () {
    copyText(singleOutput.value, copyUrlButton, "Copied");
  });

  document.getElementById("utmBatchCheckBtn").addEventListener("click", function () {
    var urls = batchInput.value.split(/\r?\n/).map(function (value) { return value.trim(); }).filter(Boolean).slice(0, 100);
    renderBatch(urls.map(analyzeUrl));
  });

  document.getElementById("utmBatchSampleBtn").addEventListener("click", function () {
    batchInput.value = [
      "https://example.com/email/?utm_source=newsletter&utm_medium=email&utm_campaign=summer_launch",
      "https://example.com/social/?utm_source=linkedin&utm_medium=social&utm_campaign=summer_launch&utm_content=video",
      "https://example.com/offer/?utm_medium=email&utm_campaign=summer_launch"
    ].join("\n");
    renderBatch(batchInput.value.split("\n").map(analyzeUrl));
  });

  document.getElementById("utmBatchClearBtn").addEventListener("click", function () {
    batchInput.value = "";
    renderBatch([]);
  });

  batchCsvButton.addEventListener("click", downloadBatchCsv);
})();
