---
name: 'step-02c-opportunity-engine'
description: 'Group correlated findings into higher-level refactoring opportunities'
nextStepFile: '{skill-root}/steps/step-02d-impact-analysis.md'
---

# Step 2c: Opportunity Engine

## STEP GOAL

Transform Correlation[] into Opportunity[]. Each opportunity is a coherent refactoring scope that aggregates multiple findings.

## STEP CONTEXT

Load these knowledge fragments:
- `opportunity-and-impact-model.md` (Opportunity structure)
- `opportunity-grouping-and-impact-heuristics.md` (Part 1: Opportunity Grouping Algorithm)

Input: 
- Finding[] (raw, from step-02)
- Correlation[] (from step-02b)

Output:
- Opportunity[] (one or more groupings of findings)

## SEQUENCE

### 0. Load Inputs

Read from prior steps:
```bash
read {project-root}/.refactor-radar-work/findings.json → Finding[]
read {project-root}/.refactor-radar-work/correlations.json → Correlation[]
```

Verify both files exist. If missing, halt with error: "Missing findings.json or correlations.json"

### 1. Validate Inputs

Confirm that Correlation[] and Finding[] are both available.
- Total findings: {count}
- Total correlations: {count}
- Finding IDs in correlations must exist in Finding[]

### 2. Initialize Union-Find Structure

Create a Union-Find (disjoint set union) data structure with one entry per finding:

```
for each finding in Finding[]:
  UnionFind.make_set(finding.id)
```

### 3. Process Strong Correlations

For each Correlation with `strength == "strong"`:
```
finding_ids = correlation.finding_ids  # e.g., ["DI-014", "DU-032"]

for i in 0 to len(finding_ids)-1:
  for j in i+1 to len(finding_ids)-1:
    UnionFind.union(finding_ids[i], finding_ids[j])
```

**Effect:** All findings in a strong correlation are grouped together.

### 4. Process Medium Correlations

For each Correlation with `strength == "medium"`:

**Check:** Do the two findings already share the same `affected_target`?
- If yes: `UnionFind.union()` (join their components)
- If no: Consider the rule below

**Rule:** If findings are graph neighbors (direct import/call dependency) AND already grouped through other correlations, keep them grouped.
- This is implicit in Union-Find: if A↔B (strong) and B↔C (medium, graph neighbors), then A and C end up in the same component through transitivity.
- Do not explicitly force union; let transitive closure work.

**Result:** Medium correlations within the same component stay grouped; isolated medium correlations may remain separate.

### 5. Do NOT Process Weak Correlations

Weak correlations are not sufficient for grouping. They are kept as metadata (hints) for later use in impact analysis, but do not trigger union.

### 6. Extract Components

Query Union-Find for all disjoint sets:

```
components = UnionFind.get_all_components()

Example:
  Component 1: {DI-014, DU-032, DI-089}
  Component 2: {DT-045, DU-117}
  Component 3: {DI-102}  (standalone)
```

### 7. Validate Component Size

For each component:
- If size > 15 findings: log a warning and consider splitting by root-cause family or affected_target
- If size == 1: This is a standalone finding (may still be an opportunity, but non-grouped)

### 8. Create Opportunity Objects

For each component, create an Opportunity:

```
for each component in components:
  opp = Opportunity {
    id: f"OPP-{index+1:03d}",
    title: (infer from findings, see Rule below)
    description: (synthesize from all finding descriptions),
    problem_statement: (common root cause(s)),
    supporting_findings: [findings in component],
    correlations: [correlations that connected this component],
    root_causes: {
      primary: most common root_cause_signal,
      secondary: other root_cause_signals in component
    },
    affected_components: (will be populated by step-02d),
    impact: (will be populated by step-02d),
    risk: (will be populated by step-02d),
    confidence: (will be populated by step-02d),
    effort: (will be populated by step-02d),
    priority: (will be populated by step-02e),
    recommendation: (synthesize from finding recommendations),
    metadata: {
      created_at: now(),
      phase_3_run: run_id
    }
  }
```

### 9. Title Inference Rule

Infer the opportunity title from the findings:

```
if all findings share affected_target:
  title = f"{affected_target}: {inferred_action}"
  # Example: "LoginPage: Stabilize interaction layer"
  
elif all findings share root_cause:
  title = f"{root_cause} refactoring: {affected_components}"
  # Example: "Eliminate duplication: TestDataFactory, AuthFixture"
  
else:
  title = f"Refactor {primary_root_cause} across {num_components} components"
  # Example: "Refactor fragile selectors across 5 test files"
```

### 10. Description Synthesis

Combine finding descriptions into a cohesive paragraph:

```
problem: "{problem_statement}"

findings support this:
  - DI-014: {description}
  - DU-032: {description}
  - ...

combined effect: (explain how these are related and why fixing together is important)
```

### 11. Recommendation Synthesis

Merge finding recommendations:

```
recommendation.action = (combine improvement actions)
recommendation.affected_areas = [union of all affected files]
recommendation.estimated_reduction = (sum of line estimates)
```

### 12. Output Debug Information

Log:
```
Opportunity Engine Complete:
  Input: {num_findings} findings, {num_correlations} correlations
  Output: {num_opportunities} opportunities
  Breakdown: 
    - {count} opportunities with > 2 findings (grouped)
    - {count} opportunities with 1 finding (standalone)
  
  Component sizes:
    - Largest: {size} findings
    - Average: {avg_size} findings
```

### 13. Write Opportunities

Serialize grouped opportunities to JSON:
```bash
write {project-root}/.refactor-radar-work/opportunities.json [Opportunity[]]
```

Opportunity[] structure per DATA_FLOW.md. Include all synthesized fields (title, description, problem_statement, supporting_findings, correlations, root_causes, recommendation).

**Do NOT yet include** impact metrics, risk, effort, confidence, priority (those are added by step-02d and 02e).

### 14. Continue

Load and proceed to `./step-02d-impact-analysis.md`.

---

## Design Principles Enforced

- **Conservative grouping:** Only Strong correlations guarantee grouping; Medium correlations require additional evidence.
- **Transparent:** Each opportunity records which correlations created it.
- **Coherent scope:** Each opportunity has a clear refactoring focus.
- **Non-cascading:** Union-Find ensures A↔B + B↔C → A,B,C in same opportunity (transitive closure), but only when justified by correlations.
