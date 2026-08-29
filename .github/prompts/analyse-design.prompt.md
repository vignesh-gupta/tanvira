---
name: "analyse-design"
description: "Read and analyse a Figma or Stitch design file, then scaffold a project directory with REQUIREMENTS, PRD, DESIGN, DB_SCHEMA, PLAN (DB → BE Test Contracts → Backend → FE Test Contracts → Frontend), ARCHITECTURE, and API_SPEC documents. Use when: analysing a design, generating project docs from Figma, generating project docs from Stitch, scaffolding a new project from a design file."
argument-hint: "Figma URL or Stitch project name/ID, project name, and optional output directory"
agent: "agent"
model: "Claude Sonnet 4.6 (copilot)"
tools:
  [vscode, execute, read, agent, edit, search, web, 'figma/*', browser, todo]
---

Analyse a Figma or Stitch design and generate a complete project documentation scaffold.

## Step 1 — Gather inputs

Before doing **any** work, confirm **all** of the following. If any are missing, stop and ask.

| Input           | Description                                        | Default                                                 |
| --------------- | -------------------------------------------------- | ------------------------------------------------------- |
| `design_source` | A Figma file URL **or** a Stitch project name / ID | — (required)                                            |
| `project_name`  | The folder name for the generated project          | — (required)                                            |
| `output_dir`    | Directory to write the docs into                   | `/generated/<project_name>`                             |
| `fe_stack`      | Frontend tech stack                                | React + TanStack Query + Tailwind CSS + Axios + Zustand |
| `be_stack`      | Backend tech stack                                 | Node.js (Express)                                       |
| `db_stack`      | Database / persistence layer                       | Prisma                                                  |

Ask the user about any custom tech stack **only** if they hinted at it in their message; otherwise proceed with the defaults.

---

## Step 2 — Detect & ingest the design

### Figma source

If `design_source` is a `figma.com` URL:

1. Parse the `fileKey` and `nodeId` from the URL (convert `-` → `:` in nodeId).
2. Call `get_metadata` to retrieve the file title, page names, and top-level frame list.
3. **Page selection** — After retrieving metadata:
   - **Always skip** any page whose name matches (case-insensitive): `cover`, `cover page`, `_cover`, `.cover`, `[cover]`, `readme`, `changelog`, or any page whose name starts or ends with the word `cover`. These pages exist for design presentation only and contain no product screens.
   - Display the remaining pages to the user in a numbered list.
   - Ask: *"The following pages were found in the Figma file — which would you like to analyse? Reply `all` to process every page, or list the page numbers or names you want (comma-separated)."*
   - Wait for the user's response before continuing.
   - Proceed only with the selected pages.
4. For **each selected page**:
   - Call `get_design_context` with that nodeId to extract components, layout, tokens, and reference code.
   - Call `get_screenshot` to capture a visual snapshot.
5. Call `get_libraries` to discover any shared component libraries or design tokens.
6. Call `get_variable_defs` to extract design tokens (colours, typography, spacing, etc.).

### Stitch source

If `design_source` is a Stitch project name or ID:

1. Locate the Stitch file in the workspace (common paths: `.stitch/`, `stitch/`, `designs/`).
2. Read the Stitch JSON/YAML manifest to enumerate screens, components, and tokens.
3. Extract screen names, layout descriptions, component trees, and any attached annotations.

### Synthesis

After ingesting, build an internal model covering:

- **Screens / pages** — names, purposes, primary user actions.
- **Components** — reusable UI elements, their variants and states.
- **Navigation flows** — how screens connect.
- **Design tokens** — colour palette, typography scale, spacing system.
- **Data requirements** — what data each screen reads or writes (inferred from the design).
- **User roles** — any role-based visibility inferred from the design.

---

## Step 3 — Create the project directory

```
<output_dir>/
  REQUIREMENTS.md
  PRD.md
  DESIGN.md
  DB_SCHEMA.md
  PLAN.md
  ARCHITECTURE.md
  API_SPEC.md
```

Create the directory and all seven files in one pass.

---

## Step 4 — Write the documents

### REQUIREMENTS.md

