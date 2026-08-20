---
name: 'step-02b-evidence-fusion'
description: 'Apply evidence fusion to detect correlations between findings without modifying raw detector output'
nextStepFile: '{skill-root}/steps/step-02c-opportunity-engine.md'
---

# Step 2b: Evidence Fusion

## STEP GOAL

Consume the pooled findings from step-02 and identify correlations — which findings represent manifestations of the same underlying problem — without modifying the original detector output.

Output: Correlation[] (metadata linking findings), plus preserved Finding[] (unchanged).

## STEP CONTEXT

Load these knowledge fragments:
- `finding-and-correlation-model.md` (data structures)
- `evidence-fusion-heuristics.md` (rules for detecting each correlation type)

## PREREQUISITE ARTIFACTS

Before starting this step, verify:
- [ ] `{project-root}/.refactor-radar-work/findings.json` exists and is valid JSON (from step-02)
- [ ] Contains at least 1 Finding with required fields
- If either check fails, **HALT**. Step-02 did not complete successfully. Do not proceed.

## SEQUENCE

### 0. Load Inputs

Read findings from step-02 output:
```bash
read {project-root}/.refactor-radar-work/findings.json → Finding[]
```

**Critical:** File must exist. If missing, halt with error: "Missing findings.json from step-02 — that step did not complete successfully."

### 1. Preserve Raw Findings

Take the Finding[] from the JSON file (DD, DI, DT, DU combined).

**Do not modify them.**

Keep them in memory for correlation detection.

### 2. Initialize Correlation Detection

For each pair of findings (A, B), attempt to detect a correlation by evaluating rules in order:

#### Strong Correlations (Try First)

**Rule: Same Target + Graph Relationship**
- Check: `A.affected_target == B.affected_target`
- If yes: query `search_graph(qualified_name={target})` to confirm it is a single entity.
- If yes: call `trace_path({target}, mode=calls)` to check if both findings' lines are in the same call chain.
- If yes: **Mark as STRONG correlation.**
  ```
  Correlation {
    finding_ids: [A.id, B.id],
    strength: "strong",
    evidence: {
      shared_target: A.affected_target,
      graph_relationships: ["direct call path confirmed"],
      root_cause_overlap: null,
      code_path_intersection: "both in call chain",
      execution_evidence: null,
      semantic_relationship: null
    },
    reasoning: "Same target with direct graph relationship"
  }
  ```

**Rule: Same Target + Same Root Cause Signal**
- Check: `A.affected_target == B.affected_target`
- Check: intersection of `A.root_cause_signals` and `B.root_cause_signals` is non-empty
- If yes: **Mark as STRONG correlation.**
  ```
  Correlation {
    finding_ids: [A.id, B.id],
    strength: "strong",
    evidence: {
      shared_target: A.affected_target,
      graph_relationships: null,
      root_cause_overlap: "shared signal(s)",
      code_path_intersection: null,
      execution_evidence: null,
      semantic_relationship: null
    },
    reasoning: "Same target with shared root cause"
  }
  ```

**Rule: Execution Evidence Co-occurrence**
- If `ingest_traces()` has been called (execution logs available):
  - Parse logs for failures involving both A and B
  - Look for: same test run, time-adjacent failures (within 2 seconds)
  - If found: **Mark as STRONG correlation.**
  ```
  Correlation {
    finding_ids: [A.id, B.id],
    strength: "strong",
    evidence: {
      shared_target: null,
      graph_relationships: null,
      root_cause_overlap: null,
      code_path_intersection: null,
      execution_evidence: "co-occurrence in test run {run_id} at {timestamp}",
      semantic_relationship: null
    },
    reasoning: "Both triggered in same test failure; likely cascade"
  }
  ```

#### Medium Correlations (Try If No Strong Match)

**Rule: Same Component**
- Check: extract component name from `A.affected_target` and `B.affected_target`
- If components match: **Mark as MEDIUM correlation.**
  ```
  Correlation {
    finding_ids: [A.id, B.id],
    strength: "medium",
    evidence: {
      shared_target: component_name,
      graph_relationships: null,
      root_cause_overlap: null,
      code_path_intersection: null,
      execution_evidence: null,
      semantic_relationship: null
    },
    reasoning: "Same component, but no direct graph relationship"
  }
  ```

