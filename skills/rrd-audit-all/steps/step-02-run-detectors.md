---
name: 'step-02-run-detectors'
description: 'Run all nine detection heuristics against the target project and pool findings'
nextStepFile: '{skill-root}/steps/step-02b-evidence-fusion.md'
---

# Step 2: Run Detectors

## STEP GOAL

Run all nine detection heuristics against `{target_project}`, in turn, and pool every finding into a single list before ranking.

## SCOPE (Incremental vs. Full — Set by Step 1)

If Step 1 established incremental mode, every `search_code` call below adds a `path_filter` matching the changed-file list, and every `query_graph`/`search_graph` call adds an equivalent `WHERE f.file_path IN [...]`/`file_pattern` restriction — scope every detector to the same changed-file list, not just some of them. `rrd-detect-dependencies` and `rrd-detect-locators` are partial exceptions: coupling and locator-duplication findings can span a changed file and an *unchanged* file that shares state/a selector with it, so those two detectors additionally check the immediate neighbors (via `trace_path`/existing `SIMILAR_TO`-style lookups) of each changed file, not only the changed files in isolation — narrow scope should not silently blind a cross-file detector to a real, relevant connection just outside the changed set.

## SEQUENCE

### 1. Detect Dependencies

Apply the coupling heuristics from `detect-dependencies.md`: `search_graph`/`query_graph` for shared mutable fixtures/state, `trace_path` to confirm real coupling. Weight live/shared hosted state heavily.

### 2. Detect Instability

Apply the fragility heuristics from `detect-instability.md`: `search_code`/`search_graph` for volatile selectors and fixed waits; correlate against logs directly via `Read`/`Grep` if available (`ingest_traces` is currently a no-op on the server — do not rely on it).

### 3. Detect Data Issues

Apply the data-lifecycle heuristics from `detect-data-issues.md`: `search_graph`/`query_graph` for hardcoded data and missing cleanup; correlate cross-run collisions via direct log reads (`Read`/`Grep`) if available (`ingest_traces` is currently a no-op on the server — do not rely on it).

### 4. Detect Duplication

Apply the similarity heuristics from `detect-duplication.md`: query `SIMILAR_TO` edges (jaccard score) as the primary evidence source, falling back to `search_graph`/`query_graph` pattern matching only where no `SIMILAR_TO` coverage exists; confirm every candidate by reading source via `get_code_snippet` before scoring the group.

### 5. Detect Complexity

Apply the complexity heuristics from `detect-complexity.md`: `query_graph` for `complexity`/`cognitive`/`transitive_loop_depth`/`linear_scan_in_loop`/`unguarded_recursion` hotspots across multiple axes (a single ORDER BY misses hotspots that only rank high on one metric); confirm every candidate by reading source via `get_code_snippet` and name the concrete pattern driving the number, not just the metric. Note any target also flagged by another detector this pass — that cross-family corroboration feeds Evidence Fusion (step-02b).

### 6. Detect Logging

Apply the diagnosability heuristics from `detect-logging.md`: `query_graph` for `CALLS` edges to failure-capable external callees and for `loop_depth`/`transitive_loop_depth` candidates, `search_code` for catch-block syntax; confirm every candidate by reading source via `get_code_snippet` and name the concrete gap (silent catch, exception-dropping log, unlogged external call, unlogged loop failure path). Tag each confirmed gap with a failure-classification leaning (app-error/env-error/data-error/script-bug). Separately, check failure-diagnostics capture (screenshot/trace on failure) for the target's test framework and report present/gapped/absent. Note any target also flagged by Detect Instability or Detect Dependencies this pass — that cross-family corroboration feeds Evidence Fusion (step-02b).

### 7. Detect Config

Apply the environment/config heuristics from `detect-config.md`: `search_code`/`search_graph` for hardcoded URLs/credentials/secrets and inline environment-switch logic; `query_graph`/config-file inspection for hardcoded timeout literals and unsafe forced-serial parallel-execution settings. Cross-reference any forced-serial finding against this pass's own Detect Dependencies results before reporting it standalone — a forced-serial config is often a workaround for coupling this same pass already found.

### 8. Detect Locators

Apply the locator-strategy heuristics from `detect-locators.md`: `search_graph`/`search_code` for duplicated selector literals across page objects; sample the page-object layer to classify locator-priority tiering; check for a centralized element repository vs. scattered inline locators. Consume this pass's own Detect Instability findings as input rather than re-flagging the same fragile selector independently — cite it as corroboration where a selector is both duplicated and independently fragile.

### 9. Detect Layering

Apply the architecture heuristics from `detect-layering.md`: `get_architecture(aspects=["file_tree","structure"])` to enumerate the actual directory structure against the seven candidate layers (tests, pages, components, data, utils, config, reporting); `search_code`/`search_graph` for assertion calls embedded in page-object methods and raw-data manipulation bypassing an existing data layer; sample file names per layer for naming-convention consistency. Cross-reference config-layer findings against this pass's own Detect Config results rather than duplicating (this detector owns whether config lives in its own structural layer; Detect Config owns what's hardcoded inside it).

### 10. Pool

Combine every finding from all nine passes into one list, each tagged with its root-cause family, evidence citation, and confidence level.


### 12. Write Findings

Serialize findings to JSON for pipeline processing:
```bash
mkdir -p {project-root}/.refactor-radar-work/
write {project-root}/.refactor-radar-work/findings.json [Finding[]]
```

Each Finding must include:
- `id`, `detector_family`, `file`, `line`, `title`, `description`
- `evidence` (with citations: search_graph patterns, trace_path results, etc.)
- `confidence` (0.0-1.0)
- `affected_target`, `root_cause_signals`

## ⚠️ CRITICAL CHECKPOINT: BEFORE PROCEEDING TO STEP-02B

**Do not skip this validation. Do not proceed without confirming all of the below.**

Verify:
- [ ] File exists: `{project-root}/.refactor-radar-work/findings.json`
- [ ] File is valid JSON (parseable, not truncated)
- [ ] File contains at least 1 Finding (count findings by detector_family and report)
- [ ] Every Finding has required fields: `id`, `detector_family`, `file`, `line`, `title`, `description`, `evidence`, `confidence`, `affected_target`, `root_cause_signals`
- [ ] Confidence values are between 0.0 and 1.0 (not percentages)
- [ ] No duplicated Finding IDs within the JSON

If any validation fails, **HALT**. Do not proceed to step-02b. Report the failure to the user and ask them to re-run step-02 or investigate the detector output.

If all validations pass, report the count:
```
Step 02 complete: {num_findings} findings across {num_detectors} detectors written to findings.json
Ready to proceed to step-02b (Evidence Fusion)
```

### 13. Continue

Load and proceed to `./step-02b-evidence-fusion.md`.
