---
name: 'step-03-rank-and-report'
description: 'Write diff proposals for findings and render HTML report with opportunities as primary view'
nextStepFile: null
---

# Step 3d: Report Rendering

## STEP GOAL

Render the final HTML audit report with **opportunities as the primary view** and **findings as supporting evidence**. Write diff proposals for every finding. Summarize to the user.

## STEP CONTEXT

Load knowledge fragment:
- `opportunity-and-impact-model.md` (Opportunity structure reference)

Input:
- Finding[] (raw, unchanged)
- Opportunity[] (from step-02e, ranked by priority)

Output:
- Diff proposal files for each finding in `{target_project}/proposals/`
- Single HTML report with opportunities as primary: `{target_project}/proposals/refactor-radar-audit-{date}.html`
- Summary message to user in `{communication_language}` (Ray's voice)

## PREREQUISITE ARTIFACTS

Before starting this step, verify:
- [ ] `{project-root}/.refactor-radar-work/findings.json` exists (from step-02)
- [ ] `{project-root}/.refactor-radar-work/opportunities.json` exists and is sorted by priority.score (descending) with rank assigned (from step-02e)
- [ ] Each opportunity has all fields: id, title, description, priority.score, priority.level, priority.justification, impact, risk, effort, confidence, supporting_findings, affected_components
- If any check fails, **HALT**. A prior step did not complete successfully. Do not proceed.

## SEQUENCE

### 0. Load Inputs

Read final data from prior phases:
```bash
read {project-root}/.refactor-radar-work/findings.json → Finding[]
read {project-root}/.refactor-radar-work/opportunities.json → Opportunity[]
```

**Critical:** Both files must exist and be valid JSON. If either is missing or invalid, halt with error: "Missing or invalid findings.json or opportunities.json — prior steps did not complete successfully."

Verify opportunities list is **sorted by priority.score (descending)** and **has rank assigned**.

### 1. Write Diff Proposals

For every Finding in Finding[]:
- Generate a reviewable unified diff proposing the fix
- Write to `{target_project_root}/proposals/{affected_target}.{finding_id}.patch`
- Include rationale header (why this fix, what evidence supports it)

**Same as individual detectors would do; no change from prior phases.**

### 1b. Compute Trend Against Prior Run (If One Exists)

Check `{rrd_artifacts}/audit-history/{target_project}.json` (a small array of `{date, opportunity_ids: [...], priority_by_id: {...}}` snapshots, one per prior run — create the file and directory if this is the first run, in which case there's no trend to compute yet). If a prior snapshot exists:

- **Closed**: opportunity IDs in the prior snapshot not present in this run's `Opportunity[]` — these were fixed or otherwise resolved since last time. If this run was **incremental** (per Step 1's scope decision), don't count an opportunity as "closed" solely because its files were outside this run's scope — only count it closed if either the prior run was also full-scope-comparable, or the opportunity's affected files were actually inside this run's changed-file set and simply didn't reappear.
- **New**: opportunity IDs in this run not present in the prior snapshot.
- **Regressed**: opportunity IDs present in both, where this run's `priority.score` is higher than the prior run's recorded score for the same ID.
- **Unchanged**: present in both with the same or lower score.

Append this run's snapshot to the history file (don't overwrite prior entries — the file is a running log, capped at the last 20 entries to avoid unbounded growth; drop the oldest when appending the 21st).

If no prior snapshot exists, state plainly that this is the first tracked run — no trend to report — rather than fabricating a 0/0/0 breakdown that implies a comparison happened.

### 2. Prepare Report Data

From Opportunity[]:
```
For report rendering, compute:
  - Total opportunity count: {num}
  - Breakdown by priority: Critical={count}, High={count}, Medium={count}, Low={count}
  - Total findings referenced: {sum of all supporting_findings across opportunities}
  - Execution evidence summary: {num_with_real_failures} opportunities backed by execution logs
```

### 3. Render HTML Report (Opportunity-First Structure)

Using `{skill-root}/audit-report-template.html` as the base structure, render the final self-contained HTML report with:

