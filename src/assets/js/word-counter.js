const textInput = document.getElementById("textInput");
const clearBtn = document.getElementById("clearBtn");
const sampleBtn = document.getElementById("sampleBtn");

const wordCount = document.getElementById("wordCount");
const charCount = document.getElementById("charCount");
const charNoSpaceCount = document.getElementById("charNoSpaceCount");
const sentenceCount = document.getElementById("sentenceCount");
const paragraphCount = document.getElementById("paragraphCount");
const readingTime = document.getElementById("readingTime");
const speakingTime = document.getElementById("speakingTime");
const avgWordsPerSentence = document.getElementById("avgWordsPerSentence");
const wordInputCount = document.getElementById("wordInputCount");
const wordStatus = document.getElementById("wordStatus");
const wordCopyBtn = document.getElementById("wordCopyBtn");
const wordResultPanel = document.querySelector("[data-word-state]");

function updateCounts() {
  const text = textInput.value;
  const trimmed = text.trim();

  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
  const wordTotal = words.length;

  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;

  const sentences = trimmed
    ? trimmed.split(/[.!?]+/).map(item => item.trim()).filter(Boolean).length
    : 0;

  const paragraphs = trimmed
    ? trimmed.split(/\n\s*\n/).map(item => item.trim()).filter(Boolean).length
    : 0;

  const readMinutes = wordTotal > 0 ? Math.max(1, Math.ceil(wordTotal / 200)) : 0;
  const speakMinutes = wordTotal > 0 ? Math.max(1, Math.ceil(wordTotal / 130)) : 0;
  const avgSentence = sentences > 0 ? (wordTotal / sentences).toFixed(1) : 0;

  wordInputCount.textContent = characters;
  wordCount.textContent = wordTotal;
  charCount.textContent = characters;
  charNoSpaceCount.textContent = charactersNoSpaces;
  sentenceCount.textContent = sentences;
  paragraphCount.textContent = paragraphs;
  readingTime.textContent = readMinutes + " min";
  speakingTime.textContent = speakMinutes + " min";
  avgWordsPerSentence.textContent = avgSentence;

  const hasText = Boolean(trimmed);
  wordCopyBtn.disabled = !hasText;
  wordResultPanel.dataset.wordState = hasText ? "ready" : "waiting";
  wordStatus.textContent = hasText
    ? "Counts are ready to review and copy."
    : "Add text to begin counting.";
}

function buildReport() {
  return [
    `Words: ${wordCount.textContent}`,
    `Characters: ${charCount.textContent}`,
    `Characters without spaces: ${charNoSpaceCount.textContent}`,
    `Sentences: ${sentenceCount.textContent}`,
    `Paragraphs: ${paragraphCount.textContent}`,
    `Reading time: ${readingTime.textContent}`,
    `Speaking time: ${speakingTime.textContent}`,
    `Average words per sentence: ${avgWordsPerSentence.textContent}`
  ].join("\n");
}

async function copyReport() {
  if (wordCopyBtn.disabled) return;

  try {
    await navigator.clipboard.writeText(buildReport());
    wordCopyBtn.textContent = "Copied";
    wordStatus.textContent = "Count report copied to your clipboard.";
    window.setTimeout(() => {
      wordCopyBtn.textContent = "Copy report";
    }, 1600);
  } catch {
    wordCopyBtn.textContent = "Copy failed";
    wordStatus.textContent = "Copy failed. Select the results and try again.";
  }
}

if (textInput) {
  textInput.addEventListener("input", updateCounts);
}

if (clearBtn) {
  clearBtn.addEventListener("click", function () {
    textInput.value = "";
    updateCounts();
    textInput.focus();
  });
}

if (sampleBtn) {
  sampleBtn.addEventListener("click", function () {
    textInput.value = "UD Marketing Tools helps writers, marketers, and small businesses work faster with practical SEO and content tools. You can check word count, improve readability, analyze keyword use, and create cleaner campaign URLs. The goal is to make useful digital work easier without forcing users into complicated software.";
    updateCounts();
    textInput.focus();
  });
}

if (textInput) {
  updateCounts();
}

if (wordCopyBtn) {
  wordCopyBtn.addEventListener("click", copyReport);
}
