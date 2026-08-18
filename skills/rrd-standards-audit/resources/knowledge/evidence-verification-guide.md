# Evidence Verification Guide

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

# Verify a SIMILAR_TO (duplication) claim:
cur.execute("SELECT source_id, target_id, properties FROM edges WHERE type='SIMILAR_TO'")
for src, tgt, props in cur.fetchall():
    p = json.loads(props)
    print(p.get("jaccard"), p.get("same_file"))

# Verify a complexity claim — properties are a JSON blob on the node row:
cur.execute("SELECT qualified_name, properties FROM nodes WHERE label IN ('Function','Method')")
for name, props in cur.fetchall():
    p = json.loads(props)
    print(name, p.get("complexity"), p.get("cognitive"))
```

This bypasses the MCP tool layer entirely — if a number in a report matches what's in this file, it did not come from an invented or hallucinated tool response.

## For `rrd-standards-audit` specifically: verify against the cited prior report

Since this workflow's primary evidence is other detectors' prior findings, the equivalent verification step is simpler than opening the SQLite index: open the cited `{rrd_artifacts}/detect-*-{target}-{date}.md` file(s) directly and confirm the occurrence count and file list this workflow's finding claims actually match what's in that report. If a count doesn't match, that's the discrepancy to chase, not the graph DB.

## Cheap corroborating checks (before opening the DB)

- **File mtimes.** `edges`/`nodes` changes land in the `.db`/`.db-wal`/`.db-shm` files; their mtimes should line up with when `index_repository` and subsequent queries actually ran. A `.db` untouched for weeks while a report claims fresh findings is a red flag.
- **Re-run the exact query.** Every finding's evidence field should include the literal `query_graph`/`search_graph`/`trace_path` call used. Paste it back into the same tool yourself and diff the result against what the report claims.
- **Row counts, not just top rows.** If a report says "N similar pairs found," the tool response's `total` field (or a fresh `SELECT COUNT(*)`) should match N exactly, not just look plausible.

## Server-side logging (for deeper debugging)

Set before starting the MCP session:

| Variable | Effect |
|---|---|
| `CBM_LOG_LEVEL=debug` | Verbose stderr logging from the server (stdio MCP servers' stderr is typically captured by whatever launched them) |
| `CBM_DIAGNOSTICS=true` | Periodic diagnostics dumped to `/tmp/cbm-diagnostics-<pid>.json` |

## What this does NOT verify

Querying the raw DB confirms the **graph data is real and matches the report**. It does not confirm the **finding is correct** — that still requires reading the actual source (`get_code_snippet`) and applying judgment, per the rest of the Investigation Contract. A real `jaccard=1.000` edge on two genuinely-unrelated one-line boilerplate functions is real data pointing at a weak finding, not a wrong one. Verification and correctness are two different questions — this guide only answers the first.
