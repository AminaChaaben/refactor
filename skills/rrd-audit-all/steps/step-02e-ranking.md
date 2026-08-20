---
name: 'step-02e-ranking'
description: 'Rank opportunities by priority score and prepare for final reporting'
nextStepFile: '{skill-root}/steps/step-03-rank-and-report.md'
---

# Step 2e: Ranking

## STEP GOAL

Rank Opportunity[] by priority score. Each opportunity gets a transparent priority calculation.

## STEP CONTEXT

Load knowledge fragments:
- `opportunity-grouping-and-impact-heuristics.md` (Part 6: Priority Scoring)

Input:
- Opportunity[] (from step-02d, fully enriched with impact/risk/effort/confidence)

Output:
- Opportunity[] (sorted by priority, with priority.score and priority.level populated)

## PREREQUISITE ARTIFACTS

Before starting this step, verify:
- [ ] `{project-root}/.refactor-radar-work/opportunities.json` exists and is valid JSON (from step-02d)
- [ ] Each opportunity has `impact`, `risk`, `effort`, `confidence` (not yet priority)
- If checks fail, **HALT**. Step-02d did not complete successfully. Do not proceed.

## SEQUENCE

### 0. Load Input

Read opportunities from step-02d:
```bash
read {project-root}/.refactor-radar-work/opportunities.json → Opportunity[]
```

**Critical:** File must exist. If missing, halt with error: "Missing opportunities.json from step-02d — that step did not complete successfully."

### 1. Calculate Raw Score for Each Opportunity

**Rule:** multiplying a single/low-double-digit `impact_score` by `confidence_score` on a 0-100 scale, then dividing by small numbers (max ~6), lets confidence dominate the ratio — the raw result almost always exceeds 100 before clamping, so nearly every real opportunity lands in "Critical" regardless of actual differences in risk/effort. Avoid this by (a) using confidence as a 0-1 fraction, and (b) normalizing scores relative to the current run instead of comparing raw numbers against fixed absolute thresholds. Full rationale in `opportunity-grouping-and-impact-heuristics.md` Part 6.

For each opportunity:

```
impact_score = (direct_impact.total + weighted_high_confidence_count) × execution_evidence_weight

Where execution_evidence_weight:
  = 0.5 if no execution logs available
  = 1.0 if 1-3 flaky tests
  = 1.5 if 4+ flaky tests OR cascade failures exist

confidence_ratio = opportunity.confidence.overall / 100   # 0.0-1.0, NOT the raw 0-100 value

effort_score = {
  1-10 lines: 1.0,
  11-50 lines: 2.0,
  > 50 lines: 3.0
}[opportunity.effort.estimated_lines]

risk_factor = {
  "Low": 1.0,
  "Medium": 1.5,
  "High": 2.0
}[opportunity.risk.level]

raw_score = (impact_score × confidence_ratio) / (effort_score × risk_factor)
```

Record `raw_score` on the opportunity for now — do not clamp or bucket it yet. Priority level depends on how this opportunity's raw_score compares to every other opportunity in this run (step 2).

**Example Calculation:**
```
OPP-001 (FileOnlyLogger.write coupling):
  impact_score = (9 direct + 0 weighted transitive) × 0.5 = 4.5   [no execution logs]
  confidence_ratio = 0.86
  effort_score = 2.0 (45 lines, Strategy B occurrence-based estimate)
  risk_factor = 1.5 (Medium risk)

  raw_score = (4.5 × 0.86) / (2.0 × 1.5) = 3.87 / 3.0 = 1.29
```

Using `confidence_score=86` instead of `confidence_ratio=0.86` gives `(4.5 × 86) / 3.0 = 129`, clamped to 100/Critical regardless of this opportunity's real risk/effort — that's why confidence must be a 0-1 fraction. The correct raw_score (1.29) is not yet a priority level — it only becomes one after run-relative normalization in step 2.

### 2. Normalize Across the Run and Assign Priority Level

Priority is relative to what else this audit run surfaced, not an absolute global constant — a codebase with only minor issues shouldn't have every opportunity screaming Critical.

```
min_raw = min(raw_score across all opportunities produced this run)
max_raw = max(raw_score across all opportunities produced this run)

if max_raw == min_raw:          # only one opportunity, or all tied
  priority_score = 70           # default to High — nothing to rank it against
else:
  for each opportunity:
    priority_score = ((raw_score - min_raw) / (max_raw - min_raw)) × 100

priority_level = {
  90-100: "Critical",
  70-89: "High",
  40-69: "Medium",
  0-39: "Low"
}[priority_score]
```

Record `raw_score`, `min_raw`, and `max_raw` alongside `priority_score` on every opportunity — a reviewer needs the run-relative context, not just the final 0-100 number.

### 3. Generate Justification

