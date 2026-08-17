# Analyze Test Reliability Validation Checklist

## Prerequisites

- [ ] Target project resolved via `list_projects`/`index_status`, confirmed indexed
- [ ] Knowledge fragments loaded: `evidence-and-diff-discipline.md`, `analyze-test-reliability.md`
- [ ] Log source(s) resolved and format identified (JUnit XML / Playwright JSON / Jenkins console / other)
- [ ] At least `{min_runs_required}` separate runs available — if not, generated them via `step-01b-generate-execution-logs.md` (the common case), not just told the owner and stopped
- [ ] If generating logs required a source/config fix: written as a diff and applied via `rrd-apply-and-verify`, never edited directly by this workflow — the only direct-creation exception is a missing fixture the project's own config already expected (net-new, not a modification)
- [ ] If a discovery gap was found (report shows far fewer tests than real `@Test`-annotated methods in source), diagnosed and fixed rather than mistaken for "this project has few tests"

**Halt if missing:** target project not indexed, or fewer than the minimum required runs are available and the owner hasn't explicitly accepted lower-confidence single-run analysis after log generation was attempted or explicitly declined.

## Log Parsing

- [ ] Every log source parsed into the normalized `TestRun` record shape (test_id, file, run_id, status, duration, error/stack_trace)
- [ ] XML parsed with a real XML-aware method, not regex
- [ ] Playwright `retry` counts checked — a `retry > 0` test is a false-positive candidate even within one report
- [ ] Jenkins-console-text-derived results explicitly marked lower confidence than structured formats

## Classification

- [ ] Every test's full run history aggregated before classifying (not judged from a single run)
- [ ] Consistent-fail tests reported as Real Failures without further false-positive/negative classification
- [ ] Mixed-status tests: actual failure messages/stack traces read across runs, and the matching detector skill (`rrd-detect-instability`/`rrd-detect-dependencies`/`rrd-detect-data-issues`) actually invoked, scoped to the flagged target — not just its knowledge fragment pattern-matched from memory. "Flaky" alone is not an accepted finding, and neither is an unconfirmed pattern match.
- [ ] Consistent-pass tests: source read in full for false-negative patterns (swallowed exceptions, unreachable assertions, tautological checks, race-condition false passes, no-op tests) before being called Healthy
- [ ] Every finding cites a specific run ID, error text, or source line — no unsupported classification

## Findings and Proposals

- [ ] False positives get a stabilization diff (per the matched structural heuristic's usual fix)
- [ ] False negatives get a diff fixing the actual assertion/exception-handling/wait logic
- [ ] Every fix written as a diff to the target project's `proposals/`, never applied directly

## Completion Criteria

- [ ] Findings summary written to `{rrd_artifacts}/test-reliability-{target_project}-{date}.md`, grouped into Real Failures / False Positives / False Negatives / Healthy
- [ ] All diff proposals written to the target project's `proposals/`, listed in the summary
- [ ] If any diffs were written, the owner was explicitly asked whether to apply-and-reverify via `rrd-apply-and-verify` — not invoked without that explicit yes, and not skipped/forgotten either
- [ ] If approved and applied: a genuine before/after run comparison reported, including honestly reporting a partial (not fully resolved) result rather than rounding up to "fixed"
