# How to Build a TEA-Like BMad Module

A practical guide, written from actually building one (Refactor Radar / `rrd`), for teammates who want to build a module in the same shape as Test Architecture Enterprise (TEA) — `bmad-tea` (Murat) dispatching to `bmad-testarch-*` workflow skills.

This is not the only valid BMad module shape (a single agent-with-capabilities is simpler and often the right call — see "When NOT to use this pattern" at the end). Use this guide when you specifically want TEA's shape: **one persona/router agent + N independent workflow skills.**

---

## 1. The shape, in one picture

```
User → Persona/Router Agent → Workflow Skill's SKILL.md → steps/ (or steps-c/e/v)
                                                              ├─→ Knowledge Fragments (resources/*-index.csv → resources/knowledge/*.md)
                                                              ├─→ Templates & Checklists (*-template.*, checklist.md)
                                                              └─→ Outputs (docs/reports/diffs) → optionally Validation
```

One agent is the conversational front door. Everything it can *do* is a separate, independently-installable workflow skill. The agent doesn't do the work itself — it routes to whoever does.

## 2. Decide if this shape actually fits

Ask this before writing a single file: **do your capabilities share one discipline and one tool surface, but each deserve to be run standalone, without the persona attached?**

- If yes → this pattern. (Refactor Radar: 5 detectors, one evidence/diff discipline, each independently runnable.)
- If your capabilities are tightly conversational and always run through the persona anyway → a single agent-with-capabilities is simpler and has less to maintain. Don't split just to look like TEA.

We got this wrong once mid-project (over-engineered a memory-agent-with-inline-capabilities first, then rebuilt as TEA-shape) — decide this up front if you can.

## 3. File tree — verified against the real, installed TEA module

### The persona/router agent (`bmad-tea` equivalent)

```
{code}-agent-{name}/
├── SKILL.md                    # persona, mission, activation, menu — stateless (no sanctum)
├── customize.toml               # [agent] metadata + [[agent.menu]] dispatch table
└── resources/
    ├── {code}-index.csv         # id,name,description,tags,tier,fragment_file
    └── knowledge/*.md           # one fragment per topic, loaded just-in-time
```

**Key fact, verified by reading `bmad-tea/SKILL.md`:** Murat is *stateless* — no sanctum, no memory, no First Breath. The persona is re-established fresh every session from `SKILL.md` + `customize.toml`. Don't default to a memory agent here unless you have a real cross-session reason.

### Each workflow skill (`bmad-testarch-atdd` equivalent)

```
{code}-{workflow-name}/
├── SKILL.md            # persona INHERITANCE, not re-declaration — see below
├── customize.toml       # [workflow] override surface
├── workflow-plan.md     # design reference: step order + outputs (easy to forget — see §5)
├── workflow.yaml        # config_source, instructions/validation/template pointers
├── instructions.md      # overview + workflow-architecture explanation
├── checklist.md         # validation criteria for outputs
├── steps-c/             # Create mode (or plain steps/ — see §4)
├── steps-e/             # Edit mode (only if editing an existing artifact is meaningful)
├── steps-v/             # Validate mode (only if re-validating without re-running is meaningful)
└── resources/
    ├── {code}-index.csv    # THIS SKILL'S OWN COPY — not a pointer to the agent's
    └── knowledge/*.md       # THIS SKILL'S OWN COPY of whichever fragments it needs
```

**The mistake we actually made and had to fix:** the first build pointed every workflow skill's knowledge loading at `{skill-root}/../{agent-skill}/resources/knowledge/...` — reaching outside its own folder into the agent's. This breaks the entire point: **every real TEA workflow skill carries its own local copy** of `resources/{tea-index.csv}` + `resources/knowledge/*.md` (verified: `bmad-testarch-atdd/resources/knowledge/` exists independently of `bmad-tea/resources/knowledge/`). A skill that isn't self-contained can't be installed or distributed on its own — which defeats the reason to split into workflow skills at all. **Copy the fragments each workflow needs into its own `resources/`. Never reference a sibling skill's internals by relative path.**

### Persona inheritance — say it once, don't re-declare

Real `bmad-testarch-atdd/SKILL.md` says, verbatim in spirit:

> "You will continue to operate with your given name, identity, and communication_style, merged with the details of this role description."

Each workflow skill's `SKILL.md` should do the same: state its specific role in one or two sentences, then explicitly continue whatever persona is already active (or fall back to a named default if none is). **Do not copy the full persona description into every workflow skill.** If you find yourself repeating "terse, evidence-first, shows its work" in 5 files, stop — that belongs in the persona agent only.

## 4. Single-mode vs. tri-modal steps — a real decision, not a default

