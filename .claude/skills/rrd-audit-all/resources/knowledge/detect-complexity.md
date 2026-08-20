# Detect Complexity Heuristics

## What Success Looks Like

The owner learns exactly which functions/methods are hard to maintain or hiding real correctness/performance risk — high cyclomatic/cognitive load, deep or interprocedural loop nesting, unguarded recursion, hidden O(n²) scans, or feature-envy-style deep attribute chains — with the metric that flagged it and a concrete extract/simplify proposal. Unlike the other four detectors (all tuned for *test suite* reliability), this family targets the maintainability of the code itself, which is why it's the one Refactor Radar detector that applies just as well to a non-test codebase as to a test suite.

## Approach

**Query the graph's own precomputed complexity properties — don't estimate them by reading code first.** Every `Function`/`Method` node carries these properties already computed by the indexer:

```cypher
MATCH (f:Function|Method) WHERE f.complexity IS NOT NULL
RETURN f.qualified_name, f.complexity, f.cognitive, f.loop_depth, f.transitive_loop_depth,
       f.linear_scan_in_loop, f.alloc_in_loop, f.param_count, f.max_access_depth,
       f.recursive, f.recursion_in_loop, f.unguarded_recursion
ORDER BY f.complexity DESC LIMIT 20
```

Run variants ordered by `f.cognitive DESC`, `f.transitive_loop_depth DESC`, and a filter for `f.linear_scan_in_loop >= 1 OR f.unguarded_recursion = true` — a single ORDER BY will miss hotspots that rank high on one axis but not another (a function can have low cyclomatic complexity and still hide a real O(n²) scan).

### Thresholds (defaults — the owner may narrow/widen)

| Property | Flag when | Why |
|---|---|---|
| `complexity` (cyclomatic) | > 10 | McCabe's own guidance: >10 is complex, >20 is effectively untestable as one unit |
| `cognitive` | > 15 | Above the level a reviewer can hold in their head in one pass |
| `transitive_loop_depth` | >= 3 | Interprocedural nested-loop degree — a polynomial-time risk proxy, not just a style smell |
| `linear_scan_in_loop` | >= 1 | The hidden O(n²) that `loop_depth` alone misses — a find/contains/indexOf-style scan inside a loop |
| `alloc_in_loop` | >= 3 | Repeated allocation inside a loop — usually fine, but worth a look at this density |
| `param_count` | > 5 | Long-parameter-list smell; usually resolvable by grouping into a parameter object |
| `max_access_depth` | > 3 | Deep attribute/nested access — feature envy, tight coupling to another object's internal structure |
| `unguarded_recursion` | true | Real correctness risk — recursion with no conditionally-guarded base case can stack-overflow on adversarial input, not just a style concern |
| `recursion_in_loop` | true | A self-call inside a loop compounds recursion cost with loop cost — check this isn't accidentally quadratic-or-worse |

None of these thresholds are a finding by themselves — they're where to look. **Always read the actual source via `get_code_snippet` before writing a finding.** A high cognitive score is very often driven by one identifiable, fixable pattern (e.g. N near-identical try/except blocks, N near-identical step-timing blocks) rather than genuinely irreducible logic — name that pattern in the finding, don't just restate the metric.

### Cross-Detector Corroboration

If a function flagged here is *also* flagged by another detector (e.g. Detect Dependencies found it as a high-fan-in coupling point), treat that as materially stronger evidence than either signal alone — the same function being both complex and heavily depended-upon is a much better refactoring priority than either fact in isolation. Cite both findings' evidence in the correlation, per `evidence-fusion-heuristics.md`'s cross-family corroboration rule.

### What NOT to Flag

- A high `param_count` on a `__init__`/constructor whose parameters are all independent config values is a much weaker smell than the same count on a business-logic method — use judgment, don't flag mechanically.
- `recursive=true` alone (a guarded, correctly-terminating recursive function) is not a finding — only `unguarded_recursion` or `recursion_in_loop` are.
- Test files and fixtures are typically excluded from complexity-hotspot findings unless the owner asks otherwise — complexity in test setup code is a different (and usually lower-priority) problem than complexity in the code under test.

## Reference Example

A real finding from validating this detector against a Python test-generation tool (`jarvis`, not itself a test suite — proof this detector generalizes beyond test-suite codebases): `TestMetricsCalculator.calculate_all_metrics` had `cognitive=48`, the highest in the codebase. Reading the source (`get_code_snippet`) showed the cause was not irreducible logic but **7 near-identical try/except blocks**, each calling a `_calculate_X` submethod and swallowing `Exception` with a print-warning — directly extractable into one `_safe_calculate(name, func, *args)` helper. Separately, `TestCoordinator.run` (`complexity=15`, `cognitive=29`, `transitive_loop_depth=8`) contained 5 near-identical step-timing blocks and two closures capturing no local state that should be module-level functions. Both findings were graph-evidenced by the query above and confirmed by reading actual source before being written up — not inferred from the metric alone.
