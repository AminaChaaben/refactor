# Phase 1+2: Evidence Fusion Implementation

## Summary

Added evidence fusion to the Refactor Radar audit-all workflow. Raw findings from DD/DI/DT/DU detectors are now analyzed for correlations — relationships indicating that multiple findings represent manifestations of the same underlying problem.

**Key design principle: Conservative over aggressive.** Correlations require structural evidence; semantic similarity alone is insufficient.

---

## What's Built

### Phase 1: Data Model

**New knowledge fragment:** `finding-and-correlation-model.md`

Defines:
- **Finding** — raw detector output (unchanged from DD/DI/DT/DU)
- **Correlation** — metadata linking 2+ findings with strength (Strong/Medium/Weak) and explicit evidence
- **CorrelatedFinding** — internal representation, not a permanent domain object
- **Correlation Confidence Hierarchy**:
  - **Strong**: same target + graph relationship OR same target + root cause OR execution co-occurrence
  - **Medium**: same component OR graph neighbor OR same root-cause family
  - **Weak**: semantic similarity only (non-grouping, hints only)

### Phase 2: Evidence Fusion Rules

**New knowledge fragment:** `evidence-fusion-heuristics.md`

Implements correlation detection:
- **6 rules** for Strong correlations (graph-backed structural evidence)
- **3 rules** for Medium correlations (component/family proximity)
- **1 rule** for Weak correlations (semantic similarity, non-grouping)
- **Constraints**: no cascading (A↔B + B↔C ≠ A↔C), semantic similarity never creates correlations alone, false negatives preferred to false positives

### New Workflow Step

**New step file:** `step-02b-evidence-fusion.md`

Inserted into audit-all pipeline:
```
step-02: Run Detectors
    ↓ Finding[]
step-02b: Evidence Fusion (NEW)
    ↓ Correlation[] + Finding[] (raw, preserved)
step-03: Rank and Report
```

**Responsibility:**
- Take Finding[] from step-02 (all detectors pooled)
- Evaluate each finding pair against correlation rules in order
- Output Correlation[] (linking findings that meet Strong/Medium criteria)
- **Preserve raw Finding[] unchanged**
- Generate debug output: Strong count, Medium count, Weak count, standalone count

---

## Acceptance Criteria Met

✅ Existing DD/DI/DT/DU detectors continue working unchanged
✅ Raw findings remain available (not modified)
✅ step-02b consumes findings without detector-specific hardcoding
✅ Correlations have explicit evidence and strength
✅ False correlations avoided (semantic similarity alone insufficient)
✅ No opportunity ranking happens yet
✅ No impact analysis happens yet
✅ No source code is modified
✅ Current Audit All report still works (correlation metadata as optional debug output)

---

## Example: LoginPage Correlation

Raw findings from detectors:
```
DI-014: LoginPage.java, line 47
  title: "Duplicated wait-for-element"
  root_cause_signals: ["fragile_selector", "duplicated_logic"]

DU-032: LoginPage.java, line 82
  title: "Duplicated interaction implementation"
  root_cause_signals: ["redundancy", "duplicated_logic"]
```

Evidence Fusion detects:
```
Correlation {
  finding_ids: ["DI-014", "DU-032"],
  strength: "strong",
  evidence: {
    shared_target: "LoginPage.java",
    graph_relationships: ["LoginPage.login() → LoginPage.authenticateUser() (direct call)"],
    root_cause_overlap: "duplicated_logic",
    code_path_intersection: "both in login flow",
    execution_evidence: null,
    semantic_relationship: null
  },
  reasoning: "Same class with shared 'duplicated_logic' signal and confirmed call path; both represent interaction-layer duplication",
  metadata: {
    fusion_phase_run: "2026-08-10T14:30:00Z",
    triggered_rules: ["Same Target + Root Cause Overlap", "Same Target + Graph Relationship"],
    confidence_justification: "Strong because multiple independent rules fired"
  }
}
```

---

## What's Next (Phase 3)

After Phase 1+2 is validated, Phase 3 will:
- **Opportunity Engine**: group Correlation[] into Opportunity[] (one opportunity can contain multiple correlated findings)
- **Impact Analysis**: traverse the dependency/call graph to calculate affected components, blast radius, and weighted transitive impact
- **Ranking**: prioritize opportunities by impact, risk, confidence, effort
- **Report**: restructure HTML to make Opportunity the primary view, Findings the drill-down evidence

---

## How to Verify Phase 1+2

1. **Run audit-all** against any project (test suite or otherwise):
   ```bash
   /rrd-agent-radar → [dispatch to] /rrd-audit-all
   ```

2. **Check output:**
   - Existing findings report is generated (HTML with same structure as before)
   - New correlation metadata appears in debug section
   - Raw findings are unchanged (can diff against prior run)

3. **Inspect correlations:**
   - For each Strong correlation, verify both shared_target and at least one other evidence signal
   - For each Medium correlation, verify same component or graph edge
   - For each Weak correlation, verify no Strong/Medium rule triggered (semantic similarity only)

4. **Debug counts in terminal output:**
   ```
   Evidence Fusion Complete:
     Raw findings: 47
     Strong correlations: 3
     Medium correlations: 7
     Weak correlations: 2
     Standalone findings: 35
   ```

---

## Code Changes Summary

**Modified files (both `skills/` authoring and `.claude/skills/` installed):**
- `rrd-audit-all/workflow-plan.md` — added step-02b
- `rrd-audit-all/steps/step-02-run-detectors.md` — nextStepFile now points to step-02b
- `rrd-audit-all/resources/rrd-index.csv` — added two new fragment entries

**New files:**
- `rrd-audit-all/steps/step-02b-evidence-fusion.md` — the evidence fusion engine
- `rrd-audit-all/resources/knowledge/finding-and-correlation-model.md` — Phase 1 data model
- `rrd-audit-all/resources/knowledge/evidence-fusion-heuristics.md` — Phase 2 rules

**No changes to detectors (DD/DI/DT/DU).** Their output is consumed as-is.

---

## Design Principles Applied

1. **Layered reasoning:** Detectors → Fusion → Opportunities → Impact → Prioritization (later phases)
2. **Conservative over aggressive:** Better to miss a correlation than create a false one
3. **Evidence-driven:** Every grouping decision is justified and traceable
4. **Immutable raw data:** Original findings never modified, metadata is separate
5. **Explainability:** Each correlation can be explained to a human reviewer
6. **Separation of concerns:** Detectors detect; fusion layer correlates; opportunity engine groups; impact layer analyzes
