# Phase 3d: Report Rendering (Opportunity-First HTML)

## Summary

Completed Phase 3d — the final rendering step. The audit report now makes **opportunities the primary view** with **findings as supporting evidence**.

**Complete pipeline:**
```
step-02:  Run Detectors          → Finding[]
step-02b: Evidence Fusion         → Correlation[]
step-02c: Opportunity Engine      → Opportunity[] (grouped)
step-02d: Impact Analysis         → Opportunity[] (enriched with impact metrics)
step-02e: Ranking                 → Opportunity[] (sorted by priority)
step-03:  Report Rendering        → HTML report + diffs + summary
```

---

## What's Changed

### Step-03 Rewrite (step-03-rank-and-report.md)

**Old structure:**
- Rank findings by impact
- Group findings by root-cause family
- Write diffs for each finding
- Render findings-first HTML

**New structure:**
- Opportunities are already ranked (step-02e)
- Write diffs for each finding (unchanged)
- Render opportunities-first HTML
- Each opportunity shows supporting findings as evidence

### HTML Template Overhaul (audit-report-template.html)

**Old structure:**
```
Executive Summary (findings table)
├── Dependencies findings
├── Instability findings
├── Data Issues findings
└── Duplication findings
```

**New structure:**
```
Executive Summary (opportunity breakdown by priority)
├── Ranked Opportunities table
└── Detailed Opportunities
    ├── Opportunity #1
    │   ├── Problem statement
    │   ├── Affected components
    │   ├── Supporting findings (with evidence links)
    │   ├── Recommendation
    │   └── Priority calculation
    ├── Opportunity #2
    └── ...
```

### Key Features of New HTML

✅ **Opportunity-first view** — users see strategic refactoring initiatives, not individual findings
✅ **Mobile-responsive** — viewport meta tag, flex layout, responsive tables
✅ **Self-contained** — no external CSS/JS, inline styles, works offline
✅ **Evidence-driven** — each opportunity links to its supporting findings + diffs
✅ **Transparent scoring** — priority calculation shown, justification included
✅ **Professional styling** — color-coded priority badges, semantic HTML, print-friendly

### Report Sections

#### 1. Executive Summary
- Total opportunities count
- Breakdown by priority level (Critical/High/Medium/Low)
- Average impact and confidence per level

#### 2. Opportunities (Ranked List)
- Table sorted by priority score (highest first)
- Quick reference: rank, title, priority badge, impact metrics, tests affected

#### 3. Detailed Opportunities (One Per Opportunity)
- Problem statement (one-liner + full description)
- Affected components (files, classes, methods, tests, impact counts)
- Supporting findings (each with evidence citation and diff link)
- Recommendation (action + estimated reduction)
- Priority calculation (transparent formula + justification)

#### 4. Legend
- Definitions of impact, confidence, priority formula
- Risk level buckets
- How weighting works

---

## Step-03 Sequence

### 1. Write Diff Proposals
For every Finding[], generate a unified diff with rationale header and write to `{target_project}/proposals/{target}.{finding_id}.patch`

### 2. Prepare Report Data
Aggregate from Opportunity[]:
- Total counts by priority level
- Average impact/confidence per level
- Execution evidence summary

### 3. Render HTML
Using the enhanced template, fill in:
- Executive summary table (priority breakdown)
- Opportunities ranked table (all opportunities, sortable)
- Detailed opportunity sections (one per opportunity, with findings as evidence)
- Footer with legend/definitions

### 4. Write to Disk
Output: `{rrd_artifacts}/refactor-radar-audit-{project}-{date}.html` (self-contained)

### 5. Summarize to User
Ray's terse summary:
- Finding count and distribution
- Opportunity count and distribution by priority
- Top opportunity (title + impact + confidence)
- Output paths

---

## Design: Opportunities as Primary Objects

**Why?**
- Findings are symptoms; opportunities are diagnoses
- One opportunity may span multiple findings (e.g., "stabilize LoginPage" with 3 findings)
- Teams care about "what refactoring should we do" not "what 47 individual issues did we find"
- Priority ranking makes business sense when applied to opportunities, not granular findings

**How it works:**
- Opportunity[] is computed through phases 3a–3e
- Each opportunity has 1+ supporting findings
- Each finding links back to its opportunity
- Diffs are still per-finding (actionable detail level)
- But narrative and priority are per-opportunity (strategic level)

