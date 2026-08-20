---
name: 'step-02-investigate'
description: 'Scan build/dependency manifests for pinning/centralization discipline, cross-reference curated CVE/breaking-migration knowledge, and treat any live version check as an unverified pointer'
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

### 3. Structural Discipline Checks (Primary, Fully Reliable — No External Call)

Before touching any external source, check what's verifiable from the repo alone:

- **Unpinned version**: `LATEST`, `RELEASE`, an open version range, or an unexplained `-SNAPSHOT` on a dependency or plugin. Report as its own finding — see step 7 for the plugin-specific case.
- **Duplicate version declaration**: the same `(group, artifact)` version set in more than one place — a parent POM property, a BOM import, a `dependencyManagement` entry, and/or a local `<version>` tag. Report as its own LOW/MEDIUM finding ("duplicate version declaration") regardless of whether the value is outdated — per `detect-tech-versions.md` §7. If the duplicates disagree, say so explicitly; that's a real drift risk, not a cosmetic one.

These findings carry full confidence — no caveat needed, no external dependency, nothing to verify further.

### 3b. Live "Latest Version" Check (Best-Effort Pointer Only — Never Asserted as Fact)

No free live source is reliably correct: direct Maven Central metadata fetches can return HTTP 403; `search.maven.org`'s `core=gav` mode can return a stale/wrong version; its default-core `latestVersion` field can return a pre-release as if it were current; and independent lookups can disagree with each other with no tiebreaker. Treat any live check as a **candidate, not a verified fact**:

- Attempt one lookup per artifact (`WebSearch` for the package name plus "latest version," or a registry endpoint if reachable) and record the source.
- Present the result as `candidate — verify before applying, per {source}`, never as a bare version number implying it's confirmed current.
- If the lookup fails or disagrees with another source you happen to have checked, say so plainly rather than picking one silently.
- **Do not fall back to `./resources/version-database.csv` as if it were a live answer.** The CSV is for CVE/severity/toolchain judgment (step 4), not a version list — presenting its `latest_safe_version` column as "the current version" is the same overclaiming this step exists to avoid.
- This step never blocks or degrades the structural findings from step 3 — those stand on their own regardless of whether a live check succeeds.

### 4. Cross-Reference Curated Knowledge (CVE, Breaking-Change Risk)

Look up the same `(group, artifact)` pair in `./resources/version-database.csv` for:

- `severity`/`cve`/`cve_fixed_in` — if `cve` is populated for the current version, this is CRITICAL regardless of anything else, and the proposed fix targets `cve_fixed_in`, not whatever step 3b's best-effort candidate happened to return.
- Whether the pair is a known agent/weaving/toolchain-risk artifact (§6 of `detect-tech-versions.md`).

If the artifact isn't in the CSV, that's fine — the structural checks (step 3) don't depend on it, and CVE/severity data simply isn't available for that artifact (say so, don't guess). State the not-in-CSV count once at the end, not per-artifact.

### 5. Classify Breaking-Change Risk

For every outdated match, consult `./resources/knowledge/detect-tech-versions.md`'s hardcoded migration-rules table (JUnit 4→5, Selenium 3→4, Playwright major jumps, Java 8→11/17/21). If the current→target version pair crosses a documented breaking boundary, classify as **HIGH** (breaking) regardless of the CVE/severity column; otherwise use the CSV's declared severity, or MEDIUM by default if the artifact has no CSV entry (per step 4).

### 5b. Toolchain Compatibility Check (Java/JVM Runtime Bumps Only)

Before finalizing a SAFE classification for any Java/JVM runtime version change, grep the manifest(s) and surefire/failsafe plugin config for the agent/weaving/bytecode-manipulation watchlist in `./resources/knowledge/detect-tech-versions.md` §6 (`aspectjweaver`/`aspectj-maven-plugin`, `cglib`/`byte-buddy`/`javassist`, `lombok`, `jacoco-maven-plugin`'s javaagent). If any is present, downgrade the classification to **MEDIUM-RISK (toolchain verification required)** and note in the finding that the agent's own version must be confirmed compatible with the target JDK before the bump is applied standalone. This check exists because a prior run classified a Java 11→21 bump as SAFE on a project using `aspectjweaver`, applied it, and the test suite crashed at class-load time (`VerifyError`) — a failure this table would have caught.

### 5c. Effective Version Resolution

For any dependency whose version isn't a local `<version>` tag on the `<dependency>` itself, note whether it comes from a parent POM, a `dependencyManagement` entry, or a BOM import (per `./resources/knowledge/detect-tech-versions.md` §7). Don't propose a diff at a location that doesn't actually declare the version — target the BOM/property/parent entry that does.

### 6. Determine Impact (Usage Count)

For each outdated artifact, run `search_code`/`search_graph` for its characteristic import/package prefix (e.g. `org.junit.Test` for JUnit 4, `org.junit.jupiter.api` for JUnit 5, `org.openqa.selenium` for Selenium) to count how many files actually use it — not just declare it as a dependency. An artifact declared but never imported (a stray transitive pin) is lower priority than one imported across 40 test files.

**Exception — agent/reflection-loaded artifacts don't get penalized for a low static-import count.** Load-time weaving agents and `ServiceLoader`-loaded implementations are used without a static `import` anywhere in the codebase by design. For any artifact on the §6 watchlist (or otherwise known to be agent/reflection-loaded), don't treat a 0-or-low import count as "low impact" — note explicitly that usage is structural/agent-based and impact should be judged by whether the agent is active in the build (present in `<argLine>`/plugin config), not by import count.

### 7. Plugin Version Pinning

While scanning, also flag any build-plugin entry (`<plugin>`/`plugins { }`) declared with `LATEST`, `RELEASE`, an open version range, or an unexplained `-SNAPSHOT`. Report as a LOW/MEDIUM "unpinned plugin version" finding per `./resources/knowledge/detect-tech-versions.md` §8 — reproducibility risk, not a CVE or migration issue, so it doesn't go through the severity/breaking-risk formula below; list it separately in the report.

### 8. Compute Priority

```
priority = (severity_weight × impact_count) / (effort_weight × breaking_risk_weight)

severity_weight:  CRITICAL(CVE)=100, HIGH=40, MEDIUM=15, LOW=5
breaking_risk_weight: BREAKING=3, SAFE=1
effort_weight: single-file/manifest-only=1, multi-file mechanical rename=2, requires-code-refactor=4
```

Rank findings by this priority score, descending, within this run only (relative ranking, same convention as `rrd-audit-all`'s opportunity ranking — not an absolute cross-run scale).

### 9. Continue

Load `./step-03-report-and-propose.md`.
