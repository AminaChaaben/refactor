# Detect Complexity Validation Checklist

## Prerequisites

- [ ] Target project resolved via `list_projects`/`index_status`
- [ ] Target project confirmed indexed
- [ ] Knowledge fragment loaded: `evidence-and-diff-discipline.md`
- [ ] Knowledge fragment loaded: `detect-complexity.md`
- [ ] Knowledge fragment loaded: `detect-report-template.md`
- [ ] Complexity thresholds confirmed with owner (or defaults used)

**Halt if missing:** target project not indexed.

## Investigation

- [ ] `query_graph` run for `complexity`/`cognitive`/`loop_depth`/`transitive_loop_depth` hotspots, ordered by more than one axis (a single ORDER BY misses hotspots that rank high on only one metric)
- [ ] `query_graph` run for `linear_scan_in_loop >= 1 OR unguarded_recursion = true` (hidden O(n²) and correctness risks a complexity-only sort would miss)
- [ ] Every candidate confirmed by reading actual source via `get_code_snippet` — the concrete pattern causing the number is named, not just the metric
- [ ] Checked whether each candidate is also flagged by another detector (cross-detector corroboration) before finalizing confidence

## Findings and Proposals

- [ ] Every finding names the function/method, the metric(s) that flagged it, and the confirmed source-level cause
- [ ] Every fix proposes a concrete simplify/extract action grounded in the actual code read, not the metric alone
- [ ] Every fix written as a diff to the target project's `proposals/`
- [ ] Findings on test/fixture code are flagged as such and deprioritized unless the owner asked otherwise

## Completion Criteria

- [ ] Findings summary written to `{rrd_artifacts}/detect-complexity-{target_project}.md`
- [ ] All diff proposals written to the target project's `proposals/`, listed in the summary
