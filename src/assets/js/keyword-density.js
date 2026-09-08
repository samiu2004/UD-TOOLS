(function () {
  "use strict";

  var textInput = document.getElementById("densityText");
  if (!textInput) return;

  var clearBtn = document.getElementById("densityClearBtn");
  var sampleBtn = document.getElementById("densitySampleBtn");
  var copyBtn = document.getElementById("densityCopyBtn");
  var charCountEl = document.getElementById("densityCharCount");
  var wordCountEl = document.getElementById("densityWordCount");
  var uniqueCountEl = document.getElementById("densityUniqueCount");
  var topKeywordEl = document.getElementById("densityTopKeyword");
  var topPercentEl = document.getElementById("densityTopPercent");
  var resultsEl = document.getElementById("densityResults");
  var statusEl = document.getElementById("densityStatus");
  var lastAnalysis = null;

  var stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "if", "then", "else", "for", "on", "in", "at", "to", "from", "by", "with",
    "of", "is", "are", "was", "were", "be", "been", "being", "it", "its", "this", "that", "these", "those", "as",
    "i", "you", "he", "she", "we", "they", "them", "their", "our", "your", "my", "me", "his", "her", "not", "do",
    "does", "did", "so", "than", "too", "very", "can", "could", "should", "would", "will", "just", "about", "into",
    "over", "under", "again", "more", "most", "such", "no", "nor", "only", "own", "same", "other", "some", "any"
  ]);

  function tokenize(value) {
    return value.toLocaleLowerCase().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || [];
  }

  function analyze(value) {
    var words = tokenize(value);
    var usefulWords = words.filter(function (word) { return !stopWords.has(word); });
    var counts = {};
    usefulWords.forEach(function (word) { counts[word] = (counts[word] || 0) + 1; });
    var sorted = Object.entries(counts).sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); });
    return { words: words, sorted: sorted, totalWords: words.length, distinctTerms: sorted.length };
  }

  function getKeywordRows(sorted, totalWords) {
    return sorted.slice(0, 10).map(function (entry) {
      var word = entry[0];
      var count = entry[1];
      var percent = totalWords ? (count / totalWords) * 100 : 0;
      var width = Math.min(100, Math.max(4, percent));
      return '<tr><td>' + word + '</td><td>' + count + '</td><td><div class="keyword-density-cell"><span>' +
        percent.toFixed(2) + '%</span><span class="keyword-density-bar" aria-hidden="true"><span style="width:' +
        width + '%"></span></span></div></td></tr>';
    }).join("");
  }

  function renderAnalysis() {
    lastAnalysis = analyze(textInput.value);
    var sorted = lastAnalysis.sorted;
    var totalWords = lastAnalysis.totalWords;
    charCountEl.textContent = textInput.value.length;
    wordCountEl.textContent = totalWords;
    uniqueCountEl.textContent = lastAnalysis.distinctTerms;

    if (!totalWords || !sorted.length) {
      topKeywordEl.textContent = "-";
      topPercentEl.textContent = "0%";
      resultsEl.innerHTML = '<tr><td colspan="3">Results will appear after you add content.</td></tr>';
      statusEl.textContent = totalWords ? "No terms remain after common words are excluded." : "Add content to start the analysis.";
      copyBtn.disabled = true;
      return;
    }

    var topWord = sorted[0][0];
    var topCount = sorted[0][1];
    var topPercent = (topCount / totalWords) * 100;
    topKeywordEl.textContent = topWord;
    topPercentEl.textContent = topPercent.toFixed(2) + "%";
    resultsEl.innerHTML = getKeywordRows(sorted, totalWords);
    statusEl.textContent = "Analyzed " + totalWords + " words and found " + lastAnalysis.distinctTerms + " distinct terms after exclusions.";
    copyBtn.disabled = false;
  }

  function buildReport() {
    var rows = Array.from(resultsEl.querySelectorAll("tr")).map(function (row) {
      return Array.from(row.children).map(function (cell) {
        return cell.textContent.trim().replace(/\s+/g, " ");
      }).join(" | ");
    }).join("\n");
    return [
      "Keyword Density Report",
      "Total words: " + wordCountEl.textContent,
      "Distinct terms: " + uniqueCountEl.textContent,
      "Top term: " + topKeywordEl.textContent,
      "Top density: " + topPercentEl.textContent,
      "Method: individual words, case-insensitive, common English function words excluded",
      "",
      rows
    ].join("\n");
  }

  function showCopyFeedback(label) {
    copyBtn.textContent = label;
    window.setTimeout(function () { copyBtn.textContent = "Copy report"; }, 1400);
  }

  function fallbackCopy(report) {
    try {
      var helper = document.createElement("textarea");
      helper.value = report;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      var copied = document.execCommand("copy");
      helper.remove();
      showCopyFeedback(copied ? "Copied" : "Copy failed");
      statusEl.textContent = copied ? "Report copied to clipboard." : "The report could not be copied. Try again.";
    } catch (error) {
      showCopyFeedback("Copy failed");
      statusEl.textContent = "The report could not be copied. Try again.";
    }
  }

  function copyReport() {
    if (!lastAnalysis || !lastAnalysis.sorted.length) return;
    var report = buildReport();
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      fallbackCopy(report);
      return;
    }
    navigator.clipboard.writeText(report).then(function () {
      showCopyFeedback("Copied");
      statusEl.textContent = "Report copied to clipboard.";
    }).catch(function () { fallbackCopy(report); });
  }

  clearBtn.addEventListener("click", function () {
    textInput.value = "";
    renderAnalysis();
    textInput.focus();
  });

  sampleBtn.addEventListener("click", function () {
    textInput.value = "AI marketing tools help teams review campaigns. An AI keyword density checker shows repeated words, while clear campaign notes help teams use the results naturally.";
    renderAnalysis();
    textInput.focus();
  });

  copyBtn.addEventListener("click", copyReport);
  textInput.addEventListener("input", renderAnalysis);
  renderAnalysis();
})();
