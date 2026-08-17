---
name: 'step-02-run-detectors'
description: 'Run all six detection heuristics against the target project and pool findings'
nextStepFile: '{skill-root}/steps/step-02b-evidence-fusion.md'
---

# Step 2: Run Detectors

## STEP GOAL

Run all six detection heuristics against `{target_project}`, in turn, and pool every finding into a single list before ranking.

## SEQUENCE

### 1. Detect Dependencies

Apply the coupling heuristics from `detect-dependencies.md`: `search_graph`/`query_graph` for shared mutable fixtures/state, `trace_path` to confirm real coupling. Weight live/shared hosted state heavily.

### 2. Detect Instability

Apply the fragility heuristics from `detect-instability.md`: `search_code`/`search_graph` for volatile selectors and fixed waits; correlate with `ingest_traces` if logs are available.

### 3. Detect Data Issues

Apply the data-lifecycle heuristics from `detect-data-issues.md`: `search_graph`/`query_graph` for hardcoded data and missing cleanup; correlate cross-run collisions via logs if available.

### 4. Detect Duplication

Apply the similarity heuristics from `detect-duplication.md`: query `SIMILAR_TO` edges (jaccard score) as the primary evidence source, falling back to `search_graph`/`query_graph` pattern matching only where no `SIMILAR_TO` coverage exists; confirm every candidate by reading source via `get_code_snippet` before scoring the group.

### 5. Detect Complexity

Apply the complexity heuristics from `detect-complexity.md`: `query_graph` for `complexity`/`cognitive`/`transitive_loop_depth`/`linear_scan_in_loop`/`unguarded_recursion` hotspots across multiple axes (a single ORDER BY misses hotspots that only rank high on one metric); confirm every candidate by reading source via `get_code_snippet` and name the concrete pattern driving the number, not just the metric. Note any target also flagged by another detector this pass — that cross-family corroboration feeds Evidence Fusion (step-02b).

### 6. Detect Logging

Apply the diagnosability heuristics from `detect-logging.md`: `query_graph` for `CALLS` edges to failure-capable external callees and for `loop_depth`/`transitive_loop_depth` candidates, `search_code` for catch-block syntax; confirm every candidate by reading source via `get_code_snippet` and name the concrete gap (silent catch, exception-dropping log, unlogged external call, unlogged loop failure path). Note any target also flagged by Detect Instability or Detect Dependencies this pass — that cross-family corroboration feeds Evidence Fusion (step-02b).

### 7. Pool

Combine every finding from all six passes into one list, each tagged with its root-cause family, evidence citation, and confidence level.

### 8. Write Findings

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

### 9. Continue

Load and proceed to `./step-02b-evidence-fusion.md`.
