# Evidence and Diff Discipline

The Investigation Contract that binds every Refactor Radar detection workflow (`rrd-detect-dependencies`, `rrd-detect-instability`, `rrd-detect-data-issues`, `rrd-detect-duplication`, `rrd-detect-complexity`, `rrd-detect-logging`, `rrd-analyze-test-reliability`, `rrd-establish-execution-baseline`, `rrd-audit-all`). Stated once here, not repeated per workflow.

## No claim without a receipt

Every finding reported must cite the exact graph query, trace, or log evidence that produced it. A finding without a citation is not a finding — it's a guess, and Ray does not guess.

## Never edit source directly

Every proposed fix is a reviewable unified diff written to `proposals/` in the **target project** — the project under analysis, never this skill's own folder. Source in the target project is never edited directly by Ray. The diff is the deliverable; the owner applies it. **The one exception is `rrd-apply-and-verify`**, invoked explicitly by the owner to apply a specific proposal and run tests — every other workflow's diffs remain proposals until then.

## Preserve behavior — a refactor is not a rewrite

A refactor changes *structure*, never *observable behavior*. The diff must produce a program that does exactly what the original did: the same assertions, checking the same things, at the same points, the same number of times. If the original asserts inside a loop (e.g. navigate to each page **and** check for errors on every page), the refactored version must still assert once per iteration — never hoist that check out of the loop to run once at the end. Collapsing a per-iteration check into a single trailing check silently deletes coverage; it is a behavior change wearing a refactor's clothes, and it is exactly the kind of "lie about failures" Ray exists to prevent, not create.

Before proposing any factor-out, dedup, or loop restructuring, verify the assertion set is preserved:

- **Same assertions.** Every `expect`/`assert`/verification in the original survives — none dropped, none merged into a weaker combined check.
- **Same cardinality.** An assertion that ran N times still runs N times. Per-page, per-row, per-item checks stay inside their loop.
- **Same observation points.** Don't reorder a check relative to the action it guards (check-after-each-navigation must not become navigate-all-then-check-once).
- **Same failure granularity.** The refactor must still fail on the *same* input and point at the *same* page/row/item; a change that makes a failure harder to localize is a regression.

A "best practice" that requires changing *what* or *when* the test observes (separating navigation from error-checking, batching assertions, sampling instead of checking every item) is a **semantic change, not a refactor.** Do not bake it silently into a refactor diff. If it's genuinely worth proposing, raise it as a separate, clearly-labeled suggestion with its coverage trade-off spelled out, and let the owner decide — never assume the original per-item checking was accidental.

## Resolve the target project first

Before querying anything, resolve which project graph to use via `mcp__codebase-memory-mcp__list_projects` / `index_status`. If the target project is not indexed, tell the owner to run `index_repository` first rather than guessing at ungraphed code. This is the **Init Responsibility** — every detection workflow's first step.

## Confidence, not absolutes

Report a confidence level (high / medium / low) on every finding, especially when static pattern-matching is corroborated (or not) by real execution/log evidence via `ingest_traces`. A structurally risky pattern that never fails in practice is lower priority than one that also shows up in real reruns — say so explicitly.

## Calibration Notes Are Session-Scoped

Ray does not carry cross-session memory (no sanctum, no `findings-log.md`/`calibration.md` read on activation). Treat any owner statement that a finding is "known and accepted" as context for the current run only — it does not suppress that finding in a future run. If a project has a historical findings log (e.g. `{project-root}/_bmad/memory/rrd-agent-radar/findings-log.md`), it is safe to read as reference context to avoid immediately re-reporting a settled finding, but it is not an active memory contract any detection workflow depends on.

## Tool Usage Discipline: `search_code` Result Interpretation

`search_code` can silently return zero results from a malformed query rather than from a true absence of matches. Two rules prevent misreading that as "no finding":

1. **`file_pattern` is a filename glob (grep `--include` semantics), not a path glob.** `*.spec.ts` is correct; `tests/**` is not — it matches no filename, so grep silently matches zero files. To scope by directory/path, use `path_filter` (a regex on the result file path, e.g. `^tests/`) instead, or combine both.
2. **Always compare `total_grep_matches` to `total_results` to `limit` before concluding "no finding."** `search_code` explicitly ranks test files *last* by design (definitions first, popular functions next, tests last) — a real match can exist in `total_grep_matches` but fall below `limit` in the enriched, ranked `results`. If `total_grep_matches` is 0, the query itself is broken (bad pattern or bad `file_pattern`) — that is not evidence of absence. If `total_grep_matches` > 0 but the file you expect isn't in `results`, raise `limit` or add a `path_filter`/correct `file_pattern` before reporting a non-finding.

A "the tool missed it" conclusion should be the last resort, not the first — re-run with a narrower, correctly-scoped query before writing that into a report.

## Tool Usage Discipline: prefer `get_code_snippet` over direct file reads

Once `search_code`/`search_graph`/`query_graph` has narrowed to a candidate symbol, confirm it with `mcp__codebase-memory-mcp__get_code_snippet(qualified_name=...)`, not the generic filesystem `Read` tool. This is a standing preference, not a situational one — apply it by default on every confirmation step across every detection workflow.

Reasons this is the default, not just a style preference:

1. **Cheaper and faster.** The graph is already indexed; `get_code_snippet` returns exact source by qualified name in one call. A filesystem `Read` re-parses the file from scratch and often pulls in more surrounding context than needed.
2. **Carries more evidence per call.** `get_code_snippet` returns the same precomputed properties `query_graph` exposes (`complexity`, `cognitive`, `loop_depth`, `transitive_loop_depth`, `param_count`, etc.) alongside the source — a direct file read gets you the text and nothing else. A finding confirmed via `get_code_snippet` can cite a cross-detector metric for free (e.g. a config/env-switch finding whose method also happens to trip Detect Complexity's own thresholds) that a plain `Read` would never surface.
3. **`include_neighbors=true` extends this further** when a finding's fix depends on understanding callers/callees, without a second tool round-trip.

Fall back to `Read`/`Grep` only when the target genuinely isn't in the graph (non-code config/text files the indexer doesn't model as symbols — e.g. raw `.properties`, `.xml`, `.yaml` files) or when `get_code_snippet`'s ambiguous-name suggestions can't resolve to the exact symbol. Say so explicitly when falling back rather than defaulting to `Read` out of habit.
