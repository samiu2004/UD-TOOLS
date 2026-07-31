const fs = require("node:fs");
const path = require("node:path");
const CleanCSS = require("clean-css");

const cssPath = path.join(__dirname, "..", "_site", "assets", "css", "style.css");

if (!fs.existsSync(cssPath)) {
  throw new Error(`Built stylesheet not found: ${cssPath}`);
}

const source = fs.readFileSync(cssPath, "utf8");
const result = new CleanCSS({ level: 1, rebase: false }).minify(source);

if (result.errors.length) {
  throw new Error(`CSS minification failed: ${result.errors.join("; ")}`);
}

fs.writeFileSync(cssPath, result.styles, "utf8");
console.log(`Minified CSS: ${source.length} -> ${result.styles.length} bytes`);
