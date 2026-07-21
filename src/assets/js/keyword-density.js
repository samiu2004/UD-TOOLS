const textInput = document.getElementById("densityText");
const clearBtn = document.getElementById("densityClearBtn");
const sampleBtn = document.getElementById("densitySampleBtn");
const copyBtn = document.getElementById("densityCopyBtn");
const charCountEl = document.getElementById("densityCharCount");
const wordCountEl = document.getElementById("densityWordCount");
const uniqueCountEl = document.getElementById("densityUniqueCount");
const topKeywordEl = document.getElementById("densityTopKeyword");
const topPercentEl = document.getElementById("densityTopPercent");
const signalEl = document.getElementById("densitySignal");
const signalMeterEl = document.getElementById("densitySignalMeter");
const resultsEl = document.getElementById("densityResults");

if (textInput) {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "if", "then", "else", "for", "on", "in", "at", "to", "from", "by", "with",
    "of", "is", "are", "was", "were", "be", "been", "being", "it", "its", "this", "that", "these", "those", "as",
    "i", "you", "he", "she", "we", "they", "them", "their", "our", "your", "my", "me", "his", "her", "not", "do",
    "does", "did", "so", "than", "too", "very", "can", "could", "should", "would", "will", "just", "about", "into",
    "over", "under", "again", "more", "most", "such", "no", "nor", "only", "own", "same", "other", "some", "any"
  ]);

  function getSignal(percent) {
    if (percent >= 7) return "Potential overuse";
    if (percent >= 4) return "Getting high";
    if (percent >= 1.5) return "Healthy range";
    return "Normal";
  }

  function getBarClass(percent) {
    if (percent >= 7) return "is-over";
    if (percent >= 4) return "is-high";
    if (percent >= 1.5) return "is-healthy";
    return "";
  }

  function getKeywordRows(sorted, totalWords) {
    return sorted.slice(0, 10).map(([word, count]) => {
      const percent = totalWords ? (count / totalWords) * 100 : 0;
      const width = Math.min(100, Math.max(6, percent * 11));
      const signal = getSignal(percent);
      const barClass = getBarClass(percent);

      return `
        <tr>
          <td>${word}</td>
          <td>${count}</td>
          <td>
            <div class="keyword-density-cell">
              <span>${percent.toFixed(2)}%</span>
              <span class="keyword-density-bar"><span class="${barClass}" style="width:${width}%"></span></span>
            </div>
          </td>
          <td>${signal}</td>
        </tr>
      `;
    }).join("");
  }

  function analyzeText() {
    const rawText = textInput.value.trim().toLowerCase();
    const words = rawText.match(/\b[a-z0-9]+\b/g) || [];
    const filteredWords = words.filter(word => word.length > 2 && !stopWords.has(word));

    const counts = {};
    filteredWords.forEach(word => {
      counts[word] = (counts[word] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const totalWords = words.length;
    const uniqueWords = Object.keys(counts).length;

    charCountEl.textContent = textInput.value.length;
    wordCountEl.textContent = totalWords;
    uniqueCountEl.textContent = uniqueWords;

    if (sorted.length === 0 || totalWords === 0) {
      topKeywordEl.textContent = "-";
      topPercentEl.textContent = "0%";
      signalEl.textContent = "Normal";
      signalMeterEl.style.width = "8%";
      resultsEl.innerHTML = '<tr><td colspan="4">Keyword results will appear here after you enter text.</td></tr>';
      return;
    }

    const [topWord, topCount] = sorted[0];
    const topPercent = (topCount / totalWords) * 100;

    topKeywordEl.textContent = topWord;
    topPercentEl.textContent = `${topPercent.toFixed(2)}%`;
    signalEl.textContent = getSignal(topPercent);
    signalMeterEl.style.width = `${Math.min(100, Math.max(8, topPercent * 10))}%`;
    resultsEl.innerHTML = getKeywordRows(sorted, totalWords);
  }

  function copyReport() {
    const rows = Array.from(resultsEl.querySelectorAll("tr"))
      .map(row => Array.from(row.children).map(cell => cell.textContent.trim().replace(/\s+/g, " ")).join(" | "))
      .join("\n");

    const report = [
      "Keyword Density Report",
      `Words: ${wordCountEl.textContent}`,
      `Unique terms: ${uniqueCountEl.textContent}`,
      `Top keyword: ${topKeywordEl.textContent}`,
      `Density: ${topPercentEl.textContent}`,
      `SEO signal: ${signalEl.textContent}`,
      "",
      rows
    ].join("\n");

    if (navigator.clipboard) {
      navigator.clipboard.writeText(report);
    }

    copyBtn.textContent = "Copied";
    window.setTimeout(() => {
      copyBtn.textContent = "Copy Report";
    }, 1200);
  }

  clearBtn.addEventListener("click", () => {
    textInput.value = "";
    analyzeText();
    textInput.focus();
  });

  sampleBtn.addEventListener("click", () => {
    textInput.value = "Keyword density tools are useful for checking repeated terms in SEO content. A keyword density checker should help writers find overused words, review keyword balance, and improve content without keyword stuffing.";
    analyzeText();
    textInput.focus();
  });

  copyBtn.addEventListener("click", copyReport);
  textInput.addEventListener("input", analyzeText);
  analyzeText();
}
