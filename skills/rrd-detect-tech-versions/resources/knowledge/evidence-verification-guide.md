How an owner independently re-verifies any graph-based finding without trusting Ray's tool-call output. Every detection workflow should be able to point an owner here when asked "how do I know this is real?"

## The index is a plain SQLite file — query it directly

`codebase-memory-mcp` stores each project's index centrally, not inside the project itself:

```
~/.cache/codebase-memory-mcp/<project-name>.db
```

(Override location: `CBM_CACHE_DIR` env var.) This is an ordinary SQLite database with a small, stable schema — `nodes`, `edges`, `nodes_fts` (full-text index), `node_vectors`/`token_vectors` (embeddings), `projects`, `file_hashes`. Open it with any SQLite client, or Python's stdlib:

```python
import sqlite3, json
conn = sqlite3.connect(r"C:\Users\<you>\.cache\codebase-memory-mcp\<project>.db")
cur = conn.cursor()

# Verify a claim about a symbol's properties:
cur.execute("SELECT qualified_name, properties FROM nodes WHERE label IN ('Function','Method')")
for name, props in cur.fetchall():
    p = json.loads(props)
    print(name, p.get("complexity"), p.get("cognitive"))
```

This bypasses the MCP tool layer entirely — if a number in a report matches what's in this file, it did not come from an invented or hallucinated tool response.

## For this detector specifically: verify against the manifest, not the graph

`detect-tech-versions` reads `pom.xml`/`build.gradle`/`package.json` directly via `Read` (these are not graph-indexed symbols), so the primary verification step is simpler than for other detectors: open the manifest file yourself and confirm the version string the report cites is actually present at the stated location. The graph is only used for the *usage/impact count* (via `search_code`/`search_graph` on the import prefix) — that count can be re-verified the same way as any other detector's evidence.

## Cheap corroborating checks

- **File mtimes.** A `.db` untouched for weeks while a report claims fresh findings is a red flag for graph-based impact counts.
- **Re-run the exact query.** Every finding's evidence field should include the literal `search_code`/`search_graph` call used for impact count. Paste it back into the same tool yourself and diff the result against what the report claims.
- **Version database currency.** `resources/version-database.csv` is a static snapshot — check its date/notes column if a "latest safe version" claim looks suspiciously old.

## What this does NOT verify

Confirming the manifest string and the impact count are real does not confirm the **CVE or breaking-change classification is correct** — that still requires checking the actual CVE database or release notes for the specific version pair, per the calibration note in `detect-tech-versions.md`.
