const readabilityText = document.getElementById("readabilityText");
const readabilityClearBtn = document.getElementById("readabilityClearBtn");
const readabilitySampleBtn = document.getElementById("readabilitySampleBtn");
const readabilityWords = document.getElementById("readabilityWords");
const readabilitySentences = document.getElementById("readabilitySentences");
const readabilitySyllables = document.getElementById("readabilitySyllables");
const fleschScore = document.getElementById("fleschScore");
const gradeLevel = document.getElementById("gradeLevel");
const readingLevelLabel = document.getElementById("readingLevelLabel");
const readabilitySummary = document.getElementById("readabilitySummary");

if (readabilityText) {
  function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, "");
    if (!word) return 0;
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
    word = word.replace(/^y/, "");

    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  function getReadingLevelLabel(score) {
    if (score >= 90) return "Very easy";
    if (score >= 80) return "Easy";
    if (score >= 70) return "Fairly easy";
    if (score >= 60) return "Standard";
    if (score >= 50) return "Fairly difficult";
    if (score >= 30) return "Difficult";
    return "Very difficult";
  }

  function analyzeReadability() {
    const text = readabilityText.value.trim();
    const words = text.match(/\b[\w'-]+\b/g) || [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const sentenceCount = sentences.length || (text ? 1 : 0);
    const wordCount = words.length;

    let syllableCount = 0;
    words.forEach(word => {
      syllableCount += countSyllables(word);
    });

    readabilityWords.textContent = wordCount;
    readabilitySentences.textContent = sentenceCount;
    readabilitySyllables.textContent = syllableCount;

    if (wordCount === 0 || sentenceCount === 0) {
      fleschScore.textContent = "0";
      gradeLevel.textContent = "0";
      readingLevelLabel.textContent = "—";
      readabilitySummary.innerHTML = '<p class="muted">Readability guidance will appear here after you enter text.</p>';
      return;
    }

    const asl = wordCount / sentenceCount;
    const asw = syllableCount / wordCount;

    const flesch = 206.835 - (1.015 * asl) - (84.6 * asw);
    const fkGrade = (0.39 * asl) + (11.8 * asw) - 15.59;

    const roundedFlesch = flesch.toFixed(1);
    const roundedGrade = Math.max(0, fkGrade).toFixed(1);
    const level = getReadingLevelLabel(flesch);

    fleschScore.textContent = roundedFlesch;
    gradeLevel.textContent = roundedGrade;
    readingLevelLabel.textContent = level;

    let advice = "";

    if (flesch >= 70) {
      advice = "This text is fairly easy to read. It should work well for broad web audiences.";
    } else if (flesch >= 50) {
      advice = "This text is moderately difficult. You may want shorter sentences and simpler wording.";
    } else {
      advice = "This text is difficult to read. Try reducing sentence length and replacing complex words.";
    }

    readabilitySummary.innerHTML = `
      <p><strong>Reading level:</strong> ${level}</p>
      <p><strong>Average sentence length:</strong> ${asl.toFixed(1)} words</p>
      <p><strong>Average syllables per word:</strong> ${asw.toFixed(2)}</p>
      <p>${advice}</p>
    `;
  }

  readabilityClearBtn.addEventListener("click", () => {
    readabilityText.value = "";
    analyzeReadability();
    readabilityText.focus();
  });

  readabilitySampleBtn.addEventListener("click", () => {
    readabilityText.value = `Readability matters because clear writing helps more people understand your message. Shorter sentences, simpler words, and better structure usually improve comprehension. This checker helps you review your text and identify whether it feels accessible or too difficult for a wider audience.`;
    analyzeReadability();
    readabilityText.focus();
  });

  readabilityText.addEventListener("input", analyzeReadability);
  analyzeReadability();
}