// Grammar regression test — self-contained, no LaTeX Workshop needed.
//
// The extension's grammar is an *injection*, so it needs a host grammar that
// produces a `text.tex.*` scope. In CI we can't rely on LaTeX Workshop, so we
// mount a minimal stub host that just tokenizes each line as plain text under
// `text.tex.doctex`. That is enough to exercise our injection patterns: if a
// token gets one of our `*.expl3` scopes, the injection matched.
//
// Run: node tests/grammar.test.mjs   (exit 0 = pass, 1 = fail)

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import onigModule from "vscode-oniguruma";
import vsctmModule from "vscode-textmate";

const oniguruma = onigModule.default ?? onigModule;
const vsctm = vsctmModule.default ?? vsctmModule;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Minimal host grammar mimicking the LaTeX Workshop hosts: a `%` comment rule
// that scopes the whole comment line (like text.tex.latex), everything else as
// plain text. The comment rule matters: the injection selector carries
// `-comment`, so expl3 tokens inside a host comment must NOT be recolored
// (issue #1), while docstrip guards (`%<...>`) must still win at line start.
const HOST = {
  scopeName: "text.tex.doctex",
  patterns: [
    {
      // Same shape as LaTeX Workshop's #comment rule.
      begin: "(^[ \\t]+)?(?=%)",
      end: "(?!\\G)",
      patterns: [
        {
          begin: "%",
          beginCaptures: { 0: { name: "punctuation.definition.comment.tex" } },
          end: "$\\n?",
          name: "comment.line.percentage.tex",
        },
      ],
    },
    { match: ".*", name: "meta.line.tex" },
  ],
};

const wasm = fs.readFileSync(
  path.join(ROOT, "node_modules/vscode-oniguruma/release/onig.wasm"),
);
await oniguruma.loadWASM(wasm);

const registry = new vsctm.Registry({
  onigLib: Promise.resolve({
    createOnigScanner: (s) => new oniguruma.OnigScanner(s),
    createOnigString: (s) => new oniguruma.OnigString(s),
  }),
  loadGrammar: async (scope) => {
    if (scope === "text.tex.doctex") return HOST;
    if (scope === "expl3.injection") {
      const p = path.join(ROOT, "syntaxes/expl3.tmLanguage.json");
      return vsctm.parseRawGrammar(fs.readFileSync(p, "utf8"), p);
    }
    return null;
  },
  getInjections: (scope) =>
    scope === "text.tex.doctex" ? ["expl3.injection"] : undefined,
});

const grammar = await registry.loadGrammar("text.tex.doctex");

// Tokenize one line, return the set of scope names present.
function scopesOf(line) {
  const r = grammar.tokenizeLine(line, vsctm.INITIAL);
  const set = new Set();
  for (const t of r.tokens) for (const s of t.scopes) set.add(s);
  return set;
}

// A case: the line, and a scope substring that must appear somewhere on it.
const CASES = [
  // API families
  ["\\tl_new:N \\l_tmpa_tl", "support.function.expl3"],
  ["\\prop_gput:Nnn \\g_x_prop {a} {b}", "support.function.expl3"],
  ["\\cs_new_protected:Npn \\foo:n #1 { }", "support.function.expl3"],
  // variables
  ["\\l_tmpa_tl", "variable.other.expl3"],
  ["\\g_@@_state_bool", "variable.other.expl3"],
  // quarks / constants (note: \c_novalue_tl etc. are constants, not variables)
  ["\\q_stop", "constant.language.expl3"],
  ["\\c_true_bool", "constant.language.expl3"],
  ["\\c_novalue_tl", "constant.language.expl3"],
  // private @@
  ["\\@@_do_thing:Nn", "entity.name.function.private.expl3"],
  // docstrip guards — including the negated forms fixed in 0.2.2
  ["%<@@=xeCJK>", "entity.name.tag.docstrip.module.expl3"],
  ["%<*driver>", "entity.name.tag.docstrip.expl3"],
  ["%</driver>", "entity.name.tag.docstrip.expl3"],
  ["%<*fd|zhmap>", "entity.name.tag.docstrip.expl3"],
  ["%<*!driver>", "entity.name.tag.docstrip.expl3"],
  ["%</!spa>", "entity.name.tag.docstrip.expl3"],
  ["%<+!driver>", "entity.name.tag.docstrip.expl3"],
  ["%<*driver&!final>", "entity.name.tag.docstrip.expl3"],
];

// Negative cases: these must NOT get an expl3 scope (avoid over-matching).
const NEGATIVE = [
  ["\\section{Hello}", "expl3"],
  ["plain text line", "expl3"],
  ["% just a comment", "docstrip"],
  // issue #1: expl3 tokens inside a host % comment must stay comment-colored
  ["% \\tl_if_blank:VTF \\l__examzh_question_combine_fillin_args_tl", "expl3"],
  ["        %     \\bool_if:NT \\l__examzh_question_combine_fillin_bool", "expl3"],
  ["% \\__examzh_question_make_label:n", "expl3"],
  ["  % \\c_true_bool and \\q_stop in a comment", "expl3"],
];

let failures = 0;
for (const [line, want] of CASES) {
  const scopes = scopesOf(line);
  const ok = [...scopes].some((s) => s.includes(want));
  if (!ok) {
    failures++;
    console.error(`FAIL  ${line}\n      expected a scope containing "${want}"`);
    console.error(`      got: ${[...scopes].filter((s) => s.includes("expl3")).join(", ") || "(no expl3 scope)"}`);
  }
}
for (const [line, forbidden] of NEGATIVE) {
  const scopes = scopesOf(line);
  const bad = [...scopes].some((s) => s.includes(forbidden));
  if (bad) {
    failures++;
    console.error(`FAIL  ${line}\n      must NOT contain a "${forbidden}" scope, but did`);
  }
}

if (failures === 0) {
  console.log(`grammar test: ${CASES.length + NEGATIVE.length} cases passed`);
  process.exit(0);
} else {
  console.error(`\ngrammar test: ${failures} failure(s)`);
  process.exit(1);
}
