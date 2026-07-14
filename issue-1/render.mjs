// Render a before/after (pre-fix vs post-fix injection grammar) comparison of
// the issue #1 MWE under the real LaTeX Workshop text.tex.latex host (.sty).
// Usage: ELECTRON_RUN_AS_NODE=1 <electron> render-issue1.mjs
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import onigModule from "vscode-oniguruma";
import vsctmModule from "vscode-textmate";
const oniguruma = onigModule.default ?? onigModule;
const vsctm = vsctmModule.default ?? vsctmModule;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const LW = process.env.LW ?? "/Users/liam/.vscode/extensions/james-yu.latex-workshop-10.12.0";

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
];
const DEFAULT_FG = "#D4D4D4";
function colorFor(scopes) {
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

function makeRegistry(injectionGrammarPath) {
  const grammarPaths = {
    "text.tex.latex": path.join(LW, "syntax/LaTeX.tmLanguage.json"),
    "text.tex": path.join(LW, "syntax/TeX.tmLanguage.json"),
    "expl3.injection": injectionGrammarPath,
  };
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
    getInjections: (scopeName) =>
      scopeName === "text.tex.latex" ? ["expl3.injection"] : undefined,
  });
}

const source = fs.readFileSync(path.join(__dirname, "mwe.sty"), "utf8");
const lines = source.replace(/\n$/, "").split("\n");

async function tokenizeAll(injectionGrammarPath) {
  const registry = makeRegistry(injectionGrammarPath);
  const grammar = await registry.loadGrammar("text.tex.latex");
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
  svg += `<text x="${xOffset + PADX}" y="26" font-family="DejaVu Sans Mono, Menlo, monospace" font-size="15" font-weight="bold" fill="#D4D4D4">${esc(title)}</text>`;
  tokenLines.forEach((toks, i) => {
    let x = xOffset + PADX;
    const y = PADY + i * LH + 14;
    for (const t of toks) {
      if (t.text.length === 0) continue;
      const w = t.text.length * CW;
      if (t.text.trim().length > 0) {
        svg += `<text x="${x.toFixed(1)}" y="${y}" font-family="DejaVu Sans Mono, Menlo, monospace" font-size="13" fill="${t.color}" xml:space="preserve">${esc(t.text)}</text>`;
      }
      x += w;
    }
  });
  return svg;
}

const before = await tokenizeAll(path.join(__dirname, "expl3-before.tmLanguage.json"));
const after = await tokenizeAll(path.join(ROOT, "syntaxes/expl3.tmLanguage.json"));

const CW = 8.4, LH = 20, PADX = 16;
const maxCols = Math.max(...lines.map((l) => l.length));
const panelW = PADX * 2 + maxCols * CW;
const H = 44 + lines.length * LH + 16;
const W = panelW * 2 + 2;

const svg =
`<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H}" viewBox="0 0 ${W.toFixed(0)} ${H}">
<rect width="${W.toFixed(0)}" height="${H}" fill="#1E1E1E"/>
<rect x="${panelW.toFixed(0)}" y="0" width="2" height="${H}" fill="#3C3C3C"/>
${panel(before, 0, "before (v0.2.4) — commented expl3 still colored (bug)")}
${panel(after, panelW, "after (fix) — commented expl3 turns comment-gray")}
</svg>`;

fs.writeFileSync(path.join(__dirname, "issue-1-before-after.svg"), svg);
console.log("wrote issue-1-before-after.svg", W.toFixed(0) + "x" + H);
