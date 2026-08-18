---
name: 'step-02d-impact-analysis'
description: 'Calculate blast radius and weighted impact for each opportunity via graph traversal'
nextStepFile: '{skill-root}/steps/step-02e-ranking.md'
---

# Step 2d: Impact Analysis

## STEP GOAL

For each Opportunity, traverse the dependency/call graph to:
1. Identify affected components (direct + weighted transitive)
2. Calculate impact metrics
3. Assess risk
4. Estimate effort
5. Prepare data for step-02e (Ranking)

## STEP CONTEXT

Load knowledge fragments:
- `opportunity-and-impact-model.md` (Impact structure)
- `opportunity-grouping-and-impact-heuristics.md` (Part 2-5: Impact Analysis, Risk, Effort, Confidence)

Input:
- Opportunity[] (from step-02c, with supporting_findings populated)
- Target project graph (indexed via codebase-memory-mcp)

Output:
- Opportunity[] (enriched with impact, risk, effort, confidence)

## PREREQUISITE ARTIFACTS

Before starting this step, verify:
- [ ] `{project-root}/.refactor-radar-work/opportunities.json` exists and is valid JSON (from step-02c)
- [ ] Each opportunity has `supporting_findings`, `title`, `description` (not yet impact/risk/effort/confidence)
- If checks fail, **HALT**. Step-02c did not complete successfully. Do not proceed.

## SEQUENCE

### 0. Load Input

Read opportunities from step-02c:
```bash
read {project-root}/.refactor-radar-work/opportunities.json → Opportunity[]
```

**Critical:** File must exist. If missing, halt with error: "Missing opportunities.json from step-02c — that step did not complete successfully."

### 1. Resolve Target Nodes

For each Opportunity:
```
target_nodes = []
for finding in opportunity.supporting_findings:
  target = finding.affected_target
  # Query graph to confirm this is a single entity
  search_result = search_graph(qualified_name=target)
  if search_result.found:
    target_nodes.append(target)
```

**Example:**
```
Opportunity OPP-001:
  Finding DI-014: affected_target = "LoginPage.java"
  Finding DU-032: affected_target = "LoginPage.java"
  Finding DI-089: affected_target = "LoginPage.java"
  
  → target_nodes = ["LoginPage"]
```

### 2. Calculate Direct Impact

For each target_node:
```
direct_callers = search_graph(qualified_name=node, field=in_degree)
direct_callees = search_graph(qualified_name=node, field=out_degree)

direct_impact = {
  fan_in_count: len(direct_callers),
  fan_out_count: len(direct_callees),
  immediate_callers: direct_callers,
  immediate_callees: direct_callees,
  total: fan_in_count + fan_out_count
}
```

**Record in Opportunity.impact.direct**

### 3. Perform 2-3 Hop Transitive Traversal

For each target_node, run BFS (breadth-first search) up to 3 hops:

```
hop_1_nodes = set(direct_callers) ∪ set(direct_callees)

hop_2_nodes = set()
for node in hop_1_nodes:
  hop_2_nodes.add(search_graph(in_degree=node))
  hop_2_nodes.add(search_graph(out_degree=node))

hop_3_nodes = set()
for node in hop_2_nodes:
  hop_3_nodes.add(search_graph(in_degree=node))
  hop_3_nodes.add(search_graph(out_degree=node))

# Remove duplicates (nodes in earlier hops)
hop_2_nodes = hop_2_nodes - hop_1_nodes
hop_3_nodes = hop_3_nodes - (hop_1_nodes ∪ hop_2_nodes)
```

**Record hop counts in Opportunity.impact.transitive**

### 4. Weight Each Node by Impact Factors

For every node discovered in hops 1-3:

```
base_weight = 1.0
distance_decay = {hop_1: 1.0, hop_2: 0.7, hop_3: 0.4}[hop_level]
relationship_factor = get_relationship_type_factor(node, parent_node)
  # 1.0 for calls, 0.8 for imports, 0.6 for data_flow, 0.3 for semantic

usage_frequency_factor = 1.0
if execution_logs available:
  if node is called in > 10% of test runs:
    usage_frequency_factor = 1.5

weight = base_weight × distance_decay × relationship_factor × usage_frequency_factor
```

