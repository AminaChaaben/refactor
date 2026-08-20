---
name: 'validate'
description: 'Impact analysis, ranking, and report generation. Output: final HTML report + diffs.'
---

# Validate: Impact Analysis, Ranking & Report

## MODE GOAL

Take grouped opportunities from Edit mode, analyze impact, rank by false-fail risk, and produce the final consolidated HTML report. This is the full-audit endgame.

## INPUT

Read from Edit mode: `{project-root}/.refactor-radar-work/opportunities.json`

## SEQUENCE

### 1. Quality Gates — Opportunity Validation

Before proceeding, verify:
- [ ] Opportunities JSON exists and contains all grouped findings
- [ ] Every Opportunity has: title, description, problem_statement, supporting_findings array (non-empty)
- [ ] All correlations documented with strength (strong/medium/weak)
- [ ] No missing root_causes or affected_components
- [ ] No null/empty values in critical fields

If any check fails, **HALT**. Surface the issue and ask to return to Edit mode.

### 2. Impact Analysis (from step-02d)

For each Opportunity:
- Analyze graph impact: estimate false-fail risk (how many tests fail when this defect exists)
- Count affected components and call paths
- Estimate scope (isolated / moderate / codebase-wide)
- Assign risk tier (critical / high / medium / low)

Output: `{project-root}/.refactor-radar-work/opportunities-with-impact.json`

### 3. Opportunity Ranking (from step-02e)

Apply the ranking formula combining:
- False-fail impact (primary signal)
- Scope breadth (secondary signal)
- Fixing cost (low/medium/high, derived from affected_component count)
- Confidence (derived from correlation strength)

Sort opportunities by rank (descending impact).

Output: sorted opportunities with final ranking scores.

### 4. Generate HTML Report (from step-03)

Render the `audit-report-template.html` template with:
- Summary: total opportunities, breakdown by risk tier, top 3 recommended fixes
- Opportunities table: rank, title, scope, risk tier, confidence, evidence count, proposed fix count
- Detailed findings: for each opportunity in rank order, full description, supporting findings, correlations, diff proposals
- Confidence key and methodology notes

Write to: `{rrd_artifacts}/audit-report-{target_project}-{date}.html`

### 5. Write Diff Proposals

For each Opportunity's supporting findings that have a clear fix:
- Generate diffs for the proposed refactoring
- Write to `{project-root}/proposals/{finding_file}.{finding_id}.patch`

### 6. Final Quality Gate

Before finishing, verify:
- [ ] HTML report is readable and well-formed
- [ ] All opportunities are represented and ranked
- [ ] All diffs are written and linked from report
- [ ] Summary counts match the detailed section

### 7. Summarize to Owner

Report in Ray's voice (terse, evidence-led), in `{communication_language}`:

```
Audited {target_project}. Found {n} opportunities across {m} affected components.

Top 3 by impact:
1. {title} — {scope} scope, {risk_tier} risk
2. ...
3. ...

Report: {report_path}
Diffs: {proposals_folder}
```

**User workflow ends here.** The owner now has the prioritized opportunity backlog and can decide which fixes to apply via `rrd-apply-and-verify`.
