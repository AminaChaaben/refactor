# Evidence and Diff Discipline

The Investigation Contract that binds every Refactor Radar detection workflow (`rrd-detect-dependencies`, `rrd-detect-instability`, `rrd-detect-data-issues`, `rrd-detect-duplication`, `rrd-detect-complexity`, `rrd-detect-logging`, `rrd-analyze-test-reliability`, `rrd-establish-execution-baseline`, `rrd-audit-all`). Stated once here, not repeated per workflow.

## No claim without a receipt

Every finding reported must cite the exact graph query, trace, log evidence, or (for this workflow specifically) the exact run ID and source line that produced it. A finding without a citation is not a finding — it's a guess, and Ray does not guess. For this workflow in particular: "flaky" is not a finding, a specific error message correlated to a specific structural cause is; "this test doesn't check anything" is not a finding, the exact swallowed-exception line or tautological assertion is.

## Never edit source directly

Every proposed fix is a reviewable unified diff written to `proposals/` in the **target project** — the project under analysis, never this skill's own folder. Source in the target project is never edited directly by Ray. The diff is the deliverable; the owner applies it. **The one exception is `rrd-apply-and-verify`**, invoked explicitly by the owner to apply a specific proposal and run tests — every other workflow's diffs remain proposals until then.

## Resolve the target project first

Before querying anything, resolve which project graph to use via `mcp__codebase-memory-mcp__list_projects` / `index_status`. If the target project is not indexed, tell the owner to run `index_repository` first rather than guessing at ungraphed code. This is the **Init Responsibility** — every detection workflow's first step.

## Confidence, not absolutes

Report a confidence level (high / medium / low) on every finding. For this workflow: a classification based on 5+ runs with a structured report format (JUnit XML, Playwright JSON) is high confidence; one based on 2 runs or a best-effort Jenkins-console-text parse is medium; anything inferred without enough runs to actually establish consistency is low and should say so rather than presenting as settled.

## Memory retired — check history manually if it exists

Ray no longer carries cross-session memory (no sanctum, no `findings-log.md`/`calibration.md` read on activation) — this is a deliberate structural-fidelity decision, not an oversight. If a project has a historical findings log, it is safe to read as reference context but is not an active memory contract this workflow depends on.

## Tool Usage Discipline: `search_code` (lesson from a real miss)

A real audit run once nearly reported `search_code` as "unreliable" for missing a confirmed match. Root cause, after digging in: operator error, not a tool defect. Two rules prevent this recurring:

1. **`file_pattern` is a filename glob (grep `--include` semantics), not a path glob.** `*.spec.ts` is correct; `tests/**` is not — it matches no filename, so grep silently matches zero files. To scope by directory/path, use `path_filter` (a regex on the result file path, e.g. `^tests/`) instead, or combine both.
2. **Always compare `total_grep_matches` to `total_results` to `limit` before concluding "no finding."** `search_code` explicitly ranks test files *last* by design — a real match can exist in `total_grep_matches` but fall below `limit` in the enriched, ranked `results`.

## Tool Usage Discipline: `ingest_traces` does not ingest test logs

`ingest_traces` only accepts `{caller, callee, count}` call-frequency triples — it has no concept of test pass/fail and cannot parse JUnit XML, Jenkins console output, or Playwright reports. This workflow's log parsing is a separate, from-scratch capability using `Read`/`Grep`/`Bash` — see `analyze-test-reliability.md` Step 1. Do not attempt to route log files through `ingest_traces`.
