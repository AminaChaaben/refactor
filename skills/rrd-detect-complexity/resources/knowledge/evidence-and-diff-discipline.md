# Evidence and Diff Discipline

The Investigation Contract that binds every Refactor Radar detection workflow (`rrd-detect-dependencies`, `rrd-detect-instability`, `rrd-detect-data-issues`, `rrd-detect-duplication`, `rrd-detect-complexity`, `rrd-detect-logging`, `rrd-analyze-test-reliability`, `rrd-establish-execution-baseline`, `rrd-audit-all`). Stated once here, not repeated per workflow.

## No claim without a receipt

Every finding reported must cite the exact graph query, trace, or log evidence that produced it. A finding without a citation is not a finding — it's a guess, and Ray does not guess.

## Never edit source directly

Every proposed fix is a reviewable unified diff written to `proposals/` in the **target project** — the project under analysis, never this skill's own folder. Source in the target project is never edited directly by Ray. The diff is the deliverable; the owner applies it. **The one exception is `rrd-apply-and-verify`**, invoked explicitly by the owner to apply a specific proposal and run tests — every other workflow's diffs remain proposals until then.

## Resolve the target project first

Before querying anything, resolve which project graph to use via `mcp__codebase-memory-mcp__list_projects` / `index_status`. If the target project is not indexed, tell the owner to run `index_repository` first rather than guessing at ungraphed code. This is the **Init Responsibility** — every detection workflow's first step.

## Confidence, not absolutes

Report a confidence level (high / medium / low) on every finding, especially when static pattern-matching is corroborated (or not) by real execution/log evidence via `ingest_traces`. A structurally risky pattern that never fails in practice is lower priority than one that also shows up in real reruns — say so explicitly.

## Memory retired — check history manually if it exists

Ray no longer carries cross-session memory (no sanctum, no `findings-log.md`/`calibration.md` read on activation) — this is a deliberate structural-fidelity decision, not an oversight. If a project has a historical findings log (e.g. `{project-root}/_bmad/memory/rrd-agent-radar/findings-log.md` from a prior run of the pre-restructure architecture), it is safe to read as reference context to avoid immediately re-reporting a settled finding, but it is not an active memory contract any detection workflow depends on.


## Tool Usage Discipline: `search_code` (lesson from a real miss)

A real audit run once nearly reported `search_code` as "unreliable" for missing a confirmed match. Root cause, after digging in: operator error, not a tool defect. Two rules prevent this recurring:

1. **`file_pattern` is a filename glob (grep `--include` semantics), not a path glob.** `*.spec.ts` is correct; `tests/**` is not — it matches no filename, so grep silently matches zero files. To scope by directory/path, use `path_filter` (a regex on the result file path, e.g. `^tests/`) instead, or combine both.
2. **Always compare `total_grep_matches` to `total_results` to `limit` before concluding "no finding."** `search_code` explicitly ranks test files *last* by design (definitions first, popular functions next, tests last) — a real match can exist in `total_grep_matches` but fall below `limit` in the enriched, ranked `results`. If `total_grep_matches` is 0, the query itself is broken (bad pattern or bad `file_pattern`) — that is not evidence of absence. If `total_grep_matches` > 0 but the file you expect isn't in `results`, raise `limit` or add a `path_filter`/correct `file_pattern` before reporting a non-finding.

A "the tool missed it" conclusion should be the last resort, not the first — re-run with a narrower, correctly-scoped query before writing that into a report.

## Tool Usage Discipline: metrics and similarity scores are not findings by themselves

`query_graph` exposes precomputed properties (`complexity`, `cognitive`, `loop_depth`, `transitive_loop_depth`, etc.) and precomputed edges (`SIMILAR_TO` with a `jaccard` score) that are exact and graph-computed — always prefer these over estimating the same thing by eye. But a metric crossing a threshold, or an edge with a high score, tells you **where to look**, not that a finding is real or worth fixing. Always call `get_code_snippet` and read the actual source before writing up the finding — name the concrete pattern causing the number (e.g. "7 near-identical try/except blocks"), don't just restate the metric.
