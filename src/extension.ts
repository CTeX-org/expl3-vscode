import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";

// One diagnostic line from explcheck --porcelain with our custom error-format:
//   %f:%l:%c:%e:%k: %t%n %M
//   file:startLine:startCol:endLine:endCol: <t><nnn> <message>
// Line/column numbers are 1-based; %c/%k are byte columns.
const LINE_RE =
  /^(?<file>.+?):(?<l>\d+):(?<c>\d+):(?<el>\d+):(?<ec>\d+):\s+(?<t>[ewst])(?<n>\d+)\s+(?<msg>.*)$/;

const ERROR_FORMAT = "%f:%l:%c:%e:%k: %t%n %M";

// Language ids we lint. .dtx is intentionally excluded: explcheck cannot yet
// process .dtx directly (see explcheck issue #20, planned for v1.1).
const LINTABLE_LANGS = new Set([
  "latex",
  "latex-expl3",
  "tex",
  "expl3",
]);

function severityOf(t: string): vscode.DiagnosticSeverity {
  switch (t) {
    case "e": // other errors
    case "t": // type errors
      return vscode.DiagnosticSeverity.Error;
    case "w": // other warnings
      return vscode.DiagnosticSeverity.Warning;
    case "s": // style warnings
    default:
      return vscode.DiagnosticSeverity.Information;
  }
}

// explcheck has no per-rule HTML page (docs are PDF + pandoc markdown, and
// GitHub does not honour the pandoc {label=...} anchors). The best stable link
// is the phase-specific markdown source, chosen by the rule's leading digit.
// Users land on the right document and can search for the code. Falls back to
// the intro for anything unrecognised.
const DOC_BASE =
  "https://github.com/witiko/expltools/blob/main/explcheck/doc/";
const PHASE_DOC: Record<string, string> = {
  "1": "warnings-and-errors-01-preprocessing.md",
  "2": "warnings-and-errors-02-lexical-analysis.md",
  "3": "warnings-and-errors-03-syntactic-analysis.md",
  "4": "warnings-and-errors-04-semantic-analysis.md",
  "5": "warnings-and-errors-05-flow-analysis.md",
};
function ruleDocUri(code: string): vscode.Uri {
  const digit = code.replace(/^[a-z]/i, "").charAt(0);
  const file = PHASE_DOC[digit] ?? "warnings-and-errors-00-introduction.md";
  return vscode.Uri.parse(DOC_BASE + file);
}


function config() {
  return vscode.workspace.getConfiguration("expl3");
}

function isEnabled(): boolean {
  return config().get<boolean>("check.enable", true);
}

function explcheckPath(): string {
  return config().get<string>("check.path", "explcheck") || "explcheck";
}

// explcheck looks for `.explcheckrc` in its cwd only (no upward search).
// Run it from the workspace root so a project-level config is picked up
// regardless of where the checked file sits. Falls back to the file's dir.
function execCwd(docUri: vscode.Uri): string {
  const folder = vscode.workspace.getWorkspaceFolder(docUri);
  if (folder) return folder.uri.fsPath;
  return path.dirname(docUri.fsPath);
}

// Should we lint this document? Skip .dtx by extension even if the language id
// happens to resolve to latex, since explcheck rejects .dtx outright.
function isLintable(doc: vscode.TextDocument): boolean {
  if (doc.uri.scheme !== "file") return false;
  if (doc.uri.fsPath.toLowerCase().endsWith(".dtx")) return false;
  if (doc.uri.fsPath.toLowerCase().endsWith(".ins")) return false;
  return LINTABLE_LANGS.has(doc.languageId);
}

function buildArgs(target: string): string[] {
  const args = ["--porcelain", "--error-format", ERROR_FORMAT];
  const maxLen = config().get<number>("check.maxLineLength", 0);
  if (maxLen && maxLen > 0) args.push("--max-line-length", String(maxLen));
  const ignored = config().get<string[]>("check.ignoredIssues", []);
  if (ignored && ignored.length > 0) {
    args.push("--ignored-issues", ignored.join(","));
  }
  const atLetter = config().get<boolean>("check.makeAtLetter", false);
  if (atLetter) args.push("--make-at-letter");
  args.push(target);
  return args;
}

// Run explcheck on `target` (a real path on disk). Reports diagnostics against
// `docUri`. When the document is dirty we lint a temp copy, so ranges still map
// onto the in-editor buffer 1:1 (explcheck does not read stdin).
function runExplcheck(
  target: string,
  docUri: vscode.Uri,
  collection: vscode.DiagnosticCollection,
  onMissing: () => void,
): void {
  const exe = explcheckPath();
  cp.execFile(
    exe,
    buildArgs(target),
    { maxBuffer: 8 * 1024 * 1024, cwd: execCwd(docUri) },
    (err, stdout, stderr) => {
      // ENOENT => explcheck not installed / not on PATH.
      if (err && (err as NodeJS.ErrnoException).code === "ENOENT") {
        onMissing();
        return;
      }
      const diags = parseOutput(stdout, target);
      collection.set(docUri, diags);
    },
  );
}

