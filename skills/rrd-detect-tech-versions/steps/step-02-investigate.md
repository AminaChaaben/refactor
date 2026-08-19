---
name: 'step-02-investigate'
description: 'Scan build/dependency manifests for outdated versions, CVEs, and breaking framework migrations'
nextStepFile: '{skill-root}/steps/step-03-report-and-propose.md'
---

# Step 2: Investigate

## SEQUENCE

### 1. Locate Manifests

Use `search_code`/`Grep` to find, at the target project root:

- `pom.xml` (Maven)
- `build.gradle` / `build.gradle.kts` (Gradle)
- `package.json` (npm/Node)

A project may have more than one of these (e.g. a Java backend + a JS test framework) — scan every manifest found, don't stop at the first match.

### 2. Extract Declared Versions

For each manifest found, read it directly (these are config files, not indexed code symbols — `Read` is correct here, not `get_code_snippet`; note this explicitly per the Tool Usage Discipline fallback rule) and extract:

- **pom.xml**: `<properties>` (`maven.compiler.source`/`target`, `java.version`), every `<dependency>` group/artifact/version (including versions inherited from a parent POM or a `<dependencyManagement>` block — note when a version is inherited rather than declared locally)
- **build.gradle**: `sourceCompatibility`/`targetCompatibility` (or `toolchain` block for Java version), every `dependencies { }` entry with a resolvable version string
- **package.json**: `engines.node` if present, every entry in `dependencies` and `devDependencies`

### 3. Compare Against Version Database

For each extracted `(group, artifact, current_version)` triple, look it up in `./resources/version-database.csv`. For each match:

- Record `latest_safe_version`
- Record `severity` (from the CSV's `cve` column — if populated, this is CRITICAL regardless of the version-gap alone)
- If the artifact isn't in the database, skip it silently — this detector only reports on the curated list (Java, JUnit, Spring, Selenium, Maven, and their common transitive companions), not every dependency in the manifest. State the skipped-artifact count once at the end of investigation, not per-artifact, so the owner knows this was a scoped pass, not exhaustive.

### 4. Classify Breaking-Change Risk

For every outdated match, consult `./resources/knowledge/detect-tech-versions.md`'s hardcoded migration-rules table (JUnit 4→5, Spring 5→6, Selenium 3→4, Java 8→11/17/21). If the current→target version pair crosses a documented breaking boundary, classify as **HIGH** (breaking) regardless of the CVE/severity column; otherwise use the CSV's declared severity.

### 5. Determine Impact (Usage Count)

For each outdated artifact, run `search_code`/`search_graph` for its characteristic import/package prefix (e.g. `org.junit.Test` for JUnit 4, `org.junit.jupiter.api` for JUnit 5, `org.openqa.selenium` for Selenium) to count how many files actually use it — not just declare it as a dependency. An artifact declared but never imported (a stray transitive pin) is lower priority than one imported across 40 test files.

### 6. Compute Priority

```
priority = (severity_weight × impact_count) / (effort_weight × breaking_risk_weight)

severity_weight:  CRITICAL(CVE)=100, HIGH=40, MEDIUM=15, LOW=5
breaking_risk_weight: BREAKING=3, SAFE=1
effort_weight: single-file/manifest-only=1, multi-file mechanical rename=2, requires-code-refactor=4
```

Rank findings by this priority score, descending, within this run only (relative ranking, same convention as `rrd-audit-all`'s opportunity ranking — not an absolute cross-run scale).

### 7. Continue

Load `./step-03-report-and-propose.md`.
