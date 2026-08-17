# BMad TEA-Shape Module — Agent Build Spec

Generic, tool-agnostic specification for scaffolding a BMad module in the "Test Architecture Enterprise" (TEA) shape: **one persona/router agent + N independent workflow skills**. Written to be fed directly to a coding agent as a build instruction, not as narrative documentation.

Fill in every `{placeholder}` before or during the build. Follow sections in order — later sections assume earlier decisions are already made.

---

## 0. Required inputs before starting

Do not proceed past this section until every value below is decided (ask the human if any are missing):

| Placeholder | Meaning | Example |
|---|---|---|
| `{module_code}` | 2-4 lowercase letters, unique in the project | `rrd` |
| `{module_name}` | Human-readable display name | `Refactor Radar` |
| `{persona_name}` | The router agent's name | `Ray` |
| `{persona_title}` | The router agent's role title | `Refactor Detective` |
| `{persona_icon}` | Single emoji | `🔍` |
| `{workflow_1..N}` | kebab-case names for each capability, prefixed `{module_code}-` | `rrd-detect-dependencies` |
| `{tool_surface}` | The external tools/APIs every workflow will call | `codebase-memory-mcp MCP tools` |

**Decision gate — confirm this shape actually fits before building anything:**
Build this shape only if ALL of the following are true:
- There are 2+ genuinely independent capabilities that should be installable/runnable standalone, without the persona attached.
- All capabilities share one tool surface and one behavioral discipline (the same "how to behave" rules apply to each).
- No capability needs cross-session memory as its core value proposition (if one does, that's a deliberate, documented deviation — see §7).

If these don't hold, stop and build a single agent-with-capabilities instead (simpler, less to maintain, no split needed).

---

## 1. File tree to produce

Produce exactly this structure. `{skill-root}` below always means "this skill's own folder" — never a sibling folder.

```
{module_code}-agent-{persona_name_lowercase}/          # the persona/router — see §2
├── SKILL.md
├── customize.toml
└── resources/
    ├── {module_code}-index.csv
    └── knowledge/
        └── {topic}.md                                  # one per shared behavioral rule / heuristic domain

{workflow_1}/                                            # one folder per workflow — see §3
├── SKILL.md
├── customize.toml
├── workflow-plan.md
├── workflow.yaml
├── instructions.md
├── checklist.md
├── steps/                                                # OR steps-c/ + steps-e/ + steps-v/ — decide per §4
│   ├── step-01-*.md
│   ├── step-02-*.md
│   └── step-0N-*.md
└── resources/
    ├── {module_code}-index.csv                          # THIS WORKFLOW'S OWN COPY
    └── knowledge/
        └── {topic}.md                                    # THIS WORKFLOW'S OWN COPY of whichever fragments it needs

... (repeat the workflow folder for every {workflow_1..N})

{module_code}-setup/                                      # module installer — see §6
├── SKILL.md
├── assets/
│   ├── module.yaml
│   └── module-help.csv
└── scripts/
    ├── merge-config.py
    └── merge-help-csv.py
```

**Non-negotiable rule:** every workflow folder's `resources/` is a full, independent copy. Never write a path that reaches into a sibling skill folder (no `{skill-root}/../{other-skill}/...` anywhere, in any file). A skill that isn't self-contained can't be installed or distributed independently, which defeats the entire reason to split into workflow skills.

---

## 2. Build the persona/router agent

**Type:** stateless agent. No sanctum, no memory folder, no First Breath onboarding, no PULSE. The persona is re-established fresh every session from `SKILL.md` + `customize.toml` alone. Do not default to a memory architecture here — only add one if §7's deviation criteria are explicitly met and documented.

### `SKILL.md` must contain, in order:
1. **Frontmatter:** `name: {module_code}-agent-{persona_name_lowercase}`, `description:` one sentence ending in "Use when the user asks to talk to {persona_name}, requests the {persona_title}, or {trigger phrase}."
2. **Overview:** who `{persona_name}` is, in 2-4 sentences — personality, communication style, the one non-negotiable behavioral rule.
3. **Conventions** section — boilerplate, copy verbatim:
   ```markdown
   - Bare paths (e.g. `resources/{module_code}-index.csv`) resolve from the skill root.
   - `{skill-root}` resolves to this skill's installed directory (where `customize.toml` lives).
   - `{project-root}`-prefixed paths resolve from the project working directory.
   - `{skill-name}` resolves to the skill directory's basename.
   ```
4. **On Activation** — 8 steps: (1) resolve the `[agent]` customization block via the project's resolver script (fallback: read `customize.toml` → team override → user override, merge), (2) run prepend steps, (3) adopt the persona from the Overview + resolved `{agent.role}`/`{agent.identity}`/`{agent.communication_style}`/`{agent.principles}`, (4) load persistent facts, (5) load module config, (6) greet the user by name with the icon prefix, (7) run append steps, (8) present the menu (`{agent.menu}` — code/description/dispatch-skill columns) or dispatch directly if intent is already clear from the user's message.
5. **Critical Actions** — tells the agent to consult its own `resources/{module_code}-index.csv` and load only the knowledge fragments needed for the current task, just-in-time.

### `customize.toml` must contain:
- `[agent]` block: `name`, `title`, `icon` (all fixed at build time — not deferred to a First Breath, since this is stateless)
- `role`, `identity`, `communication_style`, `principles` (array) — the substance of the persona
- `[[agent.menu]]` array — one entry per workflow skill: `code` (2-letter), `description`, `skill` (the workflow's folder name)

### `resources/{module_code}-index.csv`:
Header exactly: `id,name,description,tags,tier,fragment_file`. One row per knowledge fragment. Keep it a clean, minimal CSV — no padded blank rows, no unnecessary quoting.

### `resources/knowledge/*.md`:
One fragment per **shared behavioral rule** (the discipline every workflow must follow — write this once, reference it everywhere) and one per **domain heuristic** (the substance each workflow needs to do its job well). Fragments should be outcome-focused, not procedural — describe what good looks like, not mechanical steps.

---

## 3. Build each workflow skill

**Type:** workflow, not agent. It inherits whatever persona is active — it does not declare its own.

### `SKILL.md` must contain:
1. **Frontmatter + Goal/Role header:**
   ```markdown
   **Goal:** {one-sentence outcome}
   **Role:** You are the {persona_title}.
   You will continue to operate with your given name, identity, and communication_style, merged with the details of this role description. If no persona is active yet, continue as {persona_name} — {one-clause fallback description}.
   ```
   **Do not** paste the full persona description here. State the role in one or two sentences and explicitly continue whatever is already active.
2. **Conventions** — same boilerplate as §2, plus: `Resolve sibling workflow files such as instructions.md, checklist.md, and steps/... from {skill-root}.`
3. **On Activation** — 6 steps: (1) resolve the `[workflow]` customization block, (2) prepend steps, (3) persistent facts, (4) load module config (same config source as the persona agent — see §6), (5) greet, (6) append steps. Then: "Begin the workflow below."
4. **Workflow Architecture** — one paragraph stating whether this is single-mode or tri-modal (see §4) and why.
5. **Initialization Sequence** — "Load `{skill-root}/steps/step-01-*.md` (or `steps-c/step-01-*.md`) and proceed sequentially."

### `customize.toml`:
`[workflow]` block with `activation_steps_prepend`/`activation_steps_append` (usually empty arrays) and `persistent_facts` (usually `["file:{project-root}/**/project-context.md"]`).

### `workflow-plan.md` — do not skip this file:
```markdown
# Workflow Plan: {workflow-name}

## Single Mode (steps) — or ## Create Mode (steps-c), ## Edit Mode (steps-e), ## Validate Mode (steps-v)
- step-01-....md
- step-02-....md

## Outputs
- {output-path}
```

### `workflow.yaml`:
```yaml
name: {workflow-name}
description: '{one sentence}. Use when the user says "{trigger phrase}"'
config_source: "{project-root}/_bmad/{module_code}/config.yaml"
output_folder: "{config_source}:output_folder"
user_name: "{config_source}:user_name"
communication_language: "{config_source}:communication_language"
document_output_language: "{config_source}:document_output_language"
date: system-generated
installed_path: "."
instructions: "./instructions.md"
validation: "./checklist.md"
template: "./{template-file}"          # omit if no template needed
variables:
  {var_name}: "{default or path}"
default_output_file: "{output-path-with-placeholders}"
required_tools:
  - {tool_name}
```

### `instructions.md`:
```markdown
<!-- Powered by BMAD-CORE™ -->
# {Workflow Display Name}
**Version:** 1.0 (Step-File Architecture)
---
## Overview
{2-4 sentences: what this workflow finds/produces and why it matters}
This workflow applies the shared behavioral discipline, carried locally in this skill's own `./resources/knowledge/{shared-fragment}.md` (the same fragment the persona agent references — kept in sync across skills, not a cross-folder pointer): {one-sentence restatement of the discipline}.
---
## WORKFLOW ARCHITECTURE
{state single-mode or tri-modal and why, per §4}
---
## INITIALIZATION SEQUENCE
### 1. Configuration Loading
From `workflow.yaml`, resolve: {list the vars}.
### 2. First Step
Load, read completely, and execute: `{skill-root}/steps/step-01-*.md`
```

### `checklist.md`:
Sections: **Prerequisites** (config/tool preconditions, knowledge fragments loaded), **Investigation/Execution** (what must be checked/run), **Findings and Proposals** or **Outputs** (what must be produced and how it's evidenced), **Completion Criteria** (output paths written). Every checklist item is a checkbox, not prose.

### `steps/` (or `steps-c/`+`steps-e/`+`steps-v/`):
Each step file frontmatter: `name`, `description`, `nextStepFile` (or `null` on the last step). Body: `## STEP GOAL`, `## SEQUENCE` (numbered actions), final numbered action always "load the next step file" (or "workflow complete" on the last one).

**Step 1 of every workflow must, at minimum:** resolve/confirm any required external target (project, resource, whatever this workflow operates on) exists and is ready — halt with a clear instruction if not — then load this workflow's own local knowledge fragments from `./resources/knowledge/`, never from a sibling skill's folder.

### `resources/{module_code}-index.csv` + `resources/knowledge/*.md`:
Copy only the fragments this specific workflow needs from the persona agent's full set. Do not symlink, do not reference by relative path outside this folder — physically copy the files.

---

## 4. Single-mode vs. tri-modal — decide explicitly, per workflow

Ask: **does this workflow produce a durable, editable artifact where "edit the existing thing" and "validate the existing thing without redoing the work" are both meaningful, distinct operations from "create it fresh"?**

- **Yes** (e.g. a design doc, a scaffolded config) → tri-modal: `steps-c/` (create), `steps-e/` (edit existing output), `steps-v/` (validate existing output against `checklist.md` without re-running). `SKILL.md`'s Initialization Sequence presents a mode menu: `[C] Create / [R] Resume / [V] Validate / [E] Edit`, routing to the matching folder's `step-01`.
- **No** (e.g. an analysis/detection run where re-running is the only meaningful "update") → single-mode: plain `steps/step-01-*.md`, `step-02-*.md`, ... State the reasoning in `instructions.md`'s Workflow Architecture section — one sentence, e.g. "single-mode: there's no natural 'edit an existing finding,' only 're-run.'" **Never leave this undocumented** — a missing Edit/Validate mode should read as a decision, not a gap.

---

## 5. Templates and checklists — flat, not nested

Any output template file (e.g. an HTML report template, a checklist-output template) sits **flat at the workflow skill's root**, referenced by `workflow.yaml`'s `template:` field — not inside a `templates/` subfolder. This matches the real installed convention; don't introduce a nesting level that isn't there.

---

## 6. Build the module-level setup skill

**Type:** installer, not persona, not workflow. One per module, named `{module_code}-setup`.

### `assets/module.yaml`:
```yaml
code: {module_code}
name: "{module_name}"
description: "{one sentence}"
module_version: 1.0.0
default_selected: false
module_greeting: >
  {message shown after setup completes — mention the persona by name and how to invoke it}

agents:
  - code: {module_code}-agent-{persona_name_lowercase}
    name: "{persona_name}"
    title: "{persona_title}"
    icon: "{persona_icon}"
    description: "{one sentence, matching the persona's customize.toml description exactly}"

variables:
  - key: {config_var_name}
    prompt: "{question shown at setup time}"
    default: "{default value}"
```
**List only true persona agents under `agents:`.** Workflow skills never get roster entries here.

### `assets/module-help.csv`:
Header: `module,skill,display-name,menu-code,description,action,args,phase,preceded-by,followed-by,required,output-location,outputs`

**Use `preceded-by`/`followed-by` as the column names — verify this against your project's actual installed modules' help CSVs before trusting any generic scaffolding tool's own template or validator, which may not agree with each other.** One row per skill (the persona agent + each workflow + the setup skill's own `configure` action).

### Before running any generated setup/cleanup script — read it first:

Generic module-scaffolding tools often include a "clean up legacy installer files" step once a module's skills are confirmed installed elsewhere. **Before executing any such script, read exactly what directories/files it targets.** Specifically check for:
- Hardcoded scope wider than just `{module_code}` (e.g. a script that unconditionally also targets a shared directory like `core/` regardless of which module you're installing)
- Flags that remove directories shared across multiple modules (anything resembling `--also-remove {shared-dir}`)

If the script's scope is wider than your own module, **do not run it**. Write your module's config manually instead (a few minutes of work) — recovering a shared directory a script deleted is not a few minutes of work. This applies even if the script has a "safety check" — verify what that check actually guards against (it may only confirm skills are installed elsewhere, not that the directory it's about to delete is safe to delete).

---

## 7. Deviating from this spec

Every deviation from this spec is allowed — but must be a decision, written down, not a silent gap:

- **Adding cross-session memory to the persona agent** (sanctum, First Breath) is a deviation from §2's stateless default. Valid if the module's core value depends on remembering across runs (e.g. "don't re-report something already resolved"). Document the tradeoff explicitly: what's gained, what's given up (typically: structural simplicity and independent-installability of the persona itself, since a memory agent's sanctum path becomes a dependency).
- **Adding tri-modal to a workflow that doesn't clearly need it, or skipping it where it clearly does** — see §4's decision test; don't default either direction without applying it.
- **Module config location drift** — if your project's scaffolding tooling writes a unified `_bmad/config.yaml` instead of TEA's per-module `_bmad/{module_code}/config.yaml`, either (a) write both (unified file as source of truth, plus a thin mirror at the module-level path for structural fidelity — document why in the setup skill), or (b) point every workflow's `config_source` at the unified file's module section directly and accept you're no longer byte-for-byte matching TEA's convention. Either is defensible; pick one on purpose.

---

## 8. Verify before calling it done

1. **Structural:** every workflow skill's `resources/` is self-contained — grep every file in the module for any path reaching into a sibling skill's folder (`\.\./{other-skill-name}` or a bare `{other-skill-name}/resources/...`). Zero hits required.
2. **`workflow-plan.md` exists in every workflow folder** — easy to miss, no generic linter catches its absence.
3. **Run whatever structural validator the project's tooling provides — but don't fully trust it.** Compare its assumptions (e.g. required CSV column names) against your project's actual, already-installed modules before treating a validator finding as ground truth.
4. **Install, don't just build.** Module-authoring tools typically write new skills to an authoring output folder, not to wherever the coding agent actually discovers invocable skills. Copy every finished skill folder to the real skills directory as an explicit last step — nothing errors if this is skipped, the module just silently never appears as invokable.
5. **Run it for real, at least once end-to-end**, before considering the module done: activate the persona, let it dispatch to one workflow, confirm config resolves, confirm knowledge loads from the workflow's own `resources/`. A clean structural validation is not proof the module works.