#### 3a. Header and Executive Summary
```html
<h1>🔍 Refactor Radar Audit Report</h1>
<div class="meta">
  Project: {target_project}
  Generated: {date}
  Opportunities: {total_count}
  Findings: {total_finding_count}
</div>

<div class="executive-summary">
  <h2>Executive Summary</h2>
  <p>{total_count} refactoring opportunities identified across {num_families} root-cause families.</p>
  {% if prior_snapshot_exists %}
  <p class="trend">Since last run ({prior_run_date}): {closed_count} closed, {new_count} new, {regressed_count} regressed.</p>
  {% else %}
  <p class="trend">First tracked run for this project — no trend to report yet.</p>
  {% endif %}
  
  <table class="summary-table">
    <tr>
      <th>Priority</th>
      <th>Count</th>
      <th>Avg Impact</th>
      <th>Avg Confidence</th>
    </tr>
    <tr>
      <td>Critical</td>
      <td>{count}</td>
      <td>{avg_impact}%</td>
      <td>{avg_confidence}%</td>
    </tr>
    ... (High, Medium, Low)
  </table>
</div>
```

#### 3b. Top Opportunities Ranked List
```html
<section class="opportunities">
  <h2>Refactoring Opportunities (Ranked by Priority)</h2>
  
  <table class="opportunity-table">
    <tr>
      <th>Rank</th>
      <th>Opportunity</th>
      <th>Priority</th>
      <th>Impact</th>
      <th>Risk</th>
      <th>Effort</th>
      <th>Affected</th>
    </tr>
    
    {% for opp in opportunities sorted by priority %}
    <tr class="priority-{opp.priority.level}">
      <td>{opp.metadata.rank}</td>
      <td><a href="#{opp.id}">{opp.title}</a></td>
      <td>{opp.priority.level}</td>
      <td>{opp.impact.direct.count} direct + {opp.impact.transitive.weighted_high_confidence} transitive</td>
      <td>{opp.risk.level}</td>
      <td>{opp.effort.refactor_scope}</td>
      <td>{len(opp.affected_components.tests)} tests</td>
    </tr>
    {% endfor %}
  </table>
</section>
```

#### 3c. Detailed Opportunity Sections
```html
<section class="opportunity-details" id="{opp.id}">
  <h2>#{opp.metadata.rank}: {opp.title}</h2>
  
  <div class="opportunity-header">
    <span class="priority-badge {opp.priority.level}">{opp.priority.level}</span>
    <span class="metric">Impact: {opp.impact.direct.count} direct, {opp.impact.transitive.weighted_high_confidence} high-confidence transitive</span>
    <span class="metric">Risk: {opp.risk.level}</span>
    <span class="metric">Effort: {opp.effort.refactor_scope}</span>
    <span class="metric">Confidence: {opp.confidence.overall}%</span>
  </div>
  
  <div class="problem-statement">
    <h3>Problem</h3>
    <p>{opp.problem_statement}</p>
    <p>{opp.description}</p>
  </div>
  
  <div class="affected-components">
    <h3>Affected Components</h3>
    <ul>
      <li>Files: {opp.affected_components.files}</li>
      <li>Classes: {opp.affected_components.classes}</li>
      <li>Methods: {opp.affected_components.methods}</li>
      <li>Tests: {opp.affected_components.tests}</li>
      <li>Direct Impact: {opp.impact.direct.count} callers</li>
      <li>Transitive Impact: {opp.impact.transitive.weighted_high_confidence} high-confidence nodes</li>
    </ul>
  </div>
  
  <div class="supporting-findings">
    <h3>Supporting Findings</h3>
    <ul>
      {% for finding in opp.supporting_findings %}
      <li>
        <strong>{finding.id} ({finding.detector_family})</strong>
        <p>{finding.title}</p>
        <p class="evidence">{finding.evidence}</p>
        <p class="proposal-link">
          <a href="../{finding.affected_target}.{finding.id}.patch">View proposed diff</a>
        </p>
      </li>
      {% endfor %}
    </ul>
  </div>
  
  <div class="recommendation">
    <h3>Recommendation</h3>
    <p>{opp.recommendation.action}</p>
    <p class="impact-estimate">
      Estimated reduction: {opp.recommendation.estimated_reduction}
      ({opp.recommendation.tests_affected} tests affected by this refactoring)
    </p>
  </div>
  
  <div class="priority-calculation">
    <h3>Priority Calculation</h3>
    <p>{opp.priority.justification}</p>
  </div>
</section>
```

