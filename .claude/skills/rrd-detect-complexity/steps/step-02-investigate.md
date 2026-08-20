---
name: 'step-02-investigate'
description: 'Find complexity hotspots via the graph precomputed properties, confirm by reading source'
nextStepFile: '{skill-root}/steps/step-03-report-and-propose.md'
---

# Step 2: Investigate

## SEQUENCE

### 1. Query Complexity Hotspots — Multiple Axes

Run `query_graph` for precomputed complexity properties. A single ORDER BY misses hotspots that only rank high on one axis — run at least these three:

```cypher
MATCH (f:Function|Method) WHERE f.complexity IS NOT NULL
RETURN f.qualified_name, f.complexity, f.cognitive, f.loop_depth, f.transitive_loop_depth,
       f.linear_scan_in_loop, f.alloc_in_loop, f.param_count, f.max_access_depth,
       f.recursive, f.recursion_in_loop, f.unguarded_recursion
ORDER BY f.complexity DESC LIMIT 20
```

Repeat ordered by `f.cognitive DESC` and by `f.transitive_loop_depth DESC`. Then run a targeted filter query for correctness/perf risks a complexity sort alone would miss:

```cypher
MATCH (f:Function|Method) WHERE f.linear_scan_in_loop >= 1 OR f.unguarded_recursion = true
RETURN f.qualified_name, f.linear_scan_in_loop, f.unguarded_recursion, f.recursion_in_loop
```

Apply `{complexity_thresholds}` to filter candidates (defaults in `detect-complexity.md`).

### 2. Read Source and Confirm

For every candidate crossing a threshold, call `get_code_snippet` and read the actual code. Identify the concrete pattern driving the number (e.g. repeated near-identical blocks, a nested scan, an unguarded base case) — do not write a finding from the metric alone.

### 3. Check Cross-Detector Corroboration

For each confirmed candidate, note whether the same `affected_target` was also flagged by another detector family this run (or in a prior finding the owner shares). If so, record this explicitly — it materially strengthens the finding per `evidence-fusion-heuristics.md`'s cross-family corroboration rule.

### 4. Filter Test/Fixture Code

Deprioritize findings in test files or fixtures unless the owner asked otherwise — complexity in test setup is a lower-priority problem than complexity in the code under test.

### 5. Continue

Load `./step-03-report-and-propose.md`.