TEA's `steps-c/steps-e/steps-v` split exists because those workflows produce a **durable, editable artifact** (a test-design doc, a scaffolded framework) where "edit the existing thing" and "validate the existing thing" are genuinely different operations from "create it fresh."

If your workflow's output doesn't have that shape — e.g. a detection/analysis run where re-running *is* the only meaningful "update" — don't force tri-modal. Use plain sequential `steps/step-01-*.md`, `step-02-*.md`, ... (the same micro-step-file convention `bmad-create-architecture` uses elsewhere in BMad). **State the deviation explicitly in `instructions.md`** — one sentence explaining why there's no Edit/Validate mode — so it reads as a decision, not a gap. Anyone reviewing your module later (including future-you) needs to be able to tell "we chose this" from "we forgot this."

## 5. The file everyone forgets: `workflow-plan.md`

Every real `bmad-testarch-*` skill has one. It's small — just the step order and the output paths — but it's part of the canonical shape and a generic project linter won't catch its absence (it only flags things it has a rule for). Check for it explicitly:

```markdown
# Workflow Plan: {skill-name}

## Single Mode (steps) — or ## Create Mode (steps-c), etc.
- step-01-....md
- step-02-....md

## Outputs
- {output-path}
```

## 6. Module-level config — and where the generic tooling disagrees with TEA

Real TEA workflows read a **module-level config file**: `workflow.yaml`'s `config_source: "{project-root}/_bmad/{module-code}/config.yaml"` — not a generic unified file. If your project's module-authoring tooling (e.g. `bmad-module-builder`'s scaffold scripts) has since moved to writing one unified `{project-root}/_bmad/config.yaml` with per-module sections, you have two honest options:

1. **Write both.** Let the unified file be the source of truth (so the generic tooling stays happy), and have your setup skill also write a thin mirror at `_bmad/{module-code}/config.yaml` with just the values your workflows need — for TEA-shape structural fidelity. Document *why* you're doing this in the setup skill itself, not just in your head.
2. **Accept the drift.** Point your `workflow.yaml`s at the unified file's module section directly instead. Simpler, but you're no longer byte-for-byte matching TEA's `config_source` convention.

We went with option 1. Either is defensible — just make the choice on purpose and write down why.

## 7. Before you run any generic setup/cleanup script: read it first

This is the sharpest edge we hit. Module-authoring tools that scaffold a "setup skill" often include a cleanup step to remove now-redundant legacy installer directories once your skills are confirmed installed elsewhere. **Read exactly what it deletes before running it — especially anything with a hardcoded scope wider than your own module** (e.g. a script that unconditionally targets a shared `core/` directory or an `--also-remove` flag pointed at a directory other modules also depend on). A generic scaffold template is written for *a* migration topology; it may not match how *your* project is actually organized, and destructive filesystem operations don't ask twice. If in doubt, do the setup manually and skip the automated cleanup step entirely — writing your own module's config by hand is a few minutes; recovering a shared config directory that got `rmtree`'d is not.

## 8. Getting it from "built" to "usable"

Module-authoring tools (in this project: `bmad-module-builder`) typically write new skills to an *authoring output folder* (e.g. `{project-root}/skills/`), **not** to wherever your coding agent actually discovers invocable skills (e.g. `.claude/skills/`). Building the files is not the same as installing them. The last step — copying each finished skill folder into the real skills directory — is easy to forget precisely because nothing errors if you skip it; the module just silently doesn't show up as invokable.

## 9. Validate structurally, then validate by running it

- Run whatever structural validator your tooling provides (module completeness, CSV integrity, roster-vs-`customize.toml` drift) — but don't fully trust it. We found it checking for CSV columns (`after`/`before`) that don't match what real installed modules actually use (`preceded-by`/`followed-by`) — a bug in the validator itself, discovered by comparing against real files instead of trusting the tool's own assumptions.
- Then actually run the thing end-to-end at least once: activate the persona, let it dispatch to one workflow, confirm config resolves, confirm knowledge loads from the right place. A clean structural validation is not proof the module works — only a real run is.

## 10. When NOT to use this pattern

- Your capabilities are few (2-3), always used together, and don't need independent installability → one agent with inline capabilities is less to maintain.
- You need cross-session memory that's core to the value (e.g. "don't re-flag something I already told you about") → know that TEA's persona agents are stateless by convention; if you need memory, that's a deliberate deviation from TEA-fidelity, not a bug — decide it consciously (we did, then reversed it for structural-fidelity reasons — either direction is legitimate, just be explicit about which you're choosing and why).

---

*Written after building Refactor Radar (`rrd`) — a real 6-skill module (1 persona agent + 4 detectors + 1 audit-all workflow, plus a setup skill) that hit every pitfall in this guide at least once before being fixed.*
