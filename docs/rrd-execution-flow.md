# Refactor Radar — Execution Flow, In Detail

A precise trace of how `rrd` actually runs, file by file, so future changes land in the right place. Written after tracing a real run (`/rrd-audit-all` against `C-Users-achaabane-Desktop-BMAD_cursor`).

## 0. The one thing to know before anything else: two locations, kept in sync manually

Every skill in this module exists in **two places on disk**:

| Location | Role |
|---|---|
| `{project-root}/skills/rrd-*/` | **Authoring copy** — what `bmad-module-builder`/`bmad-agent-builder` write to. Not read by the harness at runtime. |
| `{project-root}/.claude/skills/rrd-*/` | **Installed copy** — what Claude Code actually discovers and executes. This is what runs when you invoke `/rrd-agent-radar` etc. |

**If you edit a behavior and it doesn't seem to take effect, you almost certainly edited the authoring copy and not the installed one, or vice versa.** There is no automatic sync between them — every edit needs to be applied to both (or applied to `.claude/skills/` directly if you don't care about the authoring copy staying current). This bit us once already (see `docs/tea-like-module-guide.md` §8).

There's also a third mirrored location pattern used by other BMad modules in this project (`.agents/skills/`, `.kiro/skills/`) for other coding-agent integrations — `rrd` was only installed to `.claude/skills/`, since that's what this session uses. If colleagues use a different tool, they'd need their own copy there too.

---

## 1. Entry point

Invocation happens one of two ways:
- **Slash command**: `/rrd-agent-radar`, `/rrd-detect-dependencies`, `/rrd-audit-all`, etc. — the harness matches the typed name against `.claude/skills/*/SKILL.md` frontmatter `name:`.
- **Natural language**: the harness's system reminder lists each skill's frontmatter `description:` (the "Use when..." clause) and the current model chooses to invoke it based on that description matching user intent.

Either path lands you at that skill's `SKILL.md`, read top to bottom.

**To change what triggers a skill:** edit the frontmatter `description:` field in that skill's `SKILL.md` (both locations).

---

## 2. Ray's activation (`rrd-agent-radar/SKILL.md`)

