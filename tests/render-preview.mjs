// Render a before/after preview of the fixture: LaTeX Workshop grammar alone
// (before) vs. + expl3 injection (after). Emits an SVG that magick converts to PNG.
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import onigModule from "vscode-oniguruma";
import vsctmModule from "vscode-textmate";
const oniguruma = onigModule.default ?? onigModule;
const vsctm = vsctmModule.default ?? vsctmModule;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LW = process.env.LW; // LaTeX Workshop extension dir
const ROOT = path.resolve(__dirname, "..");

// --- Dark+ token colors (subset, keyed by scope prefix, longest match wins) ---
const THEME = [
  ["comment", "#6A9955"],
  ["punctuation.definition.comment", "#6A9955"],
  ["support.function.expl3", "#DCDCAA"],
  ["entity.name.function.private.expl3", "#4EC9B0"],
  ["variable.other.expl3", "#9CDCFE"],
  ["constant.language.expl3", "#569CD6"],
  ["entity.name.tag.docstrip", "#CE9178"],
  ["keyword.other.docstrip", "#C586C0"],
  ["keyword.operator.docstrip", "#C586C0"],
  ["entity.name.tag", "#569CD6"],
  ["keyword.control", "#C586C0"],
  ["support.function", "#DCDCAA"],
  ["storage.type", "#569CD6"],
  ["entity.name", "#DCDCAA"],
  ["variable", "#9CDCFE"],
  ["string", "#CE9178"],
  ["constant", "#569CD6"],
  ["keyword", "#C586C0"],
  ["meta.math", "#B5CEA8"],
];
const DEFAULT_FG = "#D4D4D4";
function colorFor(scopes) {
  // scopes: array of scope strings, innermost last. Pick most specific theme match.
  let best = DEFAULT_FG, bestLen = -1;
  for (const s of scopes) {
    for (const [prefix, col] of THEME) {
      if (s.startsWith(prefix) && prefix.length > bestLen) { best = col; bestLen = prefix.length; }
    }
  }
  return best;
}

const wasmBin = fs.readFileSync(path.join(ROOT, "node_modules/vscode-oniguruma/release/onig.wasm"));
await oniguruma.loadWASM(wasmBin);

const grammarPaths = {
  "text.tex.doctex": path.join(LW, "syntax/DocTeX.tmLanguage.json"),
  "text.tex.latex": path.join(LW, "syntax/LaTeX.tmLanguage.json"),
  "text.tex": path.join(LW, "syntax/TeX.tmLanguage.json"),
  "expl3.injection": path.join(ROOT, "syntaxes/expl3.tmLanguage.json"),
};

function makeRegistry(withInjection) {
  return new vsctm.Registry({
    onigLib: Promise.resolve({
      createOnigScanner: (s) => new oniguruma.OnigScanner(s),
      createOnigString: (s) => new oniguruma.OnigString(s),
    }),
    loadGrammar: async (scopeName) => {
      const p = grammarPaths[scopeName];
      if (!p) return null;
      return vsctm.parseRawGrammar(fs.readFileSync(p, "utf8"), p);
    },
    getInjections: (scopeName) => {
      if (withInjection && (scopeName === "text.tex.doctex")) return ["expl3.injection"];
      return undefined;
    },
  });
}

const source = fs.readFileSync(path.join(ROOT, "tests/fixtures/preview-snippet.dtx"), "utf8");
const lines = source.replace(/\n$/, "").split("\n");

async function tokenizeAll(withInjection) {
  const registry = makeRegistry(withInjection);
  const grammar = await registry.loadGrammar("text.tex.doctex");
  let rules = vsctm.INITIAL;
  const out = [];
  for (const line of lines) {
    const r = grammar.tokenizeLine(line, rules);
    out.push(r.tokens.map((t) => ({
      text: line.substring(t.startIndex, t.endIndex),
      color: colorFor(t.scopes),
    })));
    rules = r.ruleStack;
  }
  return out;
}

function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function panel(tokenLines, xOffset, title) {
  const CW = 8.4, LH = 20, PADX = 16, PADY = 44;
  let svg = "";
  svg += `<text x="${xOffset + PADX}" y="26" font-family="DejaVu Sans Mono, monospace" font-size="15" font-weight="bold" fill="#D4D4D4">${esc(title)}</text>`;
  tokenLines.forEach((toks, i) => {
    let x = xOffset + PADX;
    const y = PADY + i * LH + 14;
    for (const t of toks) {
      if (t.text.length === 0) continue;
      const w = t.text.length * CW;
      if (t.text.trim().length > 0) {
        svg += `<text x="${x.toFixed(1)}" y="${y}" font-family="DejaVu Sans Mono, monospace" font-size="13" fill="${t.color}" xml:space="preserve">${esc(t.text)}</text>`;
      }
      x += w;
    }
  });
  return svg;
}

const before = await tokenizeAll(false);
const after = await tokenizeAll(true);

const CW = 8.4, LH = 20, PADX = 16;
const maxCols = Math.max(...lines.map((l) => l.length));
const panelW = PADX * 2 + maxCols * CW;
const H = 44 + lines.length * LH + 16;
const W = panelW * 2 + 2;

const svg =
`<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H}" viewBox="0 0 ${W.toFixed(0)} ${H}">
<rect width="${W.toFixed(0)}" height="${H}" fill="#1E1E1E"/>
<rect x="${panelW.toFixed(0)}" y="0" width="2" height="${H}" fill="#3C3C3C"/>
${panel(before, 0, "before — LaTeX Workshop only")}
${panel(after, panelW, "after — + expl3-vscode")}
</svg>`;

fs.writeFileSync(path.join(ROOT, "images/before-after.svg"), svg);
console.log("wrote images/before-after.svg", W.toFixed(0) + "x" + H);
