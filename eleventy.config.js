const cheerio = require("cheerio");

function slugifyHeading(value) {
  return value
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function prepareArticle(content) {
  const $ = cheerio.load(content || "", null, false);
  const usedIds = new Map();
  const outline = [];

  $("h2, h3").each((_, heading) => {
    const text = $(heading).text().trim();
    const baseId = slugifyHeading(text);
    const count = usedIds.get(baseId) || 0;
    const id = count ? `${baseId}-${count + 1}` : baseId;

    usedIds.set(baseId, count + 1);
    $(heading).attr("id", id);
    outline.push({ id, text, level: heading.tagName.toLowerCase() });
  });

  return { html: $.html(), outline };
}

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");

  eleventyConfig.addFilter("displayDate", value => {
    if (!value) return "";

    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00Z`
      : value;
    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC"
    }).format(date);
  });

  eleventyConfig.addFilter("articleBody", value => prepareArticle(value).html);
  eleventyConfig.addFilter("articleOutline", value => prepareArticle(value).outline);
  eleventyConfig.addFilter("readingTime", value => {
    const $ = cheerio.load(value || "", null, false);
    const words = $.text().trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 220));
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      layouts: "_includes/layouts",
      data: "_data",
      output: "_site"
    }
  };
};