Eight numbered steps, executed in order every time Ray is invoked (he's stateless — this runs fresh every session, nothing is cached):

### Step 1 — Resolve the Agent Block
Runs `{project-root}/_bmad/scripts/resolve_customization.py --skill {skill-root} --key agent`. This script reads, in order:
1. `rrd-agent-radar/customize.toml` (the base — the file shown above, with `[agent]` metadata, `role`/`identity`/`communication_style`/`principles`, and the `[[agent.menu]]` array)
2. `{project-root}/_bmad/custom/rrd-agent-radar.toml` (team override — doesn't exist yet in this project)
3. `{project-root}/_bmad/custom/rrd-agent-radar.user.toml` (personal override — doesn't exist yet)

...and merges them: scalars (like `icon`) let an override win outright; arrays (`principles`, `persistent_facts`) get overrides appended to the base; the `[[agent.menu]]` array merges **by `code`** — an override entry with `code = "DD"` replaces the base's `DD` entry in place, a new code appends a new menu item.

**Output:** a single resolved JSON object (we verified this directly — see the tool-call output earlier in this conversation) containing the merged `name`, `title`, `icon`, `role`, `identity`, `communication_style`, `principles`, and `menu` array.

**To change Ray's personality, tone, or non-negotiable rules:** edit `principles`, `identity`, or `communication_style` in `customize.toml` directly (no override file needed unless you want per-team/per-user variation without touching the shipped default).

**To add/remove/reorder a detector in Ray's menu:** edit the `[[agent.menu]]` array in `customize.toml`. Each entry needs `code`, `description`, and `skill` (the exact folder name of the workflow skill to dispatch to). Adding an entry here does **not** create the workflow skill itself — that's a separate build step (§4 below covers what a workflow skill needs).

### Steps 2-4 — Prepend steps, adopt persona, persistent facts
`activation_steps_prepend` is empty (nothing runs here currently). Persona adoption merges the `SKILL.md` Overview's fixed description with the resolved `role`/`identity`/`communication_style`/`principles` from Step 1. `persistent_facts` is `["file:{project-root}/**/project-context.md"]` — glob-expanded; since no `project-context.md` exists in this project, nothing loads.

**To make Ray always aware of some standing fact** (an org policy, a naming convention): add a literal string or a `file:`-prefixed glob to `persistent_facts` in `customize.toml`.

### Step 5 — Load Config
Reads `{project-root}/_bmad/rrd/config.yaml` directly (a plain YAML file, not a script) — currently:
```yaml
rrd_artifacts: "{project-root}/_bmad-output/rrd-artifacts"
output_folder: "{project-root}/_bmad-output"
user_name: Achaaben
communication_language: English
document_output_language: English
```

**To change where Ray writes output, or the greeting language:** edit this file directly. **Important:** this file is a hand-maintained mirror (see §6) — if you ever re-run `rrd-setup`, it gets regenerated from `_bmad/config.yaml`'s `rrd:` section + `_bmad/config.user.yaml`, so edit those two files instead if you want the change to survive a re-setup, or edit both to keep them consistent.

### Steps 6-8 — Greet, append steps, present/dispatch menu
Greets using `user_name`/`communication_language` from Step 5, prefixed with the resolved `icon`. `activation_steps_append` is empty. Then: if the user's message already names an intent matching a menu item (as in `"detect dependencies in project X"`), **skip straight to dispatch** — no menu shown. Otherwise render the `menu` array from Step 1 as a numbered table and wait for a reply.

**Dispatch mechanics:** "dispatch" means invoking the `skill` named in the matched menu entry — i.e. a fresh `Skill` call to e.g. `rrd-detect-dependencies`, passing along any relevant context (like the target project name) as `args`. This is a real, separate skill invocation, not a function call within the same context — the workflow skill gets its own activation sequence from scratch (§3 below), it does not inherit Ray's loaded state directly. What *does* carry over is the **persona identity** conversationally (Ray's voice continues), because the workflow skill's own `SKILL.md` explicitly instructs it to continue as whatever persona is already active rather than resetting.

---

## 3. A workflow skill's activation (e.g. `rrd-detect-dependencies/SKILL.md`)

Six numbered steps — deliberately fewer than the persona agent's eight, because there's no persona to (re-)adopt here, no menu to present:

### Step 1 — Resolve the Workflow Block
Same resolver script, different key: `--key workflow`, reading `rrd-detect-dependencies/customize.toml`'s `[workflow]` block (currently just empty `activation_steps_prepend`/`activation_steps_append` arrays and the same `project-context.md` persistent-facts glob) merged with the same team/user override file pattern.

### Steps 2-3 — Prepend steps, persistent facts
Same mechanics as Ray's, scoped to this workflow's own `customize.toml`.

### Step 4 — Load Config
Reads the **same** `{project-root}/_bmad/rrd/config.yaml` file Ray reads — this is the shared module-level config, not per-workflow. Only pulls `user_name`/`communication_language` here (per this skill's own `SKILL.md` instructions) — the fuller set of variables (`rrd_artifacts`, `output_folder`, etc.) gets resolved separately via `workflow.yaml` once the steps start executing.

### Steps 5-6 — Greet, append steps
Then: "Activation is complete. Begin the workflow below" — which means reading `workflow.yaml`'s `Workflow Architecture` note (single-mode vs. tri-modal — this skill is single-mode) and loading `steps/step-01-preflight-and-init.md`.

**To change what config a workflow reads on activation:** edit the `### Step 4: Load Config` section of that workflow's `SKILL.md` — but be deliberate; changing the `config_source` path itself should also be reflected in `workflow.yaml`'s `config_source` field, since that's what the step files actually resolve variables against once execution starts.

---

## 4. Step-file execution — where the actual work happens

This is the layer you'll modify most often. For `rrd-detect-dependencies`, three files, executed strictly in sequence (each one's frontmatter `nextStepFile` points to the next):

### `steps/step-01-preflight-and-init.md`
1. Resolve target project — call `list_projects`/`index_status`; halt if not indexed.
2. Load knowledge fragments from **this skill's own** `./resources/knowledge/`: `evidence-and-diff-discipline.md` (the shared discipline) and `detect-dependencies.md` (this detector's specific heuristics).
3. Report readiness, load `step-02-investigate.md`.

**To change detection heuristics** (what counts as coupling, confidence thresholds, the reference example): edit `resources/knowledge/detect-dependencies.md` — **in this workflow's own folder**, and separately in every other copy of that same fragment (it's duplicated into `rrd-agent-radar/resources/knowledge/` and `rrd-audit-all/resources/knowledge/` too, by design — see `docs/tea-like-module-guide.md` §3 for why). There is no single source of truth file for a shared fragment; grep for the filename across the module to find every copy before calling an edit complete.

**To change the shared evidence/diff discipline** (the rule that binds all 5 workflows): same duplication caveat applies to `evidence-and-diff-discipline.md` — it exists in all 6 skill folders (the persona + 5 workflows). We already learned this the hard way once (the `search_code` tool-usage lesson had to be propagated to 12 file copies — 6 skills × 2 install locations).

### `steps/step-02-investigate.md`
The actual tool-calling logic: which `search_graph`/`query_graph`/`trace_path` calls to make, what counts as "confirmed" coupling vs. noise, how to classify and assign risk level.

**To change which MCP tools are called or how results are interpreted:** edit this file. This is where a change like "also check for X pattern" or "weight Y more heavily" goes.

### `steps/step-03-report-and-propose.md`
Writes the findings summary to `{rrd_artifacts}/detect-dependencies-{target_project}-{date}.md`, writes one diff-proposal file per finding to `{target_project_root}/proposals/`, then summarizes to the user. `{rrd_artifacts}` resolves from `_bmad/rrd/config.yaml` (§2 Step 5); `{target_project_root}` resolves from whichever project was named/resolved in step 1 — **not** this module's own project root.

