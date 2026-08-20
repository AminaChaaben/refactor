---
name: 'step-02-parse-logs'
description: 'Normalize whatever log format into TestRun records, aggregate per-test history across runs'
nextStepFile: '{skill-root}/steps/step-03-classify.md'
---

# Step 2: Parse Logs

## STEP GOAL

Turn every log source into the normalized `TestRun` record shape from `analyze-test-reliability.md` Step 1, then aggregate into a per-test history spanning all runs.

## SEQUENCE

### 1. Parse Each Source with the Bundled Script

Run `{skill-root}/scripts/parse_test_results.py` against the log source(s) rather than hand-writing a one-off parser — real use across multiple projects found hand-written inline parsing (especially XML, and especially through shell quoting) is a real, recurring source of avoidable bugs. The script auto-detects JUnit XML, TestNG XML (a distinct structure — nested `test-method` under `class` under `test` under `suite`, with the parent `<test name="...">` often carrying dimension info like a browser tag), and Playwright JSON, and normalizes all of them into the same `TestRun` record shape:

```bash
python "{skill-root}/scripts/parse_test_results.py" {log_sources_dir_or_files} > /tmp/parsed.json
```

For Jenkins console text (no bundled parser — too free-form to generalize): grep for the embedded test-runner's own summary/per-test lines (Surefire's `Tests run: X, Failures: Y...` per class, or Playwright list-reporter `✓`/`✘` lines) rather than trying to parse arbitrary console prose. Mark every record sourced this way as lower confidence.

### 2. Assign Run IDs

The script derives `run_id` from each source filename by default. Use a stable identifier either way (filename, timestamp, build number if visible in the log) — this is what Step 3's consistency check groups by.

### 3. Discovery Gap Check — Unconditional, Even for Owner-Supplied Logs

Before aggregating, cross-check the parsed test count against the real number of `@Test`-annotated methods in source (`search_graph`/`query_graph`/`Grep`, independent of what the logs claim) — **do this even if the owner supplied their own logs and step-01b/`rrd-establish-execution-baseline` never ran**. The same naming-convention discovery gap that skill checks for when generating logs can just as easily already be baked into logs the owner brought themselves. If the counts don't match, say so before proceeding — don't silently classify a partial, gapped data set as if it were complete.

### 4. Aggregate Per Test

Group all `TestRun` records by `test_id` into a history list, sorted by run order if determinable. Note the total run count actually available per test — not every test necessarily appears in every run (e.g. a test added mid-way, one that only runs under a certain tag/profile, or one excluded via an environment dimension flagged in `rrd-establish-execution-baseline`'s manifest if that skill ran).

### 5. Report Parsing Coverage

Before proceeding, state how many runs were parsed, how many distinct tests were found (and how that compares to the real `@Test` count from Step 3), and flag any log source that failed to parse cleanly (don't silently drop it — say what went wrong).

### 6. Continue

Load `./step-03-classify.md`.
