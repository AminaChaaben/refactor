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

If every run for a test shows the same/similar failure: report as a Real Failure. Do not adjudicate whether the underlying app-code bug is correct or not — this workflow doesn't fix application logic, only test-result reliability. Do sub-classify the failure mode itself (see "Failure Mode Sub-Classification" below) — that's a claim about *what kind of thing* broke, not a claim about *whether* the app should have behaved differently.

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
5. Sub-classify the failure mode (see below) — a False Positive's structural cause and its failure-mode tag are two different facts about the same finding, both worth recording.

### 3. Consistent Pass → False Negative Candidate

If every run for a test passes: read the actual test source in full (`get_code_snippet`/`Read`) and check for the patterns in `analyze-test-reliability.md` Step 3 (swallowed exceptions, unreachable assertions, tautological/weak assertions, race-condition false passes, no-op tests). Cross-check duration against peer tests doing comparable work as a corroborating (not sufficient) signal.

- If a disqualifying pattern is found: **False Negative**, with the exact line(s) quoted.
- If the assertions are real, reachable, and specific: **Healthy**.

### 4. Failure Mode Sub-Classification (app / env / data / script)

For every Real Failure and every False Positive whose structural cause is confirmed, additionally tag the failure mode using the same four-way split `rrd-detect-logging` uses when tagging missing-log sites:

| Tag | The failure text/behavior indicates... |
|---|---|
| **app-error** | Genuine application/business-logic bug — wrong response body, unexpected state, an assertion that's correctly catching a real defect |
| **env-error** | Infrastructure/environment — connection refused, DNS failure, container not ready, resource exhaustion, timeout against a live dependency |
| **data-error** | Test-data related — record not found, duplicate key, unexpected pre-existing state (this overlaps heavily with a `rrd-detect-data-issues` finding when one exists — cite it instead of re-deriving) |
| **script-bug** | The automation code itself is wrong, not the system under test — bad locator, off-by-one, incorrect assertion logic (overlaps with `rrd-detect-instability`/`rrd-detect-locators` findings) |

Derive the tag from the actual error text and stack trace, not from which detector happened to confirm the structural cause — a False Positive whose structural cause came from `rrd-detect-dependencies` is still classified by what the *error itself* says, which is very often **data-error** or **env-error** even though the root cause is a coupling problem, not a logic bug. If a `rrd-detect-logging` run already tagged the failing call site with a failure-classification leaning (per `detect-logging.md`), that tag is corroborating evidence for this classification, not a substitute for reading the actual error text from this run's own logs.

A Real Failure or False Positive that doesn't cleanly fit one tag (e.g. a timeout that could be genuinely slow infra or a genuine app hang) should say so and name the ambiguity rather than forcing a single tag — this is a diagnostic aid, not a mandatory single-label classification.

### 5. Record Confidence Per Finding

Per `evidence-and-diff-discipline.md`: high confidence needs 5+ runs and a structured log format; medium needs at least the minimum run count with a structured format, or more runs from a console-text source; low is anything short of that, and must say so explicitly rather than presenting as settled.

### 6. Continue

Load `./step-04-report-and-propose.md`.
