# Phase 3: Opportunity Engine + Impact Analysis

## Summary

Completed Phase 3 of the Refactor Radar audit-all pipeline. Raw findings are now transformed into **opportunities** — higher-level refactoring initiatives with calculated impact, risk, effort, and priority.

**Architecture:**
```
step-02: Run Detectors
    ↓ Finding[]
step-02b: Evidence Fusion
    ↓ Correlation[]
step-02c: Opportunity Engine
    ↓ Opportunity[] (ungrouped, with supporting findings)
step-02d: Impact Analysis
    ↓ Opportunity[] (enriched with graph traversal data)
step-02e: Ranking
    ↓ Opportunity[] (sorted by priority score)
step-03: Render Report
    ↓ HTML with opportunities as primary view
```

---

## What's Built

### Phase 3a: Opportunity Grouping (step-02c)

**Algorithm:** Union-Find connected components

Transforms correlated findings into opportunities using:
- **Strong correlations** (same target + graph/root-cause/execution evidence) → force grouping
- **Medium correlations** (same component/graph-neighbor/family) → consider grouping
- **Weak correlations** (semantic similarity only) → no grouping

**Result:** Each opportunity represents a coherent refactoring scope with 1+ findings.

**Knowledge Fragments:**
- `opportunity-and-impact-model.md` — Opportunity structure, Impact object, Priority formula
- `opportunity-grouping-and-impact-heuristics.md` (Part 1) — Union-Find algorithm, component validation

### Phase 3b: Impact Analysis (step-02d)

**Algorithm:** 2-3 hop weighted graph traversal

For each opportunity:
1. **Direct Impact** — Immediate callers/callees (fan-in, fan-out)
2. **Transitive Impact** — Reachable nodes via 2-3 hops with weighting:
   - Distance decay (hop 1: 1.0, hop 2: 0.7, hop 3: 0.4)
   - Relationship type (call: 1.0, import: 0.8, data_flow: 0.6, semantic: 0.3)
   - Usage frequency (tested heavily: 1.5x multiplier)
3. **High-Confidence Filtering** — Only nodes with weight ≥0.8 OR high centrality OR execution evidence
4. **Affected Components** — Extract files, classes, methods, tests
5. **Risk Assessment** — Blast radius (files affected) + Complexity (interconnectedness) → Risk level
6. **Effort Estimation** — Lines to change, refactor scope, regression risk
7. **Confidence Calculation** — Finding consensus + evidence strength + execution corroboration

**Key Design:**
- Prevents inflated impact: 80 transitive nodes weighted → 24 high-confidence nodes
- Execution evidence is strongest signal (real test failures)
- Every calculation is transparent and traceable

**Knowledge Fragments:**
- `opportunity-and-impact-model.md` — Impact structure, weighting formulas
- `opportunity-grouping-and-impact-heuristics.md` (Parts 2-5) — BFS traversal, weighting, filtering, risk/effort/confidence

### Phase 3c: Ranking (step-02e)

**Formula:**
```
priority_score = (impact_score × confidence_score) / (effort_score × risk_factor)

Where:
  impact_score = (direct + weighted_transitive) × execution_evidence_weight
  confidence_score = 0-100 (finding consensus + evidence strength + execution corroboration)
  effort_score = estimated lines (1.0, 2.0, or 3.0 buckets)
  risk_factor = risk level (1.0, 1.5, or 2.0)

Result: 0-100 score mapped to levels:
  90-100 → Critical
  70-89  → High
  40-69  → Medium
  0-39   → Low
```

**Outcome:** Opportunities sorted by priority, with transparent justification for each score.

### Phase 3d: Report Rendering (step-03, updated)

**To be implemented:** Restructured HTML report with:
- **Executive Summary** — Total opportunities, breakdown by priority level
- **Top Opportunities** — Ranked list with impact/risk/effort/priority visible
- **Opportunity Details** — Each opportunity shows:
  - Title, description, problem statement
  - Supporting findings (with evidence)
  - Affected components (files, classes, methods, tests)
  - Impact metrics (direct, transitive, execution evidence)
  - Risk/effort/confidence assessments
  - Priority score and justification
  - Recommendation