- **Purpose**: Raw functional and non-functional requirements distilled from the design.
- **Sections**:
  - `## Overview` — one-paragraph project summary.
  - `## Functional Requirements` — numbered list, one requirement per screen/user action.
  - `## Non-Functional Requirements` — performance, accessibility (WCAG 2.1 AA), security, scalability.
  - `## Assumptions` — anything inferred from the design that was not explicitly stated.
  - `## Open Questions` — gaps or ambiguities the team should resolve before build.

---

### PRD.md

- **Purpose**: Product requirements document for stakeholders and the engineering team.
- **Sections**:
  - `## Executive Summary`
  - `## Goals & Success Metrics`
  - `## User Personas & Roles` (from design role inference)
  - `## Feature List` — table with Feature, Priority (P0/P1/P2), Description, Acceptance Criteria.
  - `## Tech Stack` — **always present**; use the values confirmed in Step 1:
    ```markdown
    | Layer    | Technology |
    | -------- | ---------- |
    | Frontend | <fe_stack> |
    | Backend  | <be_stack> |
    | Database | <db_stack> |
    ```
  - `## Out of Scope`
  - `## Dependencies & Risks`
  - `## Release Milestones`

---

### DESIGN.md

- **Purpose**: Design handoff notes — a living reference for engineers.
- **Sections**:
  - `## Screen Inventory` — table: Screen Name | Route | Description | Key Components.
  - `## Component Catalogue` — list each reusable component with purpose and variants.
  - `## Navigation & Routing` — flow diagram (Mermaid `flowchart LR`).
  - `## Design Tokens` — colour palette, typography scale, spacing, border-radius, shadows.
  - `## Interaction & Animation Notes` — hover states, transitions, empty states, error states.
  - `## Accessibility Notes` — ARIA roles, keyboard navigation, contrast ratios.

---

### DB_SCHEMA.md

- **Purpose**: Authoritative database schema reference — the single source of truth for the data model. Keep it **high-level**: tables, fields, keys, and relationships only. **Do not write any SQL** (no `CREATE TABLE`, no `CREATE INDEX`, no DDL/DML). No schema detail should appear in any other file; PLAN.md and ARCHITECTURE.md must reference this file instead.
- **Sections**:
  - `## Entity Overview` — table listing every entity: Entity Name | Table | Purpose | Key Relations.
  - `## Schema Definitions` — one `### <TableName>` subsection per table, described at a high level (no SQL). Use this simple format:
    ```
    Table: User
    Fields:
      - id (PK)
      - name
      - email (unique)
      - age
      - created_at
    Relations:
      - has many Orders
    ```
    List each field with a short note in parentheses only when needed (e.g. `(PK)`, `(FK → Orders.id)`, `(unique)`, `(nullable)`). Do not include column types or SQL syntax.
  - `## Migration Order` — topological list (numbered) showing the safe creation order respecting foreign-key dependencies.
  - `## Indexes & Access Patterns` — for each frequently-queried path identified from the design:
    - Access pattern description (e.g. "Filter products by category + sort by price").
    - The field(s) that should be indexed (plain text, no DDL).
    - Justification: selectivity estimate, query type (range / equality / full-text).
  - `## Query Optimisation Notes` — general optimisation guidance specific to this schema, described in prose (no SQL):
    - Partial indexes for filtered subsets (e.g. active records only).
    - Covering indexes for projection-heavy queries.
    - Denormalisation decisions and their trade-offs.
    - Pagination strategy (cursor-based vs. offset) with recommended field(s).
  - `## Seed Data Requirements` — minimum seed data needed for dev/test (counts and example values per table).

---

### PLAN.md

- **Purpose**: Ordered implementation plan following a strict TDD-first sequence: **Database → Backend Test Contracts → Backend → Frontend Test Contracts → Frontend.** PLAN.md is a *navigation document* — it describes **what** to build and **in what order**, and references the authoritative detail files rather than duplicating their content.
- **Cross-reference rule**: Whenever PLAN.md mentions schema, endpoints, components, or design tokens that are fully specified in another file, emit a reference link in this format:
  ```
  → See [DB_SCHEMA.md](./DB_SCHEMA.md) for full DDL and index definitions.
  → See [API_SPEC.md](./API_SPEC.md) for complete endpoint contracts.
  → See [DESIGN.md](./DESIGN.md) for the component catalogue and design tokens.
  → See [ARCHITECTURE.md](./ARCHITECTURE.md) for the system diagram and security model.
  ```