For each opportunity, write a one-sentence justification. `{confidence_score}` here is the display percentage (`confidence_ratio × 100`), and the run-relative normalization must be named explicitly so a reviewer sees this isn't an absolute score:

```
template = f"""
{impact_type} impact ({direct_impact} direct, {weighted_high_confidence} high-confidence transitive)
+ {confidence_score}% confidence ({finding_consensus}% finding consensus, {evidence_strength}% evidence strength)
/ effort={effort_scope} ({estimated_lines} lines)
/ risk={risk_level}
→ raw_score={raw_score} (run range {min_raw}-{max_raw}) → Priority: {priority_level}
"""

Examples:
  "Logger coupling: 9 direct, 0 high-confidence transitive + 86% confidence / small effort / medium risk → raw_score=1.29 (run range 0.07-1.29) → Critical"
  "Test data lifecycle: 5 direct, 12 high-confidence / 68% confidence / small effort / low risk → raw_score=0.61 (run range 0.07-1.29) → High"
  "Minor selector fix: 1 direct, 1 high-confidence / 52% confidence / small effort / low risk → raw_score=0.09 (run range 0.07-1.29) → Low"
```

### 4. Sort by Priority

```
opportunities = sort(opportunities, key=lambda opp: opp.priority.score, reverse=True)
```

**Result:** Opportunities ordered from Critical to Low

### 5. Label Opportunities by Rank

```
for index, opp in enumerate(opportunities):
  opp.metadata.rank = index + 1
  # e.g., OPP-001 is rank #1 (highest priority)
```

### 6. Output Ranking Summary

Log:
```
Ranking Complete:
  Total opportunities: {count}
  
  Critical (90-100): {count}
  High (70-89): {count}
  Medium (40-69): {count}
  Low (0-39): {count}
  
  Top 5 Opportunities:
    #1 {opp.title} (score: {score}) — {opp.affected_components.tests} tests
    #2 {opp.title} (score: {score}) — {opp.affected_components.tests} tests
    ...
```

### 7. Validation Gates

Before continuing, verify:
- [ ] Every opportunity has a priority.raw_score
- [ ] Every opportunity has a priority.score (normalized 0-100) and priority.level
- [ ] min_raw/max_raw for this run are recorded on every opportunity (or a note if max_raw == min_raw)
- [ ] priority.justification is clear and traceable, and states raw_score alongside the run range
- [ ] Scores are in the 0-100 range
- [ ] List is sorted by score (descending)
- [ ] No opportunities have missing impact/risk/effort/confidence


### 9. Write Ranked Opportunities

Overwrite opportunities.json with ranking added:
```bash
write {project-root}/.refactor-radar-work/opportunities.json [Opportunity[]]
```

Opportunities must be **sorted by priority.score (descending)** with rank assigned.

## ⚠️ CRITICAL CHECKPOINT: BEFORE PROCEEDING TO STEP-03

**Do not skip this validation. Do not proceed without confirming all of the below.**

Verify:
- [ ] File `opportunities.json` has been overwritten
- [ ] Every opportunity has: `priority.raw_score`, `priority.score`, `priority.level`, `priority.justification`
- [ ] `priority.score` is between 0 and 100 (normalized against this run's min/max raw_score)
- [ ] `priority.level` is one of: Critical (90-100), High (70-89), Medium (40-69), Low (0-39)
- [ ] `priority.justification` includes raw_score, run range (min_raw-max_raw), and the calculation formula
- [ ] List is sorted by `priority.score` descending (Critical → Low)
- [ ] Every opportunity has a `metadata.rank` assigned (1, 2, 3, ...)
- [ ] No opportunities have NaN or null priority fields

If any validation fails, **HALT**. Do not proceed to step-03. Report the failure.

If all validations pass, report:
```
Step 02e complete: ranking applied to {num_opportunities} opportunities
  Critical: {count} (scores {range})
  High: {count} (scores {range})
  Medium: {count} (scores {range})
  Low: {count} (scores {range})
Ready to proceed to step-03 (Reporting)
```

### 10. Continue

Load and proceed to `./step-03-rank-and-report.md`.

---

## Design Principles

- **Transparent calculation:** Every score is derived from impact × confidence_ratio / (effort × risk), then normalized against this run's min/max.
- **Confidence is a fraction, not a percentage, inside the formula.** Using the raw 0-100 value causes score saturation (see the CALIBRATION rule above) — keep it as 0-1 in any future formula edits.
- **Priority is run-relative, not absolute.** A raw_score only becomes a priority level after comparison against every other opportunity produced in the same audit run.
- **Execution evidence breaks ties:** Two opportunities with similar structural scores are ranked by real failure evidence.
- **Effort tempering:** A refactoring touching 100 files is lower priority than one touching 10 files, even if impact is the same.
- **No magic weights:** All formula constants (0.4, 0.5, 1.5, etc.) are justified in the heuristics fragment.
