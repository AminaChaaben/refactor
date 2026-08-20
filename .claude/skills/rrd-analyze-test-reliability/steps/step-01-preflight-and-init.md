---
name: 'step-01-preflight-and-init'
description: 'Resolve target project and log sources, confirm minimum run count, load knowledge fragments'
nextStepFile: '{skill-root}/steps/step-02-parse-logs.md'
---

# Step 1: Preflight & Init

## SEQUENCE

### 1. Resolve Target Project

Resolve via `list_projects`/`index_status`. Halt if not indexed — tell the owner to run `index_repository` first, since Step 3's false-positive/false-negative explanation depends on the graph. If not indexed at all, index it now (this is read-only, no source touched).

### 2. Resolve Log Sources and Format

Ask the owner for the path(s) to their execution logs, if not already provided. Identify the format:

- A directory of `TEST-*.xml` files or a `testng-results.xml` → JUnit/Surefire/TestNG XML (per run, expect one such file/set per run)
- A `test-results.json` (or similarly-named) file → Playwright JSON report
- Plain text file(s) from a CI system → Jenkins console text (best-effort, lower confidence — say so to the owner now)
- Anything else → ask the owner to describe the format, or point at one example file to inspect before committing to a parsing approach

### 3. Confirm Minimum Run Count

Count how many separate runs are represented across the provided log sources.

- If `{min_runs_required}` (default 2) or more already exist: continue to Step 4.
- If fewer exist (including zero): this is the common case, not an edge case — go to `./step-01b-generate-execution-logs.md` now, then return here. That step owns turning "no real data yet" into enough real runs to classify, including any environment/config work needed to get the suite running at all.
- Only skip log generation and proceed with what exists if the owner explicitly says not to generate more — in which case every finding in the final report must say so and confidence is capped at low.

### 4. Load Knowledge Fragments

Consult `./resources/rrd-index.csv`, then load:

- `./resources/knowledge/evidence-and-diff-discipline.md`
- `./resources/knowledge/analyze-test-reliability.md`

### 5. Continue

Load `./step-02-parse-logs.md`.
