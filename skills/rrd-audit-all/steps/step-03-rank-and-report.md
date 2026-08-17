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

## SEQUENCE

### 0. Load Inputs

Read final data from prior phases:
```bash
read {project-root}/.refactor-radar-work/findings.json → Finding[]
read {project-root}/.refactor-radar-work/opportunities.json → Opportunity[]
```

Verify both files exist. If missing, halt with error: "Missing findings.json or opportunities.json from prior steps"

Opportunities must be **sorted by priority.score (descending)** and **have rank assigned**.

### 1. Write Diff Proposals

For every Finding in Finding[]:
- Generate a reviewable unified diff proposing the fix
- Write to `{target_project_root}/proposals/{affected_target}.{finding_id}.patch`
- Include rationale header (why this fix, what evidence supports it)

**Same as individual detectors would do; no change from prior phases.**

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

### 6. Quality Gates

Before completing, verify:
- [ ] All Finding[] have corresponding diff proposal files written
- [ ] HTML report contains all Opportunity[] in rank order
- [ ] Each opportunity shows supporting findings with evidence links
- [ ] Proposal links are relative paths (work from any location)
- [ ] Report is self-contained (no external CSS/JS)
- [ ] Styling is mobile-friendly (viewport meta tag, responsive layout)

### 7. Cleanup

Remove intermediate work files:
```bash
rm -rf {project-root}/.refactor-radar-work/
```

This deletes findings.json, correlations.json, opportunities.json (now all data is in the HTML report and diffs).

**Optional:** Keep for debugging/audit trail if desired.

---

**Workflow complete.** All 7 steps (01-03, with 02b-02e) have executed successfully. Opportunities-first HTML report written to proposals/. Diffs written. Summary reported to user.
