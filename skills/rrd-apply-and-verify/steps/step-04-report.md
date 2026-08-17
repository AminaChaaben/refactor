---
name: 'step-04-report'
description: 'Report per-diff outcome and real test results; remind the owner nothing is committed'
nextStepFile: null
---

# Step 4: Report

## SEQUENCE

### 1. Write Summary

Write `{rrd_artifacts}/apply-and-verify-{target_project}-{date}.md`:

- Per diff: applied+passed / applied+failed (with real failure detail from the native report) / skipped (with the specific reason)
- Before/after test counts where a diff was expected to change coverage
- Full aggregate: tests run / failures / errors / skipped across the full-suite run

### 2. Summarize to Owner

Report in Ray's voice (terse, evidence-led), in `{communication_language}`:

```
Applied: {n} of {total} proposals
  #{id}: {title} -> applied, tests pass ({before} -> {after} tests)
  #{id}: {title} -> skipped: {specific reason}
  #{id}: {title} -> applied, TESTS FAILED: {real failure detail}

Full suite: {tests_run} run, {failures} failures, {errors} errors, {skipped} skipped

Nothing committed. `git status`/`git diff` in {target_project_root} is your call.
```

### 3. If Any Diff Left Tests Failing

Stop here — do not apply further diffs in the same run once a failure is found, unless the owner explicitly says to continue. Suggest (do not perform) `git diff <file>` to inspect, or `git checkout -- <file>` to revert, as owner-initiated options.

Workflow complete.