**Example weights:**
```
hop_1 direct call: 1.0 × 1.0 × 1.0 × 1.0 = 1.0
hop_1 import: 1.0 × 1.0 × 0.8 × 1.0 = 0.8
hop_2 data_flow: 1.0 × 0.7 × 0.6 × 1.0 = 0.42
hop_3 semantic: 1.0 × 0.4 × 0.3 × 1.5 = 0.18
```

### 5. Filter to High-Confidence Impact

Not all transitive nodes are practically important. Keep only:

```
high_confidence_nodes = []
for node in all_transitive_nodes:
  if weight >= 0.8:
    high_confidence_nodes.append(node)  # Strong signal
  elif node.fan_in > 5:
    high_confidence_nodes.append(node)  # It's a hub
  elif execution_logs contain failures in node:
    high_confidence_nodes.append(node)  # Real failures
  elif node.in_tests > 3:
    high_confidence_nodes.append(node)  # Tested heavily
```

**Record:**
```
weighted_high_confidence_count = len(high_confidence_nodes)
```

### 6. Extract Affected Components

From direct_impact + high_confidence_nodes:

```
affected_files = set()
affected_classes = set()
affected_methods = set()
affected_tests = set()

for node in [direct_impact nodes] + high_confidence_nodes:
  extract_files(node, affected_files)
  extract_classes(node, affected_classes)
  extract_methods(node, affected_methods)

# Cross-reference tests that exercise any affected node
for test in all_tests:
  if trace_path(test → any(affected_nodes)):
    affected_tests.add(test)

# Look up test plans from metadata (if available)
affected_test_plans = lookup_test_plans(affected_tests)
```

**Record in Opportunity.affected_components**

### 7. Correlate with Execution Evidence

If execution logs available (ingest_traces was called):

```
flaky_tests = []
failure_frequency = 0
cascade_count = 0

for test in affected_tests:
  test_failures = search_logs(test)
  if test_failures.count > threshold (e.g., 1):
    flaky_tests.append(test)
    failure_frequency += test_failures.count

for failure in all_failures:
  if failure.primary_cause ∈ affected_nodes:
    if failure.secondary_failures > 0:
      cascade_count += failure.secondary_failures
```

**Record in Opportunity.impact.execution_evidence**

### 8. Assess Risk

```
# Blast radius
if affected_files.count > 20:
  blast_radius = "Large"
elif affected_files.count > 5:
  blast_radius = "Medium"
else:
  blast_radius = "Small"

# Complexity
interconnectedness = graph_density(affected_nodes)
if affected_classes.count > 10 AND interconnectedness > high:
  complexity = "High"
elif affected_methods.count > 20 OR call_tree_depth > 4:
  complexity = "Medium"
else:
  complexity = "Low"

# Overall risk
risk = {
  blast_radius: blast_radius,
  complexity: complexity,
  level: max(blast_radius, complexity),
  justification: f"Affects {affected_files.count} files, {affected_classes.count} classes; complexity {complexity}"
}
```

**Record in Opportunity.risk**

### 9. Calculate Confidence

```
finding_consensus = (len(opportunity.supporting_findings) / total_findings_in_audit) × 100

evidence_strength = avg([correlation.strength_score for correlation in opportunity.correlations])
  where strength_score ∈ {strong: 0.95, medium: 0.65, weak: 0.2}

execution_corroboration = 0
if opportunity.impact.execution_evidence.flaky_test_count > 0:
  execution_corroboration = min(100, 50 + (flaky_test_count × 10))

overall_confidence = (finding_consensus × 0.4) + (evidence_strength × 100 × 0.4) + (execution_corroboration × 0.2)
```

**Record in Opportunity.confidence**

### 10. Estimate Effort

**CALIBRATION FIX (2026-08-11, after real-data validation on jarvis):** summing whole-file-size × a flat factor overestimates any fix that's actually localized to a few call sites — a 327-line file needing a 9-call-site dependency injection produced 481 estimated lines when the real number was ~45. Pick one of two strategies per opportunity based on what the recommendation actually does (full detail in `opportunity-grouping-and-impact-heuristics.md` Part 5):