function parseOutput(stdout: string, target: string): vscode.Diagnostic[] {
  const diags: vscode.Diagnostic[] = [];
  const targetResolved = path.resolve(target);
  for (const raw of stdout.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = LINE_RE.exec(line);
    if (!m || !m.groups) continue;
    // explcheck echoes the path we passed; only keep rows for our target.
    if (path.resolve(m.groups.file) !== targetResolved) continue;

    const sl = Math.max(0, parseInt(m.groups.l, 10) - 1);
    const sc = Math.max(0, parseInt(m.groups.c, 10) - 1);
    const el = Math.max(0, parseInt(m.groups.el, 10) - 1);
    const ec = Math.max(0, parseInt(m.groups.ec, 10) - 1);
    const range = new vscode.Range(sl, sc, el, ec);

    const code = `${m.groups.t}${m.groups.n}`;
    const diag = new vscode.Diagnostic(
      range,
      m.groups.msg,
      severityOf(m.groups.t),
    );
    diag.source = "explcheck";
    // Clickable code that links to the rule's documentation.
    diag.code = { value: code, target: ruleDocUri(code) };
    diags.push(diag);
  }
  return diags;
}

// Lint a document. If it has unsaved changes, dump the buffer to a temp file
// with the same extension so explcheck sees current content.
function lint(
  doc: vscode.TextDocument,
  collection: vscode.DiagnosticCollection,
  onMissing: () => void,
): void {
  if (!isEnabled() || !isLintable(doc)) return;

  if (!doc.isDirty) {
    runExplcheck(doc.uri.fsPath, doc.uri, collection, onMissing);
    return;
  }

  const ext = path.extname(doc.uri.fsPath) || ".tex";
  const tmp = path.join(
    os.tmpdir(),
    `explcheck-${process.pid}-${Date.now()}${ext}`,
  );
  fs.writeFile(tmp, doc.getText(), (werr) => {
    if (werr) return;
    runExplcheckTemp(tmp, doc.uri, collection, onMissing);
  });
}

function runExplcheckTemp(
  tmp: string,
  docUri: vscode.Uri,
  collection: vscode.DiagnosticCollection,
  onMissing: () => void,
): void {
  const exe = explcheckPath();
  cp.execFile(
    exe,
    buildArgs(tmp),
    { maxBuffer: 8 * 1024 * 1024, cwd: execCwd(docUri) },
    (err, stdout) => {
      fs.unlink(tmp, () => {});
      if (err && (err as NodeJS.ErrnoException).code === "ENOENT") {
        onMissing();
        return;
      }
      // Rewrite the temp path in output back to the real doc for filtering.
      const diags = parseOutput(stdout, tmp);
      collection.set(docUri, diags);
    },
  );
}

export function activate(context: vscode.ExtensionContext): void {
  const collection = vscode.languages.createDiagnosticCollection("explcheck");
  context.subscriptions.push(collection);

  let warnedMissing = false;
  const onMissing = () => {
    if (warnedMissing) return;
    warnedMissing = true;
    vscode.window
      .showWarningMessage(
        "expl3: `explcheck` was not found. Install the expltools package " +
          "(`tlmgr install expltools`) or set `expl3.check.path`.",
        "Open Settings",
      )
      .then((choice) => {
        if (choice === "Open Settings") {
          vscode.commands.executeCommand(
            "workbench.action.openSettings",
            "expl3.check.path",
          );
        }
      });
  };

  const debounceTimers = new Map<string, NodeJS.Timeout>();
  const scheduleLint = (doc: vscode.TextDocument, delay: number) => {
    const key = doc.uri.toString();
    const prev = debounceTimers.get(key);
    if (prev) clearTimeout(prev);
    debounceTimers.set(
      key,
      setTimeout(() => {
        debounceTimers.delete(key);
        lint(doc, collection, onMissing);
      }, delay),
    );
  };

  // Lint currently open + already-visible documents.
  for (const doc of vscode.workspace.textDocuments) {
    lint(doc, collection, onMissing);
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) =>
      lint(doc, collection, onMissing),
    ),
    vscode.workspace.onDidSaveTextDocument((doc) =>
      lint(doc, collection, onMissing),
    ),
    vscode.workspace.onDidChangeTextDocument((e) => {
      const mode = config().get<string>("check.run", "onSave");
      if (mode !== "onType") return;
      const delay = config().get<number>("check.debounce", 400);
      scheduleLint(e.document, Math.max(100, delay));
    }),
    vscode.workspace.onDidCloseTextDocument((doc) =>
      collection.delete(doc.uri),
    ),
  );

  // Manual trigger.
  context.subscriptions.push(
    vscode.commands.registerCommand("expl3.check.run", () => {
      const ed = vscode.window.activeTextEditor;
      if (ed) lint(ed.document, collection, onMissing);
    }),
  );
}

export function deactivate(): void {}