- **Sections** (in this exact order):

  #### Phase 1 — Database
  - Brief summary of entity count and the domain model (one sentence per entity group).
  - Migration order summary (numbered list of migration file names, no schema detail).
  - Reference: `→ See [DB_SCHEMA.md](./DB_SCHEMA.md) for the full high-level schema, indexes, and optimisation notes.`

  #### Phase 2 — Backend Test Contracts (TDD)
  > **Instruction for the builder agent**: Before writing any backend code, think through your test contracts first. For each service method and endpoint, define *what* should be tested — the input/output contract and expected behaviour — without writing any implementation. Use **Jest** for unit tests (services, repositories) and integration tests (controllers). Create test file stubs with `describe` / `it` block headings only; leave the bodies empty until Phase 3.

  - Testing framework: **Jest** (unit + integration)
  - Service methods to cover (name + one-line description of expected behaviour — no test code).
  - Controller endpoints to cover (HTTP verb + path + expected success/error responses — no test code).
  - Minimum coverage target: ≥80% on all new/changed code.
  - Reference: `→ See [API_SPEC.md](./API_SPEC.md) for the endpoint contracts your tests must validate.`

  #### Phase 3 — Backend
  - Summary of endpoint groups and count per group (no per-endpoint detail).
  - **Feature-folder layout**: one folder per domain under `src/features/<domain>/` containing `<domain>.routes.ts`, `<domain>.controller.ts`, `<domain>.service.ts`, `<domain>.repository.ts`, and `<domain>.schema.ts`; shared middleware and types live in `src/shared/`.
  - Authentication & authorisation strategy (JWT flow, session handling).
  - Business logic modules / services — list with one-line responsibility each.
  - Third-party integrations — list with purpose.
  - Reference: `→ See [API_SPEC.md](./API_SPEC.md) for full endpoint contracts, request/response schemas, and error codes.`

  #### Phase 4 — Frontend Test Contracts (TDD)
  > **Instruction for the builder agent**: Before writing any frontend code, think through your test contracts first. For each component and page, define *what* should be tested — rendering, interactions, and data states — without writing any implementation. Use **Jest + React Testing Library** for unit/component tests and **Playwright** for E2E flows. Create test file stubs with `describe` / `it` and `test` block headings only; leave the bodies empty until Phase 5.

  - Unit/component testing framework: **Jest + React Testing Library**
  - E2E testing framework: **Playwright**
  - Components to cover (name + one-line description of what to assert — no test code).
  - E2E flows to cover (flow name + screen-to-screen path e.g. Login → Dashboard → Feature — no test code).
  - Minimum coverage target: ≥80% unit/component; all critical E2E paths covered.
  - Reference: `→ See [DESIGN.md](./DESIGN.md) for the component catalogue and screen inventory your tests must cover.`

  #### Phase 5 — Frontend
  > **Implementation flow — follow in this exact order:**

  **Step 5.1 — Fetch Figma data**
  - Re-fetch all design screens from Figma using the MCP (`get_design_context`, `get_screenshot`).
  - For each screen, record its Figma node ID (format: `<fileKey>/<nodeId>`).
  - Build a screen registry used throughout steps 5.3 and 5.4:

  | Screen Name | Route | Figma Node ID | Key Components |
  | ----------- | ----- | ------------- | -------------- |

  **Step 5.2 — Create the theme**
  - Map all design tokens from [DESIGN.md](./DESIGN.md) to `tailwind.config.ts` (colours, typography, spacing, shadows, border radii).
  - Create `src/styles/tokens.css` exporting CSS custom properties for the full design system.
  - Do not build any components until the theme file is complete and verified.

  **Step 5.3 — Build components (feature-first, then shared)**
  - Use a **feature-folder** structure:
    - `src/features/<feature>/` — components, hooks, pages, store, and types scoped to a single product feature.
    - `src/shared/components/` — purely presentational, cross-feature elements organised as atoms → molecules → organisms.
  - Follow the component build order from [DESIGN.md](./DESIGN.md) component catalogue.
  - For each component, note the Figma node link as a code comment: `// Figma: https://figma.com/file/<fileKey>?node-id=<nodeId>`
  - Shared build order (names only):
    - **Atoms**: primitive elements (Button, Input, Badge, Icon, …)
    - **Molecules**: composite elements (FormField, Card, NavItem, …)
    - **Organisms**: full sections (Header, Sidebar, DataTable, …)
  - Feature build order: complete one feature end-to-end (components + hooks + page) before starting the next.

  **Step 5.4 — Implement pages (page by page)**
  - Implement each page in navigation flow order (see [DESIGN.md](./DESIGN.md) navigation diagram).
  - Place each page inside its feature folder: `src/features/<feature>/pages/<page-name>.tsx`.
  - List every page in this format before building it:

  | Page | Feature Folder | Route | Figma Node Link | Key Components Used | TanStack Query Hooks |
  | ---- | -------------- | ----- | --------------- | ------------------- | -------------------- |

  - Figma Node Link format: `https://figma.com/file/<fileKey>?node-id=<nodeId>`
  - Wire up TanStack Query hooks for all data fetching and mutations.
  - Implement loading, error, and empty states for every async operation.
  - Add error boundaries at the page level.
  - Reference: `→ See [DESIGN.md](./DESIGN.md) for component catalogue, variants, and design tokens.`

  #### Phase 6 — Cross-cutting
  - CI/CD pipeline setup.
  - Environment variables (`.env.example` template).
  - Observability (logging, error tracking).
  - Launch checklist.
  - Reference: `→ See [ARCHITECTURE.md](./ARCHITECTURE.md) for system diagram, deployment topology, and security model.`