**To change output file naming, location, or the diff-proposal format:** edit this file.

---

## 5. `rrd-audit-all` — the one workflow that's structurally different

Same 3-step shape (`preflight-and-init` → `run-detectors` → `rank-and-report`), but step 2 (`step-02-run-detectors.md`) re-applies **all four other workflows' heuristics inline**, reading from its own copies of all 5 knowledge fragments (`detect-dependencies.md`, `detect-instability.md`, `detect-data-issues.md`, `detect-duplication.md`, plus `evidence-and-diff-discipline.md`) rather than invoking the other 4 skills as separate dispatches.

**This is a real design implication worth knowing:** if you improve `detect-dependencies.md`'s heuristics inside the `rrd-detect-dependencies` workflow folder, **`rrd-audit-all`'s own copy of that same fragment does not automatically improve** — you must edit it there too, or Audit All will silently run a stale version of the heuristic. Same duplication caveat as §4, one level up.

Step 3 (`step-03-rank-and-report.md`) also references `{skill-root}/audit-report-template.html` — a flat HTML file with `{placeholder}`-style sections (summary table, one `<div class="family">` block per root-cause family, one `<div class="finding">` block per finding).

**To change the HTML report's look or structure:** edit `rrd-audit-all/audit-report-template.html` directly — it's the literal starting structure the step instructs the agent to fill in and adapt, not a strict mail-merge template with exact substitution points. A real rendered example (from the last live run) is at `proposals/refactor-radar-audit-2026-08-06.html` in the target project.

---

## 6. Module-level config — the file everything else depends on, and how it's produced

`{project-root}/_bmad/rrd/config.yaml` (read by both Ray and every workflow, §2/§3 Step 4/5) is **not** the primary source of truth — it's a mirror. The real source of truth is:

- `{project-root}/_bmad/config.yaml`'s `rrd:` section (written by `rrd-setup`, holds `rrd_artifacts` and module metadata)
- `{project-root}/_bmad/config.user.yaml` (holds `user_name`, `communication_language` — personal, gitignored-style settings)

`rrd-setup/SKILL.md` has an explicit extra step, beyond the generic scaffolded setup process, that writes the `_bmad/rrd/config.yaml` mirror from those two files' resolved values — this exists purely so the workflow skills can match TEA's real `config_source` convention (a module-level file) instead of reading the unified file directly. See `docs/tea-like-module-guide.md` §6 for the two-options reasoning behind this mirror existing at all.

**To change a config default for new installs:** edit `rrd-setup/assets/module.yaml`'s `variables:` section (currently just `rrd_artifacts`).
**To change the current live value:** you can either re-run `rrd-setup`, or — since we did the setup manually last time, skipping the generic scaffold's unsafe cleanup step — edit `_bmad/config.yaml`'s `rrd:` section and `_bmad/rrd/config.yaml` **both**, since nothing currently re-syncs them automatically outside of a full `rrd-setup` re-run.

---

## 7. Quick reference — "I want to change X, where do I go"

| Want to change... | Edit this file (remember: both `skills/` and `.claude/skills/` copies) |
|---|---|
| What triggers a skill (slash command / natural-language match) | That skill's `SKILL.md` frontmatter `description:` |
| Ray's tone, personality, non-negotiable rules | `rrd-agent-radar/customize.toml` (`identity`/`communication_style`/`principles`) |
| Ray's menu (add/remove/reorder detectors) | `rrd-agent-radar/customize.toml` (`[[agent.menu]]`) |
| A detector's heuristics / what counts as a finding | `{that-workflow}/resources/knowledge/{fragment}.md` **and every other copy of that same fragment** (grep the filename across the module first) |
| The shared evidence/diff discipline (binding on all 5 workflows) | `evidence-and-diff-discipline.md` in all 6 skill folders |
| Which MCP tools a detector calls, how it interprets results | `{that-workflow}/steps/step-02-*.md` |
| Output file naming / diff-proposal format | `{that-workflow}/steps/step-03-*.md` |
| Whether a workflow is single-mode or tri-modal | `{that-workflow}/instructions.md` (Workflow Architecture section) + restructure `steps/` vs `steps-c/e/v` accordingly |
| The HTML audit report's structure/styling | `rrd-audit-all/audit-report-template.html` |
| Where output artifacts get written | `_bmad/rrd/config.yaml` (`rrd_artifacts`) — and `_bmad/config.yaml`'s `rrd:` section to make it survive a re-setup |
| A new config default for fresh installs | `rrd-setup/assets/module.yaml` (`variables:`) |
| Module identity shown during setup / the agent roster | `rrd-setup/assets/module.yaml` |
| Help-system capability listing | `rrd-setup/assets/module-help.csv` |

**Before any edit that touches a shared knowledge fragment or the discipline file: grep the module for every copy first.** This is the single most common way a future change will silently not take effect everywhere it should.