- **Detailed Findings** — Drill-down to individual finding evidence

---

## Data Flow Example

**Input: Raw Findings**
```
DI-014: LoginPage.java, "duplicated wait logic"
DU-032: LoginPage.java, "duplicated interaction code"
DI-089: LoginPage.java, "fragile selector"
DD-045: AuthHelper.java, "shared state coupling"
```

**After Evidence Fusion (step-02b)**
```
Correlation DI-014 ↔ DU-032: STRONG (same target + shared root-cause)
Correlation DU-032 ↔ DI-089: MEDIUM (same target)
No correlation: DD-045 (different file)
```

**After Opportunity Engine (step-02c)**
```
Component 1: {DI-014, DU-032, DI-089} → OPP-001
Component 2: {DD-045} → OPP-002
```

**After Impact Analysis (step-02d)**
```
OPP-001 (LoginPage):
  Direct impact: 3 callers
  Hop 1: 8 nodes, hop 2: 23 nodes, hop 3: 42 nodes
  Weighted high-confidence: 24 nodes
  Affected files: 2, affected tests: 7 (3 flaky)
  Risk: Medium, Effort: Medium, Confidence: 86%

OPP-002 (AuthHelper):
  Direct impact: 2 callers
  Hop 1: 5 nodes, hop 2: 12 nodes, hop 3: 31 nodes
  Weighted high-confidence: 8 nodes
  Affected files: 1, affected tests: 2
  Risk: Low, Effort: Small, Confidence: 72%
```

**After Ranking (step-02e)**
```
OPP-001 (LoginPage): score=72 → HIGH priority
OPP-002 (AuthHelper): score=45 → MEDIUM priority
```

---

## Quality Gates

All Phase 3 steps validate their outputs:

✅ **Opportunity Engine:**
- Union-Find produces connected components
- No finding appears in multiple opportunities
- Component sizes reasonable (< 15 findings, split if needed)

✅ **Impact Analysis:**
- Every opportunity has direct + transitive impact calculated
- High-confidence filtering reduces transitive count appropriately
- Affected components extracted and verified
- Risk, effort, confidence all populated
- No cycles in graph traversal

✅ **Ranking:**
- Every opportunity has priority.score and priority.level
- Scores in 0-100 range
- Sorted by score (descending)
- Justification is clear and traceable

---

## Design Principles Upheld

1. **Evidence-driven:** Every grouping decision is justified by Correlation[] data and graph relationships.
2. **Transparent:** All calculations (impact, risk, effort, confidence, priority) are documented and traceable.
3. **Conservative:** No false groupings; weighted filtering prevents inflated impact scores.
4. **Hierarchical:** Problem understanding increases through each phase (Detection → Fusion → Grouping → Impact → Ranking).
5. **Actionable:** Each opportunity includes affected components, risk level, and priority for decision-making.

---

## Next Steps

1. **Implement step-03 report rendering** — Restructure HTML to show opportunities as primary view, findings as evidence
2. **Validate end-to-end** — Run full audit-all pipeline on a test project (BMAD_cursor or jarvis)
3. **Iterate on weights** — Adjust distance_decay, relationship_type_factor, effort buckets based on real runs
4. **Plan Phase 4** — Cross-project opportunity clustering, historical trends, team-wide refactoring campaigns

---

## Files Added

**Knowledge Fragments:**
- `opportunity-and-impact-model.md` — 250 lines
- `opportunity-grouping-and-impact-heuristics.md` — 400 lines

**Workflow Steps:**
- `step-02c-opportunity-engine.md` — Grouping algorithm, Union-Find implementation
- `step-02d-impact-analysis.md` — Graph traversal, weighting, filtering, risk/effort/confidence
- `step-02e-ranking.md` — Priority scoring, level assignment

**Updated Files:**
- `step-02b-evidence-fusion.md` — nextStepFile updated to point to step-02c
- `workflow-plan.md` — Added steps 02c, 02d, 02e
- `rrd-index.csv` — Added 4 new knowledge fragment entries

**Both Locations Synchronized:**
- `/skills/rrd-audit-all/` (authoring copy)
- `/.claude/skills/rrd-audit-all/` (installed copy)
