---
name: 'step-04-report-and-propose'
description: 'Write findings summary and diff proposals, grouped by classification'
nextStepFile: null
---

# Step 4: Report and Propose

## SEQUENCE

### 1. Write Diff Proposals

- **False Positives:** propose the stabilization fix implied by the matched structural heuristic (e.g. a stable wait/selector fix for Instability matches, a fixture-isolation fix for Dependencies/Data Issues matches) — same shape of diff those detectors would produce.
- **False Negatives:** propose a diff that fixes the actual defect (stop swallowing the exception, move/fix the unreachable assertion, replace a tautological check with a real one, replace a fixed sleep with an explicit wait-for-condition).
- **Real Failures:** no diff proposed by this workflow — flagged for the owner's own investigation into the app-code bug.

Write every diff to `{target_project_root}/proposals/`, never applied directly.

### 2. Write Findings Summary

Write `{rrd_artifacts}/test-reliability-{target_project}-{date}.md`, grouped into four sections (Real Failures / False Positives / False Negatives / Healthy), each finding citing its run IDs, real error text or source lines, confidence level, and (for the first three) a link to its diff proposal.

### 3. Summarize to Owner

Report in Ray's voice (terse, evidence-led), in `{communication_language}`:

```
Analyzed {n} runs across {m} tests.

Real Failures: {count} — consistent across all runs, not classified further
False Positives: {count} — flaky, {breakdown by matched structural cause}
False Negatives: {count} — pass but don't meaningfully verify anything
Healthy: {count}

Report: {report_path}
Diffs: {proposal_folder}
```

### 4. Offer to Close the Loop — Gated on Explicit Approval

If any diffs were written (Step 1), ask the owner — do not invoke anything yet:

```
Want me to apply {diff or "these diffs"} via rrd-apply-and-verify and re-run {min_runs_required}
more times to confirm {it/they} actually reduce the flakiness, rather than just proposing and
stopping here?
```

**Wait for an explicit yes before invoking `rrd-apply-and-verify`.** This is a human gate, not a default — proposing a diff and offering to verify it are both this workflow's job; applying it is not, even provisionally, without the owner saying so for this specific diff. A prior "yes" for a different diff or a different run does not carry forward.

If approved:
1. Invoke `rrd-apply-and-verify` for the approved diff(s) against `{target_project_root}`.
2. Once applied, generate `{min_runs_required}` fresh runs (via `rrd-establish-execution-baseline` or directly, matching Step 1b's approach) and re-classify just the affected test(s).
3. Report the before/after comparison explicitly: e.g. "Before: FAIL/PASS/FAIL (2/3 fail). After: PASS/PASS/PASS (0/3 fail) — fix confirmed." or, just as honestly, "After: FAIL/PASS/PASS (1/3 fail) — still inconsistent, the fix did not fully resolve it" if that's what the data shows. Do not round a partial improvement up to "fixed."

If declined, or no diffs were written: stop here.

Workflow complete.
