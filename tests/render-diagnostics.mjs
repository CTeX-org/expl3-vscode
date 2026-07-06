// Render a mock of the editor showing explcheck diagnostics as squiggles.
// Tokenizes the demo file through the real DocTeX + expl3 grammar, then draws
// colored underlines from real `explcheck --porcelain` output, plus a hover card.
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import onigModule from "vscode-oniguruma";
import vsctmModule from "vscode-textmate";
const oniguruma = onigModule.default ?? onigModule;
const vsctm = vsctmModule.default ?? vsctmModule;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LW = process.env.LW;
const ROOT = path.resolve(__dirname, "..");

const THEME = [
  ["comment", "#6A9955"],
  ["support.function.expl3", "#DCDCAA"],
  ["entity.name.function.private.expl3", "#4EC9B0"],
  ["variable.other.expl3", "#9CDCFE"],
  ["constant.language.expl3", "#569CD6"],
  ["keyword.control", "#C586C0"],
  ["support.function", "#DCDCAA"],
  ["storage.type", "#569CD6"],
  ["variable", "#9CDCFE"],
  ["keyword", "#C586C0"],
];
const DEFAULT_FG = "#D4D4D4";
function colorFor(scopes) {
  let best = DEFAULT_FG, bestLen = -1;
  for (const s of scopes) for (const [p, c] of THEME)
    if (s.startsWith(p) && p.length > bestLen) { best = c; bestLen = p.length; }
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
const registry = new vsctm.Registry({
  onigLib: Promise.resolve({
    createOnigScanner: (s) => new oniguruma.OnigScanner(s),
    createOnigString: (s) => new oniguruma.OnigString(s),
  }),
  loadGrammar: async (scope) => {
    const p = grammarPaths[scope];
    return p ? vsctm.parseRawGrammar(fs.readFileSync(p, "utf8"), p) : null;
  },
  getInjections: (scope) => (scope === "text.tex.doctex" ? ["expl3.injection"] : undefined),
});

const file = path.join(ROOT, "tests/fixtures/lint-demo.tex");
const source = fs.readFileSync(file, "utf8").replace(/\n$/, "");
const lines = source.split("\n");

const grammar = await registry.loadGrammar("text.tex.doctex");
let rules = vsctm.INITIAL;
const tokLines = lines.map((line) => {
  const r = grammar.tokenizeLine(line, rules);
  rules = r.ruleStack;
  return r.tokens.map((t) => ({
    text: line.substring(t.startIndex, t.endIndex),
    color: colorFor(t.scopes),
  }));
});

// Real diagnostics.
const out = execFileSync("explcheck",
  ["--porcelain", "--error-format", "%f:%l:%c:%e:%k: %t%n %M", file], { encoding: "utf8" });
const RE = /^(?<f>.+?):(?<l>\d+):(?<c>\d+):(?<el>\d+):(?<ec>\d+):\s+(?<t>[ewst])(?<n>\d+)\s+(?<msg>.*)$/;
const sevColor = { e: "#F14C4C", t: "#F14C4C", w: "#CCA700", s: "#3794FF" };
const diags = [];
for (const raw of out.split(/\r?\n/)) {
  const m = RE.exec(raw.trim()); if (!m) continue;
  diags.push({
    line: +m.groups.l - 1, col: +m.groups.c - 1, ecol: +m.groups.ec - 1,
    t: m.groups.t, code: m.groups.t + m.groups.n, msg: m.groups.msg,
  });
}

const CW = 8.4, LH = 22, PADX = 18, PADY = 40;
const maxCols = Math.max(...lines.map((l) => l.length), 52);
const W = PADX * 2 + maxCols * CW + 20;
const H = PADY + lines.length * LH + 120;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

let body = "";
// gutter + title
body += `<text x="${PADX}" y="26" font-family="DejaVu Sans Mono, monospace" font-size="13" font-weight="bold" fill="#D4D4D4">demo.tex — explcheck diagnostics</text>`;
tokLines.forEach((toks, i) => {
  let x = PADX;
  const y = PADY + i * LH + 14;
  for (const t of toks) {
    if (t.text.length && t.text.trim().length)
      body += `<text x="${x.toFixed(1)}" y="${y}" font-family="DejaVu Sans Mono, monospace" font-size="13" fill="${t.color}" xml:space="preserve">${esc(t.text)}</text>`;
    x += t.text.length * CW;
  }
});
// squiggles (wavy underline) under each diagnostic range
function squiggle(x1, x2, y, color) {
  let d = `M ${x1} ${y}`;
  for (let x = x1; x < x2; x += 4) d += ` q 2 3 4 0`;
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.2"/>`;
}
for (const dg of diags) {
  const y = PADY + dg.line * LH + 18;
  const x1 = PADX + dg.col * CW;
  const x2 = PADX + Math.max(dg.ecol, dg.col + 3) * CW;
  body += squiggle(x1, x2, y, sevColor[dg.t] || "#CCA700");
}
// hover card for the first warning (w415 unused variable) as an illustration
const hv = diags.find((d) => d.code.startsWith("w4")) || diags[0];
if (hv) {
  const cardY = PADY + lines.length * LH + 12;
  const cardX = PADX;
  const cardW = W - PADX * 2;
  body += `<rect x="${cardX}" y="${cardY}" width="${cardW}" height="86" rx="6" fill="#252526" stroke="#454545"/>`;
  body += `<text x="${cardX + 14}" y="${cardY + 26}" font-family="DejaVu Sans Mono, monospace" font-size="12.5" fill="#D4D4D4">${esc(hv.msg)}</text>`;
  body += `<text x="${cardX + 14}" y="${cardY + 50}" font-family="DejaVu Sans Mono, monospace" font-size="12" fill="#9CDCFE">explcheck(<tspan fill="#4FC1FF" text-decoration="underline">${hv.code}</tspan>)</text>`;
  body += `<text x="${cardX + 14}" y="${cardY + 72}" font-family="DejaVu Sans, sans-serif" font-size="11" fill="#808080">click the code to open the rule documentation</text>`;
}

const svg =
`<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H}" viewBox="0 0 ${W.toFixed(0)} ${H}">
<rect width="${W.toFixed(0)}" height="${H}" fill="#1E1E1E"/>
${body}
</svg>`;
fs.writeFileSync(path.join(ROOT, "images/diagnostics.svg"), svg);
console.log("wrote images/diagnostics.svg", W.toFixed(0) + "x" + H, "|", diags.length, "diagnostics");
