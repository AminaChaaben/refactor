---
name: 'step-01b-generate-execution-logs'
description: 'Delegate to rrd-establish-execution-baseline to get from insufficient runs to a real multi-run set'
nextStepFile: '{skill-root}/steps/step-02-parse-logs.md'
---

# Step 1b: Generate Execution Logs

## STEP GOAL

Turn "no real execution data yet" into `{min_runs_required}`+ genuine runs. This is the common case, not an edge case — most owners invoking `rrd-analyze-test-reliability` don't already have multi-run logs sitting around.

This capability used to live inline here, but proved bigger than one workflow's prerequisite after real use across several projects (toolchain detection, compile/discovery/environment blocker diagnosis and fixing, multi-run generation) — it's now its own skill, `rrd-establish-execution-baseline`, reusable beyond just this workflow.

## SEQUENCE

### 1. Invoke `rrd-establish-execution-baseline`

Invoke that skill with the target project and a run count of at least `{min_runs_required}` (3 is a reasonable default if the owner hasn't specified more). It handles toolchain detection, diagnosing whichever blocker type is actually present (compile failure / discovery gap / environment blocker, whole-run or partial), fixing what needs fixing via the module's one source-touching exception, and generating the preserved multi-run set.

### 2. Read Its Manifest

Read `{target_project_root}/.refactor-radar-logs/manifest.json` — the format, run count, preserved run file list, any excluded dimensions (e.g. a browser that couldn't run) and why, and any fixes applied. Carry the excluded-dimensions list forward — Step 3 (classify) must not treat excluded-dimension data as real signal.

### 3. Confirm Sufficiency

If the manifest's `run_count` still falls short of `{min_runs_required}` (e.g. `rrd-establish-execution-baseline` stopped early and reported an unresolved blocker), surface that to the owner plainly rather than proceeding to classify on insufficient data — same rule as step-01's Step 3.

### 4. Set Log Sources and Continue

Set `{log_sources}` to the manifest's `log_sources_dir`. Return to `step-01-preflight-and-init.md` Step 3 — the minimum run count is now satisfied, so it proceeds to Step 4 (load knowledge fragments) and then `step-02-parse-logs.md`.
