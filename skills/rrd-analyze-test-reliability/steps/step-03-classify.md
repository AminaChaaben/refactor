---
name: 'step-03-classify'
description: 'Classify each test by its run history: Real Failure, False Positive, False Negative, or Healthy'
nextStepFile: '{skill-root}/steps/step-04-report-and-propose.md'
---

# Step 3: Classify

## STEP GOAL

For every test's aggregated history from Step 2, determine which of the four buckets it belongs to, with cited evidence for each.

## SEQUENCE

### 1. Consistent Fail → Real Failure

If every run for a test shows the same/similar failure: report as a Real Failure. Do not classify further (not a false positive, not a false negative) — this workflow doesn't adjudicate app-code bugs, only test-result reliability.

### 2. Mixed Status → False Positive Candidate

If a test shows both pass and fail across runs on unchanged code:

1. Read the actual failure message/stack trace from every failing run — not just the first one.
2. Pick a candidate structural cause from the real error text:
   - Timeout/element-not-found/stale-element errors → `rrd-detect-instability` (fragile selectors, fixed waits, unhandled overlays)
   - Record-not-found/duplicate-key/state-dependent errors → `rrd-detect-dependencies` (shared fixtures, order-dependence, shared live state) or `rrd-detect-data-issues` (data lifecycle)
3. **Invoke the matching detector skill itself, scoped to the flagged target** — not just its knowledge fragment read from memory. Pass the target project and the specific flagged file/class/method as args (e.g. `project {target_project}, scope to {flagged_file_or_target}`) so it examines that code specifically rather than sweeping the whole project. This produces an actual, independently-reproducible Finding to cite — reading the fragment and pattern-matching the error text against it from memory is not sufficient confirmation; a specific finding from the actual detector is.
   - If the invoked detector confirms a real structural cause on that target: use its finding as the cited evidence for this False Positive.
   - If the invoked detector finds nothing on that specific target despite the error text superficially matching a pattern: do not force the classification — say so explicitly, keep it as a lower-confidence False Positive candidate, and note that the structural cause is unconfirmed rather than fabricating a match.
4. Record which specific runs failed, with which specific error, and the specific structural cause found (with the invoked detector's own finding as the citation).

### 3. Consistent Pass → False Negative Candidate

If every run for a test passes: read the actual test source in full (`get_code_snippet`/`Read`) and check for the patterns in `analyze-test-reliability.md` Step 3 (swallowed exceptions, unreachable assertions, tautological/weak assertions, race-condition false passes, no-op tests). Cross-check duration against peer tests doing comparable work as a corroborating (not sufficient) signal.

- If a disqualifying pattern is found: **False Negative**, with the exact line(s) quoted.
- If the assertions are real, reachable, and specific: **Healthy**.

### 4. Record Confidence Per Finding

Per `evidence-and-diff-discipline.md`: high confidence needs 5+ runs and a structured log format; medium needs at least the minimum run count with a structured format, or more runs from a console-text source; low is anything short of that, and must say so explicitly rather than presenting as settled.

### 5. Continue

Load `./step-04-report-and-propose.md`.