**Rule: Graph Neighbors**
- Check: different targets
- Call `trace_path({A.affected_target}, {B.affected_target}, mode=calls)`
- If direct edge exists (caller/callee, import, data dependency): **Mark as MEDIUM correlation.**
  ```
  Correlation {
    finding_ids: [A.id, B.id],
    strength: "medium",
    evidence: {
      shared_target: null,
      graph_relationships: ["edge type: {type}"],
      root_cause_overlap: null,
      code_path_intersection: null,
      execution_evidence: null,
      semantic_relationship: null
    },
    reasoning: "{A.affected_target} → {B.affected_target} graph dependency"
  }
  ```

**Rule: Same Root-Cause Family**
- Check: `A.detector_family == B.detector_family` (both same detector)
- Check: intersection of `A.root_cause_signals` and `B.root_cause_signals` is non-empty
- Check: `A.affected_target != B.affected_target` (different components)
- If all yes: **Mark as MEDIUM correlation.**
  ```
  Correlation {
    finding_ids: [A.id, B.id],
    strength: "medium",
    evidence: {
      shared_target: null,
      graph_relationships: null,
      root_cause_overlap: "shared signal(s)",
      code_path_intersection: null,
      execution_evidence: null,
      semantic_relationship: null
    },
    reasoning: "Both {detector_family} findings with {shared_signal}; systemic pattern"
  }
  ```

#### Weak Correlations (Last Resort, Non-Grouping)

**Rule: Semantic Similarity Only**
- Check: no Strong or Medium correlation triggered
- Compute semantic similarity (embedding cosine or text similarity)
- If similarity > 0.7 and no other rule applies:
  - **Record as WEAK correlation but do not group.**
  - Note: Weak correlations are hints, not evidence. Opportunity Engine may reference them.
  ```
  Correlation {
    finding_ids: [A.id, B.id],
    strength: "weak",
    evidence: {
      shared_target: null,
      graph_relationships: null,
      root_cause_overlap: null,
      code_path_intersection: null,
      execution_evidence: null,
      semantic_relationship: "similarity: 0.82"
    },
    reasoning: "Semantic similarity only; no structural evidence"
  }
  ```

### 3. Output Constraints

**Do:**
- Output both Finding[] (raw, unchanged) and Correlation[] (new metadata)
- Include `confidence_justification` in each Correlation explaining why this strength
- Record `triggered_rules` (which rule(s) fired) for audit

**Do NOT:**
- Modify any Finding from step-02
- Create Opportunity[] (that is Phase 3)
- Use semantic similarity alone to create Strong/Medium correlations
- Cascade correlations (A↔B and B↔C does not imply A↔C)


### 5. Output Debug Summary

Include in the workflow output:
- Total findings: {count}
- Strong correlations: {count} (list finding_ids for each)
- Medium correlations: {count} (list finding_ids for each)
- Weak correlations: {count} (list finding_ids for each)
- Standalone findings (no correlation): {count}

### 6. Write Correlations

Serialize correlations to JSON for Phase 3 processing:
```bash
write {project-root}/.refactor-radar-work/correlations.json [Correlation[]]
```

Correlation[] must include all detected correlations (Strong, Medium, Weak), sorted by strength.

## ⚠️ CRITICAL CHECKPOINT: BEFORE PROCEEDING TO STEP-02C

**Do not skip this validation. Do not proceed without confirming all of the below.**

Verify:
- [ ] File exists: `{project-root}/.refactor-radar-work/correlations.json`
- [ ] File is valid JSON
- [ ] Every correlation has: `finding_ids`, `strength` (one of: strong, medium, weak), `evidence`, `reasoning`
- [ ] All `finding_ids` referenced in correlations exist in the original `findings.json` (no orphaned references)
- [ ] Correlations are sorted by strength (strong first, weak last)

If any validation fails, **HALT**. Do not proceed to step-02c. Report the failure and ask for re-run.

If all validations pass, report:
```
Step 02b complete: {num_strong} strong, {num_medium} medium, {num_weak} weak correlations written to correlations.json
Ready to proceed to step-02c (Opportunity Engine)
```

### 7. Continue

Load and proceed to `./step-02c-opportunity-engine.md`.
