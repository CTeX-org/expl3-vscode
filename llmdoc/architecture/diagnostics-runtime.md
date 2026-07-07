# Architecture — explcheck Diagnostics Runtime

The entire runtime lives in `src/extension.ts` (single module). Its one job is
to run the external `explcheck` CLI on expl3 files and turn its output into VS
Code diagnostics. Highlighting is grammar-only and needs no runtime code.

## Activation model

- `package.json` `activationEvents`: `onLanguage:latex`, `onLanguage:latex-expl3`,
  `onLanguage:tex`, `onLanguage:expl3`. The extension activates only for those
  four language ids (not `*`). The `latex`/`latex-expl3`/`tex` ids come from other
  extensions (e.g. LaTeX Workshop); `expl3` is contributed by this extension.
- `main` is `./dist/extension.js` (the esbuild bundle).
- `extensionKind: ["workspace"]` forces the extension onto the workspace/remote
  host, not the UI host. This is the **remote-support mechanism**: `explcheck` is
  a CLI that must run where the files and executable live (SSH remote, WSL, dev
  container).
- `activate()` (`src/extension.ts` `activate`):
  1. creates a `DiagnosticCollection` named `"explcheck"` and registers it in
     `context.subscriptions`;
  2. eagerly lints all already-open documents so diagnostics appear immediately,
     not only on the next event;
  3. registers the workspace listeners and the command below.

## Lintable-document gate

`isLintable(doc)` (`src/extension.ts` `isLintable`) skips a document unless all
hold:

- `doc.uri.scheme === "file"` (non-file schemes — untitled, virtual FS — are
  skipped; explcheck needs a real path).