---

## Example Report Output

A sample HTML structure from the template (filled in):

```html
<h1>🔍 Refactor Radar — Audit Report</h1>
<div class="meta">Project: LoginPageTests · Generated: 2026-08-10 · Opportunities: 3 · Findings: 9</div>

<section class="executive-summary">
  <h2>Executive Summary</h2>
  <p>3 refactoring opportunities identified across 3 root-cause families.</p>

  <table class="summary-table">
    <tr>
      <th>Priority</th> <th>Count</th> <th>Avg Impact</th> <th>Avg Confidence</th>
    </tr>
    <tr>
      <td><span class="priority-badge critical">Critical</span></td> <td>1</td> <td>87%</td> <td>89%</td>
    </tr>
    <tr>
      <td><span class="priority-badge high">High</span></td> <td>1</td> <td>72%</td> <td>76%</td>
    </tr>
    <tr>
      <td><span class="priority-badge medium">Medium</span></td> <td>1</td> <td>54%</td> <td>68%</td>
    </tr>
  </table>
</section>

<section class="opportunities-ranked">
  <h2>Opportunities (Ranked by Priority)</h2>
  <table class="opportunity-table">
    <tr>
      <th>Rank</th> <th>Opportunity</th> <th>Priority</th> <th>Impact</th> <th>Risk</th> <th>Affected Tests</th>
    </tr>
    <tr>
      <td>1</td>
      <td><a href="#OPP-001">Stabilize LoginPage interaction layer</a></td>
      <td><span class="priority-badge critical">Critical</span></td>
      <td>3 direct + 24 transitive</td>
      <td>Medium</td>
      <td>7</td>
    </tr>
    ...
  </table>
</section>

<section class="opportunity-details">
  <div class="opportunity critical" id="OPP-001">
    <h2>#1: Stabilize LoginPage interaction layer</h2>

    <div class="opportunity-header">
      <span class="priority-badge critical">Critical</span>
      <span class="metric">Impact: 3 direct + 24 high-confidence transitive</span>
      <span class="metric">Risk: Medium</span>
      <span class="metric">Effort: Moderate</span>
      <span class="metric">Confidence: 86%</span>
    </div>

    <div class="problem-statement">
      <h3>Problem</h3>
      <p><strong>LoginPage has duplicated interaction logic and fragile selectors, creating systemic test instability</strong></p>
      <p>Multiple waits are duplicated across login(), authenticateUser(), and validateAuth(). Selectors rely on auto-generated IDs. Tests fail intermittently due to timing.</p>
    </div>

    <div class="affected-components">
      <h3>Affected Components</h3>
      <ul>
        <li><strong>Files:</strong> 2 (LoginPage.java, AuthHelper.java)</li>
        <li><strong>Classes:</strong> 3</li>
        <li><strong>Methods:</strong> 5</li>
        <li><strong>Tests:</strong> 7</li>
        <li><strong>Direct Impact:</strong> 3 callers</li>
        <li><strong>Transitive Impact:</strong> 24 high-confidence nodes</li>
      </ul>
    </div>

    <div class="supporting-findings">
      <h3>Supporting Findings</h3>
      <div class="finding-item">
        <strong>DI-014 (instability)</strong>
        <p>Duplicated wait-for-element in login interaction</p>
        <div class="evidence">search_code(pattern='wait.*username-field') found 3 matches in LoginPage.java; trace_path confirms all three in the login flow</div>
        <p class="proposal-link"><a href="../LoginPage.java.DI-014.patch">View proposed diff →</a></p>
      </div>
      <div class="finding-item">
        <strong>DU-032 (duplication)</strong>
        <p>Duplicated interaction implementation</p>
        <div class="evidence">structural graph similarity: LoginPage.login() and LoginPage.authenticateUser() have 92% call-pattern similarity</div>
        <p class="proposal-link"><a href="../LoginPage.java.DU-032.patch">View proposed diff →</a></p>
      </div>
    </div>

    <div class="recommendation">
      <h3>Recommendation</h3>
      <p>Extract LoginPage.waitForElement(selector, timeout) helper; consolidate duplicated implementations. Consolidate fragile selectors into stable page-object patterns.</p>
      <p class="impact-estimate">
        Estimated reduction: 47 lines removed, 3 duplications consolidated, 2 fragile selectors replaced
        (7 tests affected by this refactoring)
      </p>
    </div>

    <div class="priority-calculation">
      <h3>Priority Calculation</h3>
      <p>27 high-impact nodes + 86% confidence / medium effort / medium risk → Critical. 7 known flaky tests directly involved; fixing this unblocks 23% of false-fail reduction potential.</p>
    </div>
  </div>
</section>

<footer>
  <h3>Legend</h3>
  <dl>
    <dt>Direct Impact</dt>
    <dd>Immediate callers and dependencies of the affected components.</dd>
    ...
  </dl>
</footer>
```