```
if recommendation deletes/rewrites an entire file (e.g. duplicate-file removal, full selector-pattern rewrite):
  # Strategy A — whole-file-scope
  estimated_lines = size_of_primary_affected_file × refactor_factor
    # duplication (whole-file delete/merge): 1.0, instability (page-object rewrite): 0.5, data (fixture rearchitecture): 0.4
    # use the size of the file(s) actually being rewritten/deleted, not every file merely touched by a caller

else:
  # Strategy B — localized, occurrence-scoped
  estimated_lines = (occurrence_count × lines_per_occurrence) + injection_or_setup_overhead
    # dependencies (inject vs. import singleton): ~3-5 lines/call site
    # instability (replace one fixed wait/fragile selector): ~2-4 lines/occurrence
    # data issues (parameterize one hardcoded value): ~2-3 lines/occurrence
    # injection_or_setup_overhead ≈ 10-15 lines

record which strategy was used, and why, on Opportunity.effort — a reviewer must be able to sanity-check the number.

refactor_scope = {
  < 10: "Small",
  10-50: "Moderate",
  > 50: "Large"
}[estimated_lines]

regression_risk = {
  affected_tests.count == 0: "Low",
  affected_tests.count < 5: "Low",
  affected_tests.count < 20: "Medium",
  affected_tests.count >= 20: "High"
}[affected_tests.count]
```

**Record in Opportunity.effort**

### 11. Output Debug Information

Log:
```
Impact Analysis Complete:
  {num_opportunities} opportunities analyzed
  
  Example: OPP-001
    Target node: LoginPage
    Direct impact: 3 callers, 2 callees
    Hop 1 (distance 1.0): 8 nodes
    Hop 2 (distance 0.7): 23 nodes
    Hop 3 (distance 0.4): 42 nodes
    After weighting: 24 high-confidence nodes
    
    Affected files: 2
    Affected classes: 3
    Affected tests: 7 (3 flaky)
    Risk: Medium (5 files, medium complexity)
    Confidence: 86%
    Effort: Medium (47 lines, moderate scope)
```


### 13. Write Enriched Opportunities

Overwrite opportunities.json with impact metrics added:
```bash
write {project-root}/.refactor-radar-work/opportunities.json [Opportunity[]]
```

Each Opportunity now includes `impact`, `risk`, `effort`, `confidence` fields. 

**Do NOT yet include** `priority` (added by step-02e).

## ⚠️ CRITICAL CHECKPOINT: BEFORE PROCEEDING TO STEP-02E

**Do not skip this validation. Do not proceed without confirming all of the below.**

Verify:
- [ ] File `opportunities.json` has been overwritten (check file modification time)
- [ ] Every opportunity has: `impact.direct`, `impact.transitive`, `risk`, `effort`, `confidence`
- [ ] `confidence` is a percentage (0-100 integer), and is justified by finding_consensus + evidence_strength + execution_evidence
- [ ] `impact.direct.total` = fan_in_count + fan_out_count (not a duplicate of either)
- [ ] `risk.level` is one of: Low, Medium, High
- [ ] `effort.refactor_scope` is one of: Small, Moderate, Large
- [ ] No NaN, infinity, or null values in any numeric field
- [ ] For all opportunities: check spot-samples via the debug output — does the impact analysis make sense given the affected files/tests?

If any validation fails, **HALT**. Do not proceed to step-02e. Report the failure.

If all validations pass, report:
```
Step 02d complete: impact analysis on {num_opportunities} opportunities complete
  Example: OPP-001 has {impact.direct.total} direct, {num_transitive} transitive impact, {risk.level} risk, {confidence}% confidence
Ready to proceed to step-02e (Ranking)
```

### 14. Continue

Load and proceed to `./step-02e-ranking.md`.

---

## Implementation Notes

- **Graph queries are the bottleneck.** For large projects, cache repeated queries (fan_in, fan_out) by qualified name.
- **Execution logs are optional.** If not available, execution_evidence is empty, but risk/effort/confidence are still calculated.
- **Weighted filtering prevents false positives.** 80 transitive nodes → 24 high-confidence is not unusual; this is correct.
- **Every opportunity gets a full impact analysis.** No shortcuts; completeness matters for priority ranking.

---

## Quality Gates

Before continuing to step-02e, verify:
- [ ] Every opportunity has affected_components populated
- [ ] Every opportunity has impact.direct + impact.transitive calculated
- [ ] Every opportunity has risk assessed
- [ ] Every opportunity has confidence calculated
- [ ] Affected tests are correctly identified and counted
- [ ] No cycles in the traversal (BFS prevents this, but validate)
