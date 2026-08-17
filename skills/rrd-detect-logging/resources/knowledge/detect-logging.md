# Detect Logging Heuristics

## What Success Looks Like

The owner learns exactly which error paths, external calls, and loops carry no diagnostic signal — so that when something breaks or flakes in the future, there's a log line to point at instead of a stack trace and a shrug. This axis is different from the other five: it isn't measuring test-suite reliability (Dependencies/Instability/Data Issues) or code maintainability (Duplication/Complexity) directly — it's **instrumentation-for-diagnosability**, deliberately built as a bridge between Category 2 (refactor for best practices) and Category 1 (analyze real execution logs). Every gap this detector closes today is a future `rrd-analyze-test-reliability` run that gets a real error message instead of "test failed, cause unknown."

## Approach

The graph has no precomputed "has logging" or "has catch block" property the way it has `complexity`/`cognitive` — locate candidates via what the graph *does* expose, then confirm by reading source.

### 1. External-Call Sites (via `CALLS` edges)

```cypher
MATCH (f:Function|Method)-[c:CALLS]->()
WHERE c.callee =~ '(?i).*(request|http|fetch|execute|query|driver|client|connect|open|read|write|send).*'
RETURN f.qualified_name, f.file_path, c.callee, c.line
```

Any function calling out to something that can fail (HTTP, DB, WebDriver, filesystem, subprocess) is a candidate. The callee-name regex is a starting filter, not a final one — read the actual call to confirm it's a real failure-capable boundary, not a false match (e.g. a `queryParams` variable name matching `.*query.*` incidentally).

### 2. Failure-Capable Loops (via precomputed loop properties)

```cypher
MATCH (f:Function|Method) WHERE f.loop_depth >= 1 OR f.transitive_loop_depth >= 1
RETURN f.qualified_name, f.file_path, f.loop_depth, f.transitive_loop_depth, f.linear_scan_in_loop
```

Reuses Detect Complexity's existing properties rather than inventing new graph metrics. A loop is only a real candidate if its body also contains a failure-capable operation (an external call, a parse/cast, an index access) — cross-reference against the external-call query above, or read the loop body directly.

### 3. Catch Blocks (via `search_code`, no graph representation)

The indexer doesn't model exception-handling blocks as graph nodes, so use `search_code` for the language's syntax directly: `catch`, `except`, `rescue`, `.catch(`. Scope with `file_pattern`/`path_filter` per the Tool Usage Discipline in `evidence-and-diff-discipline.md` — don't conclude "no catch blocks" from a zero-`total_grep_matches` result without checking the pattern/scope first.

## What Counts as a Gap (confirm by reading actual source — never from the query alone)

| Gap type | Pattern |
|---|---|
| **Silent catch** | Catch block with no logging statement of any kind — the exception is swallowed with zero trace it ever happened |
| **Exception-dropping log** | Catch block logs a message string but not the original exception/error object (e.g. `log.warn("failed: " + e.getMessage())` instead of passing `e` itself) — breaks stack-trace continuity, the single most common gap that turns a 30-second root-cause lookup into a guessing exercise |
| **Unlogged external call** | A call to something that can fail (network, DB, driver, filesystem) with no logging on the failure path — no log on a non-2xx response, no log before/after a retry, no log on a timeout |
| **Unlogged loop failure path** | A loop body containing a failure-capable operation with no per-iteration or per-failure log signal — if iteration 47 of 200 is where things went wrong, nothing points at it |

None of these are findings from the graph query alone — always read the actual code via `get_code_snippet`/`Read` and quote the specific line(s) missing the log statement or dropping the exception object.

## Cross-Detector Corroboration

A function flagged here that's *also* flagged by Detect Instability (fragile wait/selector) or Detect Dependencies (shared/coupled state) is a higher-priority fix than either signal alone — it's exactly the kind of site likely to fail intermittently *and* currently gives no signal when it does. Cite both findings' evidence when this overlap occurs, per `evidence-fusion-heuristics.md`'s cross-family corroboration rule.

## What NOT to Flag

- Catch blocks that intentionally suppress a truly benign, expected condition (e.g. catching `NumberFormatException` to fall back to a documented default) are not gaps by themselves — only flag if the fallback path itself could later cause a confusing downstream failure with no trace back to this decision.
- A loop with no failure-capable operation in its body (pure in-memory transformation, no I/O, no parsing, no external call) is not a candidate regardless of `loop_depth` — logging every iteration of a pure computation is noise, not diagnosability.
- Findings inside test methods themselves are lower priority than findings in the application/framework/page-object code the tests call — a test's own failure is already visible in the test report; the diagnosability gap that matters is one layer down, in the code whose *silent* failure caused the test to behave unexpectedly.
- Don't propose swapping a caught-and-logged exception into a re-thrown one unless the owner's control flow already expects failures to propagate — adding a log line is almost always the right fix; changing control flow is a separate, larger decision the owner should make explicitly.

## Reference Pattern (generalized, not project-specific)

The canonical "silent catch" this axis exists to catch:

```java
try {
    element.click();
} catch (Exception e) {
    // swallowed — the caller has no idea this failed
}
```

versus the fix that actually helps a future `rrd-analyze-test-reliability` run:

```java
try {
    element.click();
} catch (Exception e) {
    log.warn("click failed on {}: {}", element, e.getMessage(), e);  // e itself passed, not just its message
}
```

The second version doesn't change behavior — it changes whether the next flaky-test investigation has anything to look at.