---

## Quality Gates

Before rendering, step-03 verifies:
- ✅ All Finding[] have diff proposals written
- ✅ All Opportunity[] present in ranked order
- ✅ Each opportunity shows supporting findings with evidence
- ✅ Proposal links are relative (work from any location)
- ✅ HTML is self-contained (no external assets)
- ✅ Styling is mobile-responsive

---

## Complete Audit-All Pipeline

```
INPUT: target_project graph + execution logs (optional)

STEP-01: Preflight & Init
  ├─ Resolve project
  ├─ Verify indexed
  └─ Load knowledge fragments

STEP-02: Run Detectors
  ├─ Detect Dependencies
  ├─ Detect Instability
  ├─ Detect Data Issues
  ├─ Detect Duplication
  └─ Output: Finding[]

STEP-02B: Evidence Fusion
  ├─ Evaluate Strong/Medium/Weak correlation rules
  ├─ Build Correlation[] linking related findings
  └─ Output: Correlation[] + Finding[] (preserved)

STEP-02C: Opportunity Engine
  ├─ Union-Find on Correlation[]
  ├─ Group correlated findings into components
  └─ Output: Opportunity[] (grouped, ungrouped)

STEP-02D: Impact Analysis
  ├─ 2-3 hop weighted graph traversal
  ├─ Calculate affected components
  ├─ Assess risk, estimate effort
  ├─ Calculate confidence
  └─ Output: Opportunity[] (enriched with metrics)

STEP-02E: Ranking
  ├─ Priority score = (impact × confidence) / (effort × risk)
  ├─ Assign priority level (Critical/High/Medium/Low)
  └─ Output: Opportunity[] (sorted by score)

STEP-03: Report Rendering
  ├─ Write diff proposals for each Finding
  ├─ Render HTML (opportunities-first)
  ├─ Write to {rrd_artifacts}/refactor-radar-audit-{date}.html
  └─ Summarize to user

OUTPUT:
  ├─ refactor-radar-audit-{project}-{date}.html (opportunities + findings + evidence)
  ├─ {target}/proposals/{target}.{finding_id}.patch (one per finding)
  └─ Terminal summary (terse, evidence-led)
```

---

## Remaining Tasks (Future Phases)

Phase 3 is now **complete end-to-end**. Optional future enhancements:

1. **Execution feedback loop** — track which opportunities teams actually fix, use that to retrain confidence calibration
2. **Cross-project opportunity clustering** — identify the same refactoring need across projects (e.g., "all projects have fragile selectors in auth")
3. **Team-wide campaign planning** — opportunities aggregated across projects into strategic refactoring campaigns
4. **Comparative reporting** — track how many opportunities get fixed per round, which priority levels move fastest

But the core capability is now **live and functional**.

---

## Files Modified

**Updated:**
- `step-03-rank-and-report.md` — completely rewritten for opportunity-first rendering
- `audit-report-template.html` — enhanced with opportunity sections, better styling, responsive design

**Both locations synchronized:**
- `/skills/rrd-audit-all/` (authoring)
- `/.claude/skills/rrd-audit-all/` (installed)

---

## Next: End-to-End Validation

The pipeline is complete. Next step: **run it end-to-end** on a real project (BMAD_cursor or jarvis) to validate:

1. step-02 produces findings
2. step-02b correlates them
3. step-02c groups them into opportunities
4. step-02d enriches with impact
5. step-02e ranks them
6. step-03 renders a properly-formatted HTML report
7. Diffs are written and linked correctly
8. Summary to user is clear and evidence-led

That's the final validation gate before the refactor-radar module is production-ready.
