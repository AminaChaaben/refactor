---
name: 'step-02-investigate'
description: 'Find structurally similar code via the graph'
nextStepFile: '{skill-root}/steps/step-03-report-and-propose.md'
---

# Step 2: Investigate

## SEQUENCE

### 1. Query SIMILAR_TO First

Run `query_graph` for the graph's own precomputed similarity edges before doing anything else:

```cypher
MATCH (a)-[r:SIMILAR_TO]->(b) RETURN a.qualified_name, b.qualified_name, r.jaccard, r.same_file ORDER BY r.jaccard DESC
```

This is exact, graph-computed evidence — not an estimate. Apply `{similarity_threshold}` against `jaccard` (default: treat >=0.9 as near-certain, 0.7-0.9 as a real candidate worth investigating, below 0.7 as a hint only).

### 2. Fallback Search for Uncovered Areas

If the owner is asking about a specific area with no `SIMILAR_TO` coverage, or duplication takes a shape the similarity model doesn't capture (e.g. same responsibility, different structure), fall back to `search_graph`/`query_graph` for graph-similar functions/classes — same call pattern or data-flow structure, even if the code has drifted slightly.

### 3. Read Source and Confirm

For every candidate group (from either step), call `get_code_snippet` on each member and read the actual code before treating it as a finding. A high jaccard score or a matched call pattern tells you where to look, not that the duplication is real or worth fixing — confirm by reading, especially for scores near the 0.7-0.9 boundary or short/boilerplate-heavy functions where high similarity can be coincidental.

### 4. Group and Score

Group confirmed matches into duplicate groups, each with its similarity score (jaccard if available, otherwise the estimated pattern match) and the files/symbols involved.

### 5. Continue

Load `./step-03-report-and-propose.md`.