---

### ARCHITECTURE.md

- **Purpose**: Technical architecture reference.
- **Sections**:
  - `## System Diagram` — Mermaid `C4Context` or `architecture-beta` showing Client → API → DB.
  - `## Module Breakdown` — Feature-folder breakdown: FE features (one folder per product feature containing `components/`, `hooks/`, `pages/`, `store/`, `types/`) plus `shared/components/` (atoms / molecules / organisms), `shared/hooks/`, and `shared/lib/`; BE features (one folder per domain containing routes, controller, service, repository, Zod schema) plus `shared/middleware/` and `shared/types/`; DB schema groups.
  - `## Data Flow` — sequence diagrams for the 2–3 most important user flows.
  - `## Security Model` — auth flow, role matrix, input validation, secrets management.
  - `## Deployment Topology` — environments, infra assumptions, scaling notes.

---

### API_SPEC.md

- **Purpose**: API contract for frontend↔backend integration.
- **Format**: OpenAPI 3.0-style markdown tables (no YAML file needed yet).
- **Sections**:
  - `## Base URL & Auth` — base URL convention, JWT Bearer token usage.
  - `## Endpoints` — one `###` section per resource group:

    ```markdown
    ### Users

    | Method | Path | Description | Auth? | Request Body | Response |
    | ------ | ---- | ----------- | ----- | ------------ | -------- |
    ```

  - `## Error Codes` — standard error envelope and common HTTP status codes.
  - `## Pagination` — cursor/offset convention.

---

## Step 5 — Verify & deduplicate

After all seven files are written, perform a verification pass **before** showing the summary. Work through the checklist below in order. Fix any issue found in-place; do not ask the user for confirmation during this loop.

### 5a — Ownership check

For each content category, confirm it lives in exactly one file:

| Content category                               | Owned by          | Must NOT appear as full detail in                        |
| ---------------------------------------------- | ----------------- | -------------------------------------------------------- |
| High-level schema (tables, fields, relations)  | `DB_SCHEMA.md`    | PLAN.md, ARCHITECTURE.md, REQUIREMENTS.md               |
| Full endpoint contracts (method, path, schema) | `API_SPEC.md`     | PLAN.md, ARCHITECTURE.md, REQUIREMENTS.md               |
| Component props, variants, design tokens       | `DESIGN.md`       | PLAN.md, PRD.md, REQUIREMENTS.md                        |
| Feature priority table                         | `PRD.md`          | REQUIREMENTS.md, PLAN.md                                |
| System diagram, security model, deployment     | `ARCHITECTURE.md` | PLAN.md, PRD.md                                         |
| Functional requirements list                   | `REQUIREMENTS.md` | PRD.md (summary only allowed), DESIGN.md, PLAN.md       |