#### 3d. Footer with Legend
```html
<footer>
  <h3>Legend</h3>
  <dl>
    <dt>Direct Impact</dt>
    <dd>Immediate callers/dependencies of the affected component.</dd>
    <dt>Transitive Impact</dt>
    <dd>Reachable components via 2-3 hops in the call graph, weighted by distance and relationship type.</dd>
    <dt>High-Confidence</dt>
    <dd>Transitive nodes with weight ≥0.8 OR high centrality OR execution evidence.</dd>
    <dt>Priority Formula</dt>
    <dd>raw_score = (impact × confidence_ratio) / (effort × risk), confidence_ratio is 0-1. The 0-100 score shown normalizes raw_score against this report's own min/max raw_score — priority is relative to this run, not an absolute scale.</dd>
  </dl>
</footer>
```

### 4. Write Report to Disk

```
filename = f"{rrd_artifacts}/refactor-radar-audit-{target_project_slug}-{date}.html"
write HTML to filename (self-contained, inline CSS, no external assets)
```

### 5. Summarize to User

Report in Ray's voice (terse, evidence-led):

```
🔍 Audit complete: {target_project}

Summary:
  Findings: {total_findings} across {num_families} root-cause families
  Opportunities: {total_opportunities} refactoring initiatives
  Trend: {closed_count} closed, {new_count} new, {regressed_count} regressed since {prior_run_date} (or "first tracked run" if none)
  Scope: {full or "incremental — N files changed since <sha>"}
  
By Priority:
  Critical: {count} (fix immediately)
  High: {count} (prioritize)
  Medium: {count} (consider)
  Low: {count} (defer)

Top Opportunity:
  #{opp.metadata.rank} {opp.title}
  Priority: {opp.priority.level}
  Impact: {opp.impact.direct.count} direct + {opp.impact.transitive.weighted_high_confidence} transitive
  Confidence: {opp.confidence.overall}%
  {opp.recommendation.estimated_reduction}

Report: {report_path}
Diffs: {proposal_folder}
```

If this run found 3 or more occurrences of the same gap type across different files within any single detector family, mention that as a one-line note before ending: "{gap_type} recurred {n} times — worth an `rrd-standards-audit` pass to check whether that needs a written convention." Do not invoke `rrd-standards-audit` — only surface it as a suggestion; the owner decides whether to run it.

### 6. Quality Gates

Before completing, verify:
- [ ] All Finding[] have corresponding diff proposal files written
- [ ] HTML report contains all Opportunity[] in rank order
- [ ] Each opportunity shows supporting findings with evidence links
- [ ] Proposal links are relative paths (work from any location)
- [ ] Report is self-contained (no external CSS/JS)
- [ ] Styling is mobile-friendly (viewport meta tag, responsive layout)

### 7. Quality Gates

Before finalizing, verify:
- [ ] All Finding[] have corresponding diff proposal files in `{target_project_root}/proposals/`
- [ ] HTML report exists at the expected path and is valid HTML
- [ ] HTML contains all Opportunity[] in priority rank order (Critical → Low)
- [ ] Each opportunity shows supporting findings with evidence links (relative paths)
- [ ] Report is self-contained (no external CSS/JS, all styles inlined)
- [ ] Proposal links in the report are relative paths and work from any location

If any check fails, **HALT**. Do not clean up intermediate files. Report the failure.

If all checks pass, report:
```
Step 03 complete: {num_diffs} diffs written, HTML report generated at {report_path}
All quality gates passed. Ready to cleanup and complete workflow.
```

### 8. Cleanup

Remove intermediate work files:
```bash
rm -rf {project-root}/.refactor-radar-work/
```

This deletes findings.json, correlations.json, opportunities.json (now all data is in the HTML report and diffs).

**Optional:** Keep intermediate files for debugging/audit trail if desired — only delete if quality gates all passed.

---

## ⚠️ FINAL WORKFLOW VALIDATION

Before declaring the workflow complete, verify:
- [ ] All 7 steps (01-03, with 02b-02e) have completed in sequence without skips
- [ ] No step was skipped or combined with another
- [ ] Every checkpoint and quality gate was validated (not bypassed)
- [ ] Intermediate artifact files (findings.json, correlations.json, opportunities.json) were written and validated at each step
- [ ] Final HTML report and diffs exist in `{target_project_root}/proposals/`
- [ ] User received a summary message in Ray's voice

**Workflow complete.** All 7 steps (01-03, with 02b-02e) have executed successfully without skipping the documented algorithm. Opportunities-first HTML report written to proposals/. Diffs written. Summary reported to user.

`rrd-standards-audit` is a separate, owner-invoked follow-up workflow — it reads this run's report as its evidence base but is never invoked automatically from here.