- path does **not** end in `.dtx` or `.ins` (excluded by extension even if the
  language id resolves to `latex`; explcheck can't process them, issue #20).
- `doc.languageId` is in `LINTABLE_LANGS` = `latex`, `latex-expl3`, `tex`, `expl3`.

## Diagnostics flow: trigger → lint → spawn → parse → show

Triggers registered in `activate`. Auto-linting on open/save goes through
`lintAuto()`, which returns early when `runMode() === "manual"`:

- `onDidOpenTextDocument` → `lintAuto()` (skipped in `manual` mode).
- `onDidSaveTextDocument` → `lintAuto()` (the default path; `check.run` defaults
  to `onSave`; skipped in `manual` mode).
- `onDidChangeTextDocument` → acts **only** when `runMode() === "onType"`;
  otherwise returns early. When `onType`, calls `scheduleLint` with
  `Math.max(100, debounce)` ms.
- `onDidCloseTextDocument` → `collection.delete(doc.uri)` clears diagnostics.
- `expl3.check.run` command → lints `activeTextEditor.document` (no-op if no
  active editor). Bypasses the `check.run` mode (works even in `manual`) but
  still honors the lintable-document gate.

The initial eager scan in `activate` also goes through `lintAuto`, so `manual`
mode does not auto-lint already-open documents on activation.

**Debounce** (`debounceTimers` + `scheduleLint`): a per-document
`Map<string, NodeJS.Timeout>` keyed by `doc.uri.toString()`. A new change clears
the previous timer for that key and reschedules. Only the `onType` path uses it.

**Dirty-buffer handling** (`lint`): `explcheck` reads no stdin, so if the buffer
is dirty the current text is written to a temp file
`os.tmpdir()/explcheck-<pid>-<Date.now()><ext>` (extension preserved, `.tex`
fallback) and `runExplcheckTemp` lints that copy. Because it is an exact byte
copy, ranges map 1:1 back to the editor buffer. `runExplcheckTemp` always
`fs.unlink`s the temp file in the callback. A clean (non-dirty) buffer is linted
directly on `doc.uri.fsPath` via `runExplcheck`.

**Process spawn** (`runExplcheck`, `runExplcheckTemp`): uses
`cp.execFile(exe, args, { maxBuffer: 8*1024*1024, cwd }, cb)` — not a shell, so
args are an array with no interpolation.

- `exe` = `explcheckPath()` = `expl3.check.path` (default `"explcheck"`, empty
  string guarded).
- `maxBuffer` = 8 MiB for stdout.
- `cwd` = `execCwd(docUri)` — the workspace folder fsPath if the doc is in one,
  else `dirname(doc.fsPath)`. Rationale: explcheck only looks for `.explcheckrc`
  in its cwd (no upward search), so running from the workspace root lets a
  project-level `.explcheckrc` apply to files in subdirectories.
- On `err.code === "ENOENT"` → `onMissing()` and return.
- Otherwise parse stdout (stderr is ignored) and `collection.set(docUri, diags)`.

**Args** (`buildArgs`):

- Always: `--porcelain`, `--error-format`, `ERROR_FORMAT`.
- `ERROR_FORMAT` = `"%f:%l:%c:%e:%k: %t%n %M"` (file:startLine:startCol:endLine:
  endCol: `<t><nnn> <message>`).
- `--max-line-length <n>` only if `check.maxLineLength > 0` (0 = explcheck's own
  default of 80).
- `--ignored-issues <csv>` only if `check.ignoredIssues` is non-empty (comma-joined).
- `--make-at-letter` only if `check.makeAtLetter` is true.
- positional `target` (the file path) appended last.

**Output parsing** (`parseOutput` + `LINE_RE`):

- `LINE_RE` =
  `/^(?<file>.+?):(?<l>\d+):(?<c>\d+):(?<el>\d+):(?<ec>\d+):\s+(?<t>[ewst])(?<n>\d+)\s+(?<msg>.*)$/`.
- Splits stdout on `/\r?\n/`, trims, skips blank/non-matching lines.
- Path filter: drops rows where `path.resolve(m.groups.file) !== targetResolved`
  (explcheck echoes the path it was given).
- Converts 1-based line/col to 0-based, clamped with `Math.max(0, n-1)`.
- `code` = `<t><n>` (e.g. `s103`, `w204`, `t301`), `diag.source = "explcheck"`.
- `diag.code = { value: code, target: ruleDocUri(code) }` — a **clickable code**
  linking to the rule's documentation.

**Severity mapping** (`severityOf`):

| explcheck letter | meaning | VS Code severity |
|---|---|---|
| `e` | other errors | Error |
| `t` | type errors | Error |
| `w` | other warnings | Warning |
| `s` (and default) | style warnings | Information |

**Clickable rule docs** (`ruleDocUri`, `DOC_BASE`, `PHASE_DOC`): strips the
leading severity letter, takes the first digit, maps `1..5` to phase-specific
markdown docs (preprocessing / lexical / syntactic / semantic / flow), falling
back to `warnings-and-errors-00-introduction.md`. Base URL:
`https://github.com/witiko/expltools/blob/main/explcheck/doc/`.

## Configuration reading

All config is read fresh on each use via `config()` = `getConfiguration("expl3")`
(no caching), so changes take effect on the next lint without a reload. See
`reference/configuration.md` for the full table and where each option is consumed.

## Missing-executable handling

`onMissing()` + a `warnedMissing` flag fires exactly **once** on `ENOENT`: a
`showWarningMessage` telling the user to install `expltools`
(`tlmgr install expltools`) or set `expl3.check.path`, with an "Open Settings"
action scoped to `expl3.check.path`. Any other `execFile` error is silently
swallowed — the callback proceeds to parse an empty stdout, yielding no
diagnostics. There is no output channel or status bar.

## Invariants & edge cases

1. **`manual` mode is honored on open/save.** `lintAuto` (and the initial scan)
   returns early when `runMode() === "manual"`, so open/save no longer trigger
   explcheck in that mode — matching the package.json `enumDescription`. The
   `expl3.check.run` command still works in `manual` mode.
2. **onType debounce has a hard floor of 100 ms** (`Math.max(100, delay)`)
   regardless of the configured value (and the `minimum: 100` in the schema).
3. **Debounce timers are cleared on dispose.** A disposable registered in
   `context.subscriptions` clears all pending `debounceTimers` on deactivation,
   so no timer fires after the extension is disposed.
4. **`execFile` runs with a `EXEC_TIMEOUT_MS` (30 s) timeout.** On timeout
   execFile sends SIGTERM and still fires the callback, so a hung explcheck is
   bounded and the dirty-buffer temp file is still unlinked in the callback (no
   leak). A timeout yields no diagnostics for that run.
5. **Path filtering assumes explcheck echoes exactly the path passed.** If
   explcheck normalized/relativized differently, `path.resolve` comparison could
   drop valid rows.
6. **Disabling `check.enable` does not clear existing diagnostics.** It stops new
   lints, but stale diagnostics remain until the document is closed or re-linted.
7. **`.dtx`/`.ins` and non-`file` schemes are excluded** (see the gate above).
