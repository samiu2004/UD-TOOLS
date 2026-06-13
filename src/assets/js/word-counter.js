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

  wordCount.textContent = wordTotal;
  charCount.textContent = characters;
  charNoSpaceCount.textContent = charactersNoSpaces;
  sentenceCount.textContent = sentences;
  paragraphCount.textContent = paragraphs;
  readingTime.textContent = readMinutes + " min";
  speakingTime.textContent = speakMinutes + " min";
  avgWordsPerSentence.textContent = avgSentence;
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