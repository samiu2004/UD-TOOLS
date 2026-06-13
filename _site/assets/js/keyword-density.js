const textInput = document.getElementById("densityText");
const clearBtn = document.getElementById("densityClearBtn");
const sampleBtn = document.getElementById("densitySampleBtn");
const wordCountEl = document.getElementById("densityWordCount");
const uniqueCountEl = document.getElementById("densityUniqueCount");
const topKeywordEl = document.getElementById("densityTopKeyword");
const topPercentEl = document.getElementById("densityTopPercent");
const resultsEl = document.getElementById("densityResults");

if (textInput) {
  const stopWords = new Set([
    "the","a","an","and","or","but","if","then","else","for","on","in","at","to","from","by","with",
    "of","is","are","was","were","be","been","being","it","its","this","that","these","those","as",
    "i","you","he","she","we","they","them","their","our","your","my","me","his","her","not","do",
    "does","did","so","than","too","very","can","could","should","would","will","just","about","into",
    "over","under","again","more","most","such","no","nor","only","own","same","other","some","any"
  ]);

  function analyzeText() {
    const rawText = textInput.value.trim().toLowerCase();
    const words = rawText.match(/\b[a-z0-9]+\b/g) || [];
    const filteredWords = words.filter(word => word.length > 2 && !stopWords.has(word));

    const counts = {};
    filteredWords.forEach(word => {
      counts[word] = (counts[word] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const totalWords = words.length;
    const uniqueWords = Object.keys(counts).length;

    wordCountEl.textContent = totalWords;
    uniqueCountEl.textContent = uniqueWords;

    if (sorted.length === 0 || totalWords === 0) {
      topKeywordEl.textContent = "—";
      topPercentEl.textContent = "0%";
      resultsEl.innerHTML = '<p class="muted">Keyword results will appear here after you enter text.</p>';
      return;
    }

    const [topWord, topCount] = sorted[0];
    const topPercent = ((topCount / totalWords) * 100).toFixed(2);

    topKeywordEl.textContent = topWord;
    topPercentEl.textContent = `${topPercent}%`;

    const topRows = sorted.slice(0, 10).map(([word, count]) => {
      const percent = ((count / totalWords) * 100).toFixed(2);
      return `
        <div class="result-row" style="display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.08);">
          <span>${word}</span>
          <span>${count} uses (${percent}%)</span>
        </div>
      `;
    }).join("");

    resultsEl.innerHTML = topRows;
  }

  clearBtn.addEventListener("click", () => {
    textInput.value = "";
    analyzeText();
    textInput.focus();
  });

  sampleBtn.addEventListener("click", () => {
    textInput.value = `Keyword research helps marketers understand how often target phrases appear in a page. Good keyword research supports better content planning, stronger search visibility, and clearer optimization decisions. This keyword density checker helps you review keyword frequency, compare repeated terms, and improve keyword balance in SEO writing.`;
    analyzeText();
    textInput.focus();
  });

  textInput.addEventListener("input", analyzeText);
  analyzeText();
}