If any file contains duplicated full detail that belongs to another file:
1. Replace the duplicated block with a one-line reference link (e.g. `→ See [API_SPEC.md](./API_SPEC.md)`).
2. Confirm the authoritative file contains the complete information.

### 5b — Completeness check

For each file, verify the required sections are present and non-empty:

- **REQUIREMENTS.md**: Overview, Functional Requirements (≥1 item), Non-Functional Requirements, Assumptions, Open Questions.
- **PRD.md**: Executive Summary, Goals, User Personas, Feature List (with priorities), Tech Stack table, Out of Scope, Dependencies & Risks, Release Milestones.
- **DESIGN.md**: Screen Inventory, Component Catalogue, Navigation diagram (Mermaid), Design Tokens, Interaction Notes, Accessibility Notes.
- **DB_SCHEMA.md**: Entity Overview, Schema Definitions (high-level field list per table, no SQL), Migration Order, Indexes & Access Patterns, Query Optimisation Notes, Seed Data Requirements.
- **PLAN.md**: All 6 phases present; each phase ends with its reference link; no schema detail, test code, or full endpoint detail present.
- **ARCHITECTURE.md**: System Diagram (Mermaid), Module Breakdown, Data Flow (≥1 sequence), Security Model, Deployment Topology.
- **API_SPEC.md**: Base URL & Auth, Endpoints (≥1 resource group), Error Codes, Pagination.

### 5c — Cross-reference integrity

For every reference link written in PLAN.md (e.g. `→ See [DB_SCHEMA.md](./DB_SCHEMA.md)`), confirm the target file and section actually exist. If a section is missing, add a `## <Section Name>\n_TODO_` placeholder to the target file and log it as an open question in REQUIREMENTS.md.

### 5d — Mermaid validation

For every Mermaid code block across all files:
- Opening fence is ` ```mermaid ` and closing is ` ``` `.
- Diagram type keyword is on the first line (`flowchart`, `sequenceDiagram`, `C4Context`, `architecture-beta`, etc.).
- No unclosed brackets or missing arrow operators.

---

## Step 6 — Summarise

After the verification pass completes, output a brief summary in chat:

```
✅ Project scaffold created at <output_dir>/

Documents generated:
- REQUIREMENTS.md  — X functional requirements, Y open questions
- PRD.md           — X features (P0: N, P1: N, P2: N)
- DESIGN.md        — X screens, Y components, Z design tokens
- DB_SCHEMA.md     — X tables, Y indexes, Z optimisation notes
- PLAN.md          — 6 phases (DB → BE Tests → Backend → FE Tests → Frontend → Cross-cutting)
- ARCHITECTURE.md  — system diagram + X data flow sequences
- API_SPEC.md      — X endpoints across Y resource groups

Verification:
- Ownership issues fixed: N
- Missing sections added: N
- Broken cross-references resolved: N
- Mermaid diagrams validated: N

Next steps:
1. Review REQUIREMENTS.md open questions with stakeholders.
2. Run `/builder-agent` to scaffold and implement the code.
```

---

## Quality rules

- Every Mermaid diagram must be valid and renderable.
- Tech stack in PRD.md must **exactly** match the confirmed values from Step 1.
- PLAN.md **must** follow the DB → BE Test Contracts → Backend → FE Test Contracts → Frontend order — never reorder.
- Test phases (Phase 2 and Phase 4) must contain **only TDD prompts** for the builder agent — never actual test code or implementation.
- Default testing frameworks: **Jest** for unit/integration (backend and frontend), **Playwright** for E2E (frontend).
- PLAN.md must **never** contain schema detail or full endpoint contracts — reference the authoritative files instead.
- `DB_SCHEMA.md` is the **single source of truth** for the data model and must stay high-level — tables, fields, keys, and relationships only, with **no SQL/DDL**.
- `API_SPEC.md` is the **single source of truth** for all endpoint contracts.
- If the design has gaps (missing error states, no loading states defined), note them as open questions in REQUIREMENTS.md rather than inventing behaviour.
- Do not generate code in this prompt — documentation only.
