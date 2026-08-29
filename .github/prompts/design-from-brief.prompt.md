---
name: "design-from-brief"
description: "Turn a product brief into a section-wise page breakdown and then generate a Figma or Stitch design for web or mobile apps"
argument-hint: "Describe the app type, category, brand, audience, industry, branding, theme, requirements, and optional Figma links for design system and existing design"
agent: "agent"
model: "claude-sonnet-4-5"
---

Create a product design workflow from the user's brief.

Your job is to first take the user's input, validate it, research the space like an industry expert, and then produce a proper section-wise breakdown before the final design.

Before doing anything else, determine which design-generation tool to use:

- **Default to the `figma` MCP** for all design generation.
- **Only use the `stitch` MCP if the user explicitly mentions `stitch`** in their brief, prompt, or follow-up answers (e.g., "use stitch", "generate with stitch", "stitch design").
- If the selected MCP (`figma` by default, or `stitch` when explicitly requested) is not available, fall back to the other one and clearly inform the user about the fallback.
- If neither `stitch` nor `figma` MCP is available, stop immediately at the beginning, report the missing capability clearly, and do not continue into requirements gathering, UX research, documentation, or design generation.
- Record the selected tool explicitly in Section 1 of the output so the rest of the workflow can branch correctly.

Before starting research or UI generation, load and use these skills:

- [design-with-taste](../../.agents/skills/design-with-taste/SKILL.md) for opinionated design philosophy, layout taste, and anti-pattern enforcement — load this first
- [impeccable](../../.agents/skills/impeccable/SKILL.md) for stronger design taste, visual hierarchy, theme selection, responsive quality, motion judgment, and anti-generic design decisions
- [ui-ux-pro-max](../../.agents/skills/ui-ux-pro-max/SKILL.md) for structured UX rules, product-type patterns, accessibility, layout systems, typography, color, interaction, and responsive guidance

Skill usage requirements:

- Follow any mandatory setup steps required by those skills before proceeding.
- Use `design-with-taste` to enforce opinionated layout decisions and eliminate lazy, AI-generic patterns before the brief is interpreted.
- Use `impeccable` to pressure-test the visual direction so the output does not feel generic, bland, or trend-chasing without purpose.
- Use `ui-ux-pro-max` to validate usability, accessibility, information hierarchy, responsive logic, touch targets, and platform-appropriate patterns.
- When the skills provide overlapping guidance, prefer the stricter usability and accessibility rule, then refine the result with stronger visual taste.

Required inputs to collect and confirm before doing UX planning:

- What needs to be built: `Web app` or `Mobile app`
- App category: for example `e-commerce`, `SaaS`, `marketplace`, `fintech`, `healthcare`, `social`, `education`
- Brand name
- Product purpose and core use cases
- Target audience
- Industry or sector
- Branding direction: tone, visual cues, colors, positioning, references, or constraints
- Theme, if already decided
- Any additional requirements, constraints, features, accessibility needs, compliance needs, or technical considerations

Always-ask optional inputs (must be asked every time before UX planning, in this exact order):

- **Design URL** (optional): Ask for a **Figma link only** to any current design files, mockups, or prior versions.
- **Design System URL** (optional): Ask for a **Figma link only** to the design system, UI kit, or component library.
- Both questions are mandatory every time even though answers are optional. If either is not provided, explicitly record `not provided` and continue.
- **Adjacent-pages context** (conditional): If the user provides a Design URL or a Design System URL, immediately ask: _"Should I also check all adjacent pages within the provided Figma file(s) for additional context? This can improve fidelity and catch shared components or flows you may not have linked directly."_ Record the answer (`yes` / `no`) before proceeding. If `yes`, enumerate and ingest all top-level pages in the linked file(s) via `get_metadata` before UX planning begins.

Extra branching rules:

- If the product is a `Web app`, explicitly confirm whether it must be responsive before proceeding.
- If the web app must be responsive, generate both desktop and mobile designs.
- If the web app does not need to be responsive, generate only the desktop design.
- If the product is a `Mobile app`, generate only the mobile design.

## Layout & Visual Design Rules

### Hero Layout Selection

**HARD RULE — NO IMAGE BACKGROUNDS WITH TEXT ON TOP.** Never place a photograph, illustration, or any raster image as a full-screen or section-filling background and then overlay headline text or CTAs on top of it. This is the single most overused, AI-generic hero pattern and is categorically prohibited regardless of industry, brand, or brief. This includes: hero images with a dark/color overlay, parallax photo backgrounds, blurred image backgrounds, gradient-over-photo treatments, and any variation where text floats over an image.

Instead, select the most appropriate modern hero layout for the product category and industry from the approved options below. Document the selected hero pattern in the page breakdown and justify it against the brief.

Approved hero layout patterns (pick one per page, justify the choice):

- **Split-screen hero**: Left column headline + CTA; right column product visual, illustration, or video on a solid or gradient background. Best for SaaS, fintech, B2B.
- **Bento-grid hero**: Asymmetric card mosaic above the fold showing product features or social proof in a grid. Best for productivity tools, dashboards, tech platforms.
- **Scroll-reveal staggered hero**: Headline animates in line-by-line; supporting elements fade up as the user scrolls. Solid or gradient background only. Best for storytelling, portfolios, creative agencies.
- **Product-forward hero**: Product UI screenshot or phone mockup anchors the composition on a clean, solid or gradient background; minimal text. Best for mobile apps, SaaS with a strong visual product.
- **Interactive/data-driven hero**: Live metrics, animated counters, or interactive demo embedded directly in the hero on a solid background. Best for analytics, fintech, developer tools.
- **Oversized typographic hero**: Massive display typeface dominates on a solid or gradient background; minimal imagery. Best for fashion, editorial, cultural institutions.
- **Ambient video hero**: Short looping video (product demo, motion graphic, or abstract motion — NOT a lifestyle photo turned into video) plays beside or below the headline, not behind it. Video must not fill the full background. Best for agencies and high-energy consumer products.

Rules for hero selection:

- **Never use an image as a background behind text under any circumstances.** This rule overrides any industry convention, user preference, or brief reference.
- Match the hero pattern to the industry, audience, and brand tone from the brief.
- Prefer layouts that immediately demonstrate the product's core value proposition above the fold.
- Do not reuse the same hero pattern across multiple pages in the same project.
- If the brief includes a visual reference or inspiration URL, align the hero pattern to that reference — but strip any background-image-with-text layout from the reference before drawing inspiration.

### Section Layout Modernization

Every section in every page must use a distinct, purposeful layout. Do not stack full-width text blocks. Apply the following layout vocabulary throughout:

- **Asymmetric two-column**: Content left, visual right (or reversed); unequal column weights create visual tension and flow.
- **Bento/card mosaic**: Mixed-size cards on a grid for feature showcases, stats, or case studies.
- **Alternating zigzag**: Text-visual pairs that alternate left/right down the page; enforces rhythm and prevents monotony.
- **Magazine-style editorial grid**: Multi-column editorial layouts for content-heavy or blog sections.
- **Sticky side-scroll**: Horizontal scroll or sticky left nav with scrollable right-side content; good for feature walkthroughs and timelines.
- **Full-bleed divider sections**: High-contrast full-width bands to separate major content zones.
- **Floating/overlapping elements**: Cards, images, or UI mockups that overlap section boundaries to create depth and layering.
- **Masonry or waterfall grid**: For galleries, testimonials, case studies, or portfolio items.
- **Stat/metric strip**: Compact horizontal band highlighting key numbers, awards, or social proof between sections.
- **Step/process rail**: Numbered vertical or horizontal stepper layout for onboarding flows, how-it-works, or methodology sections.

Rules for section layouts:

- No two consecutive sections may use the same layout pattern.
- Every section must have a clear typographic hierarchy: one dominant heading, one supporting subhead, and body or data.
- Whitespace is a design element. Do not compress sections. Use generous vertical padding.
- Every section must have a clear visual anchor: image, illustration, icon cluster, chart, mockup, or data visualization.

### Navbar & Footer Consistency Rules

The navbar and footer are global components. They must be designed once and reused identically across every screen in the project. Treat them as a locked design system component.

**Navbar requirements:**

- Choose one navbar style for the entire project and apply it to every screen without variation:
  - `Floating pill navbar`: Rounded, transparent or blurred container that floats over page content; modern SaaS/product style.
  - `Sticky full-width navbar`: Edge-to-edge bar that sticks to the top on scroll; traditional web app style.
  - `Side navigation rail`: Vertical icon-and-label nav on the left; best for dashboards and dense apps.
  - `Minimal top bar`: Logo left, primary CTA right, no secondary links visible; best for landing pages and marketing sites.
- The navbar must contain: logo/brand mark, primary navigation links, and one primary CTA button.
- On mobile, the navbar must collapse to a hamburger or bottom tab bar — no exceptions.
- Navbar background, typography, and active-state styling must be consistent across every screen.
- Document the selected navbar style in the page breakdown.

**Footer requirements:**

- Use one footer style across the entire project:
  - `Mega footer`: Multi-column with site map, social links, newsletter signup, legal; best for content-rich or enterprise products.
  - `Compact footer`: Single row or two-row minimal footer with copyright, key links, social icons; best for SaaS or apps.
  - `Dark-band footer`: High-contrast dark or brand-color background footer that anchors the page visually.
- Footer must include: copyright line, primary navigation links or site map, social media icons, and legal/privacy links.
- Footer styling (background, font, link colors) must be identical across every screen.
- Document the selected footer style in the page breakdown.

**Consistency enforcement during generation:**

- Before generating each screen, state explicitly which navbar and footer variant you are applying.
- After generation, verify that the navbar and footer match the locked global component definition for that screen.
- If a screen is missing the navbar or footer, mark it `partial` in the verification loop and regenerate.

### Figma Auto Layout Rules (Mandatory)

For all work generated with `figma` MCP, Auto Layout is mandatory by default and must be applied consistently at **every** hierarchy level where layout behavior matters — including the top-level screen frame itself, not just the sections inside it. This is the single biggest driver of clean developer handoff: a file where every frame resizes and reflows predictably versus a file that merely looks right at one fixed size.

- **The top-level screen/page frame is itself an Auto Layout frame.** Never build a screen as a plain (non-auto-layout) frame that merely *contains* auto-layout sections positioned at manual x/y. The screen frame must use `figma.createAutoLayout('VERTICAL', ...)` (or equivalent), with every section appended as a direct child that participates in that layout (stacked via the frame's own spacing/padding, not placed by coordinate). This is what makes the whole screen — not just isolated sections — hug/fill/reflow correctly when content or viewport changes.
- Always use Auto Layout for every primary frame, section container, card, navbar, footer, form group, modal body, and reusable component. There should be no plain `figma.createFrame()` in the final tree except for documented overlap/layering exceptions (see below).
- Never position sibling UI elements with manual absolute coordinates when Auto Layout can express the intended layout. Manual x/y on a child of an auto-layout parent is a smell — remove it and let the parent's layout drive position.
- Use nested Auto Layout frames to represent vertical page flow, horizontal groups, and internal spacing structure, all the way down: page → section → row/column → group → leaf.
- Define spacing, padding, alignment, and distribution through Auto Layout properties (`itemSpacing`, padding, `primaryAxisAlignItems`, `counterAxisAlignItems`) — never through manual offsets or invisible spacer frames.
- Set resize behavior intentionally (`Hug`, `Fill`, or fixed) for each child so components remain predictable under content and viewport changes. Default to `Fill` for children of the top-level screen frame (so sections span the full screen width) and `Hug` for content that should size to its own content (labels, pills, badges).
- Other dev-handoff best practices, mandatory alongside Auto Layout:
  - Name every frame, section, and layer descriptively (e.g. `Section/Hero`, `Row/ProductGrid`, not `Frame 47` or `Group 12`) so the layer tree itself documents structure for a developer opening the file.
  - Bind color, spacing, radius, and typography properties to the variables/styles defined on `02 — Theming & Branding` rather than hard-coded literal values, so token changes propagate and the binding is visible in the Figma inspect panel.
  - Set explicit corner-radius, stroke, and fill properties via style/variable references, not ad hoc per-instance overrides, unless the override is a deliberate, documented state variant.
  - Group and order layers top-to-bottom, left-to-right matching visual reading order, so the layer panel mirrors the rendered page.
- Use constraints and absolute positioning only for intentional overlap/layer effects that cannot be represented by Auto Layout (e.g. a floating badge pinned over a corner), and explicitly document each such exception in the generation log — name the node and why Auto Layout could not express it.
- During verification, treat any screen/frame that relies on manual positioning instead of Auto Layout — at ANY level, including the top-level screen frame — as `partial` and regenerate or fix it. A screen where inner sections are Auto Layout but the outer screen frame is not is still `partial`.

### Component Reuse & Single Source of Truth (Mandatory)

For all work generated with `figma` MCP, every recurring UI element must exist exactly once as a real component definition on `03 — Components`, and every occurrence of that element anywhere else in the file must be a live **instance** of it — never a duplicated, copy-pasted, or hand-rebuilt node tree. The test is: if the master component on the Components page is edited, every screen using it must update automatically, with zero manual re-propagation.

- Before placing any button, input, card, badge, pill, nav item, footer, toast, stepper, or any other element that appears (or plausibly could appear) on more than one screen, check whether it already exists on `03 — Components`. If it does, instance it (`mainComponent.createInstance()`); if it doesn't, create it there first, then instance it.
- Never build a "one-off" version of something that is structurally identical or near-identical to an existing component, even if it's just for a single screen. If a screen needs a variant the component doesn't yet support (a new state, size, or content pattern), extend the master component (add a variant/property) on the Components page, then instance the new variant — do not fork it inline on the screen.
- Global locked elements (Navbar, Footer) must be instances of the single Navbar/Footer component on every screen, with zero exceptions — never redrawn, detached, or rebuilt per page.
- Do not detach instances (`instance.detachInstance()`) to make local edits. If a genuinely one-off visual change is required, treat it as a new variant or override property on the master component instead of detaching, so the link back to the source of truth is preserved.
- Overrides on an instance (text content, icon swap, selected state via component properties) are expected and fine — those don't break the link. What's prohibited is duplicating the underlying node structure so the link to the master component no longer exists at all.
- During verification, treat any screen containing a node structure that visually/structurally matches an existing library component but is not an `INSTANCE` bound to that `mainComponent` as `partial`, and fix it by swapping in a real instance of the correct component.

## Screen Generation Rules

### Tool-Specific Generation Workflow

The generation workflow depends on which MCP was selected during tool availability check.

#### When using `figma` MCP (default)

Figma supports a layered, design-system-first workflow with explicit file organization. Follow this strict order and organize the output as described below.

**File & Page Organization (mandatory structure)**

Organize the Figma output into clearly named Figma Pages (within a single Figma file when the project is small/medium) or into multiple Figma files (when the project is large). Use this canonical structure:

1. **`01 — Cover`** — The first Figma Page, acting as the project landing card.
   - Project / brand name, one-line product description, target device(s), date, version
   - Index/table of contents linking to the other pages (Theming, Components, each Page-flow group)
   - Owner/team info if provided in the brief
   - Visual treatment that reflects the selected theme (no image-with-text-overlay; respect the hero layout rules)
2. **`02 — Theming & Branding`** — The full design-foundations page (logo, color, typography, spacing, elevation, radii, iconography, motion tokens).
3. **`03 — Components`** — The full core-components library (buttons, inputs, cards, navbar, footer, modals, etc.).
4. **`04+ — Pages (grouped by flow)`** — Product pages/screens, **grouped by user flow**, each group on its own Figma Page (or its own Figma file when the project is large). Use clear, numbered names. Typical flow groupings (include only the groups relevant to the brief):
   - `04 — Auth` (sign-in, sign-up, forgot password, verify email, MFA, SSO)
   - `05 — Onboarding` (welcome, profile setup, preferences, empty-state first run)
   - `06 — Home / Dashboard` (primary landed experience for signed-in users)
   - `07 — Brand & Marketing` (landing page, features, pricing, about, contact)
   - `08 — Products / Catalog` (listing, detail, search, filters)
   - `09 — Checkout / Transactions` (cart, checkout, payment, confirmation) — if applicable
   - `10 — Account & Settings` (profile, billing, notifications, security)
   - `11 — Support & Help` (help center, FAQ, contact support)
   - `12 — Legal & Terms` (privacy policy, terms of service, cookies, compliance pages)
   - `13 - System State Pages` (error, empty state, loading, maintenance, offline)
   - Add or remove groups & re-order pages as the brief requires; never invent flows that the product does not need.
5. **`99 — User flows`** — The last Figma Page, containing a navigation map that shows how users move between all relevant pages/screens in the project.
   - Represent primary, secondary, and edge-case paths with directional connectors.
   - Include entry points, decision points, success paths, failure paths, and exits where applicable.
   - Label transitions clearly (for example: `Sign in success`, `Checkout failed payment`, `Back to catalog`).

Rules for organization:

- Numbering must be zero-padded and strictly increasing so pages sort correctly in Figma's sidebar.
- Group names must reflect a real user flow, not a random bucket. Each page within a group must belong to that flow.
- The `99 — User flows` page is mandatory for `figma` workflows and must remain the final page in the file order.
- When the total screen count is large (rule of thumb: more than ~25 screens, or any single flow group with more than ~15 screens), split the project into multiple Figma files using the same naming scheme (e.g., `[Brand] — Foundations` file holding Cover + Theming + Components, and `[Brand] — App` / `[Brand] — Marketing` / `[Brand] — Legal` files holding the flow groups). The Cover page must list and link to every file.
- The Cover, Theming & Branding, and Components pages must always exist exactly once across the project; do not duplicate them per flow group or per file. When split across multiple files, place them in the primary/foundations file and reference them from the others.

**Generation order**

1. **Cover page first** — Create the `01 — Cover` page with project metadata and a placeholder index (the index will be filled in after subsequent pages are created/named). Verify the cover page is `built` via MCP before moving on.

2. **Theming & Branding page next** — Create the `02 — Theming & Branding` page containing:
   - Logo and brand mark (placeholder if not provided, with documented spec)
   - Color palette: primary, secondary, accent, neutral scale, semantic colors (success, warning, error, info), surface and background tokens, with hex values and intended usage
   - Typography: font families (display, body, mono if applicable), full type scale with sizes/weights/line-heights, and usage labels (H1–H6, body, caption, overline)
   - Spacing scale and grid system
   - Elevation/shadow tokens
   - Border radius tokens
   - Iconography style and sample icons
   - Motion tokens (durations, easings) documented as text
     Verify the theming page is `built` via MCP before moving on. Do not skip this step.

3. **Components page next** — After theming is verified, create the `03 — Components` page (or a small set of grouped sections within it) that defines every reusable component the pages will consume:
   - Buttons (primary, secondary, tertiary, ghost, destructive; default, hover, active, disabled, loading states)
   - Form inputs (text, textarea, select, checkbox, radio, toggle, search, with all states)
   - Cards (content card, feature card, pricing card, testimonial card as relevant)
   - Navbar (locked global variant chosen earlier, with mobile collapsed state)
   - Footer (locked global variant chosen earlier)
   - Modals, dialogs, drawers, toasts/snackbars
   - Tabs, accordions, breadcrumbs, pagination
   - Avatars, badges, chips, tags
   - Tables and list items if relevant to the product
   - Charts/data visualizations if relevant to the product
   - Empty states, loading skeletons, error states
       Build every component variant with Auto Layout (including nested structures and state variants), and ensure responsive behavior is driven by `Hug`/`Fill`/fixed settings rather than manual element coordinates.
     Every component must visibly reference the theme tokens (colors, typography, spacing) defined in the theming page. Verify the components page is `built` via MCP before moving on.

4. **Flow-grouped pages last (parallel generation allowed)** — Once Cover, Theming, and Components are verified, generate the flow-grouped pages **in parallel**:
   - Issue multiple Figma MCP calls concurrently, one per page/screen (or one per page+device variant). Parallelism may also be organized per flow group when that maps more cleanly to MCP calls.
   - Each page must live inside its correct flow group (e.g., the sign-in screen goes in `04 — Auth`, not in the Home group).
   - Each page must consume the components from the Components page and the tokens from the Theming page — do not redefine them inline.
   - Each screen and section container must be built with Auto Layout-first structure; avoid absolute positioning except for documented, intentional overlap effects.
   - Each page must still respect the hero layout, section layout sequence, navbar variant, and footer variant documented in the page breakdown.
   - After the parallel batch completes, verify every generated page via MCP individually before declaring completion.
   - If a page fails or comes back `partial`, regenerate that single page (parallel or sequential is acceptable for retries) under the bounded retry policy.

5. **User flows page next** — After all flow-grouped pages are verified, create `99 — User flows` and map navigation between all generated pages/screens.
   - Build this page with Auto Layout and structured connectors so updates remain maintainable.
   - If a Design URL is provided, first search the provided Figma file for an existing user flow page (for example: `User flows`, `User Flow`, `Flows`, `Flow Map`, `Journey`).
   - If an existing user flow page is found, create a new tagged flow page using `[NEW]` or `[UPDATE]` naming and add only the new or updated design connections relevant to this request.
   - If no user flow page is found, create `99 — User flows` and add only the new or updated design connections (if any).
   - Do not backfill legacy/existing design connections when operating from a provided Design URL.
   - Verify the `99 — User flows` page is `built` via MCP before finalization.

6. **Cover index refresh** — After the `99 — User flows` page is verified, return to the `01 — Cover` page and update its index/table of contents so every flow group and every page (and every file, if split) is linked.
   - The Cover index must include a link to `99 — User flows`.
   - Re-verify the Cover page via MCP after the update.

**Non-destructive update policy (mandatory for all Figma work)**

- **Always use a new page only**: Never design or update directly on an existing source page/frame. Every generated or revised result must live on a newly created Figma page for easy designer access and review.
- **New designs from a provided screen URL**: When the user supplies a Design URL pointing to an existing Figma screen or frame, do **not** modify that original frame. Always create a new Figma page named `[NEW] <original-page-or-screen-name>` and build or place the new design there.
- **Update requests on existing designs**: When asked to update, revise, or iterate on an existing design, do **not** edit the original frame in place. Instead: (1) duplicate the original frame, (2) move the copy to a new Figma page named `[UPDATE] <original-page-or-screen-name>`, and (3) apply all changes only to the copied version. Leave the source frame unchanged so the designer can compare versions.
- Tag usage is mandatory and exact: use `[NEW]` for net-new pages/designs and `[UPDATE]` for revisions to existing designs. Do not use alternatives like `_new`, `v2`, `updated`, or `copy`.
- After creating a tagged page, add it to the Cover page index with the same tag (`[NEW]` or `[UPDATE]`) so it is discoverable during review.
- If a Design URL is provided, inspect the source file for an existing user flow page before creating flow output. If found, generate a new tagged flow page (`[NEW]` or `[UPDATE]`) and include only incremental connections tied to new/updated designs from this request.
- If a Design URL is provided and no user flow page exists, create `99 — User flows` and include only incremental connections tied to new/updated designs from this request.
- In Design URL mode, never backfill or recreate legacy flow connections for existing designs that were not changed in this request.

#### When using `stitch` MCP

Stitch does not support the layered theme+components+pages workflow and does not support parallel page generation. Use the original sequential per-screen workflow:

Screens must be created one at a time, in strict order. Do NOT batch-generate multiple screens in a single MCP call. For each screen:

1. State the screen name and its position in the checklist (e.g., "Screen 3 of 8 — Pricing Page").
2. Describe the hero layout, section layout sequence, navbar variant, and footer variant being applied.
3. Call the MCP to generate or create that single screen.
4. Retrieve and verify the screen via MCP immediately after creation.
5. Confirm the screen is `built` before moving to the next one.
6. Do not proceed to the next screen until the current one is verified.

### Screen Checklist

Before generation begins, produce a numbered checklist that includes every required artifact and every required variant.

**For `figma` MCP**, the checklist must mirror the canonical file/page organization and start with the foundational artifacts before any flow-grouped page entry:

```
[ ] 01. Cover page — Project metadata, theme reference, index of all pages/files
[ ] 02. Theming & Branding page — Logo, color, typography, spacing, elevation, radii, iconography, motion tokens
[ ] 03. Components page — Buttons, inputs, cards, navbar, footer, modals, etc.
[ ] 04. Flow group: [Auth] — [File: <file-name-if-split>]
    [ ] 04.1 [Screen Name] — [Device: Desktop / Mobile / Both] — [Hero pattern] — [Navbar style] — [Footer style]
    [ ] 04.2 ...
[ ] 05. Flow group: [Home / Dashboard] — [File: <file-name-if-split>]
    [ ] 05.1 ...
[ ] 06. Flow group: [Brand & Marketing] — ...
[ ] 07. Flow group: [Products] — ...
[ ] 08. Flow group: [Legal & Terms] — ...
[ ] 98. User flows page — Global navigation map across all generated pages/screens
[ ] 99. Cover index refresh — Update Cover page index after all flow groups are built and include User flows page
```

Only include the flow groups that the brief actually needs. Each screen entry must declare device, hero pattern, navbar style, and footer style. When the project is split across multiple Figma files, name the owning file on the flow-group line so the checklist doubles as a file map.

**For `stitch` MCP**, use the original per-screen format without the foundational entries:

```
[ ] 1. [Screen Name] — [Device: Desktop / Mobile / Both] — [Hero pattern] — [Navbar style] — [Footer style]
[ ] 2. ...
```

Update each entry to `[x]` immediately after that artifact is verified as `built`.

### MCP Verification Loop

After all artifacts are generated, run one final verification pass:

- List every entry from the checklist (including the Cover, Theming & Branding, Components, `99 — User flows` page when using `figma`, plus every flow group and every screen).
- Retrieve each artifact via MCP by name or ID.
- Mark each as `built`, `missing`, or `partial`.
- For any `missing` or `partial` artifact, regenerate or edit it immediately (do not batch or defer).
- When using `figma`, if the Cover, Theming & Branding, or Components page fails verification, fix it first before re-verifying any flow-grouped page that depends on it.
- When using `figma`, also verify the structural organization: every flow group exists with the right name and numbering, every screen lives inside its correct flow group, and the Cover page index links to every group/file/screen. Treat structural mismatches as `partial` and fix them.
- When using `figma`, also verify Auto Layout coverage top-to-bottom on every screen: the top-level screen frame itself must be Auto Layout (not just its inner sections), and every child down to leaf groups must use Auto Layout unless a documented overlap exception applies. Treat any screen with a non-Auto-Layout top-level frame, or unexplained manual x/y positioning, as `partial`.
- When using `figma`, also verify component reuse: spot-check recurring elements (buttons, cards, badges, nav, footer, inputs) on each screen and confirm they are `INSTANCE` nodes bound to the matching component on `03 — Components`, not duplicated node trees. Treat any duplicated/forked element as `partial` and fix it by swapping in a real instance of the master component.
- If a Design URL is provided, verify that the user-flow output includes only new/updated design connections from this request and does not backfill unchanged legacy designs.
- Re-verify after each fix.
- Repeat until all screens are `built` or a hard blocker is documented.
- Use a bounded retry policy: up to 3 regeneration/edit passes per screen. If still unresolved after 3 passes, stop and report the blocker with full MCP action log.

## Page Breakdown Requirements

The page breakdown must include:

- A concise interpretation of the brief
- Selected hero layout pattern per page, with justification
- Selected navbar style and footer style, with justification
- A section-wise breakdown for each page using the approved layout vocabulary
- Content hierarchy for each section
- Component inventory for each page
- Interaction and state notes
- Visual direction: branding, theme, typography, color, layout system, spacing scale, and motion cues
- Navigation model and cross-page transition map requirements for the `99 — User flows` page
- UX and UI quality criteria derived from `impeccable` and `ui-ux-pro-max`
- Device coverage based on the branching rules above
- Risks, open questions, and recommendations

## Execution Rules

1. Before proceeding, determine the design tool: default to `figma` MCP unless the user explicitly mentions `stitch`. Verify the selected MCP is available; if not, fall back to the other one and inform the user. If neither is available, stop immediately and report that design generation cannot proceed.
2. After tool availability is confirmed, verify you understand the requirements and that all required inputs have been provided.
3. Always ask for the two optional Figma links before planning, in this order: (a) **Design URL** (existing design files/mockups) and (b) **Design System URL** (component library/UI kit). Both questions are mandatory every time even though answers are optional.
4. For those two optional inputs, accept **Figma links only**. If the user provides a non-Figma link, ask for a Figma link instead or mark it `not provided`.
   4a. If either optional Figma link is provided, ask whether to ingest all adjacent pages in that file for richer context before proceeding to UX planning. Record the user's answer and act on it before continuing.
   4b. If a Design URL is provided and generation proceeds, enforce tagged-page output: create results on a new page only, using `[NEW]` for new design work and `[UPDATE]` for update requests.
   4c. If a Design URL is provided, before creating user-flow output, search the provided file for an existing user flow page. If found, create a new tagged flow page and add only new/updated design connections for this request. If not found, create `99 — User flows` and add only new/updated design connections (if any). Do not backfill existing unchanged designs.
5. If any critical input is missing, ambiguous, or contradictory, stop and ask focused follow-up questions first.
6. Validate the brief against the requested output and usage constraints before any creative work begins.
7. If the theme is not provided, infer an appropriate market-aligned theme during research and explain why it fits the brand, audience, and category.
8. Conduct UX and market research using the provided brief and the loaded skills only as needed to improve the design quality. Study the product category, audience expectations, current market patterns, visual trends, best practices, and usability standards.
9. Synthesize the research into an expert-level page plan and section-wise breakdown tailored to this product. Apply the layout vocabulary and hero selection rules above — do not produce generic layouts.
10. Do not start with a formal design document. Start by organizing the request into page-level structure, sections, components, content hierarchy, and interaction notes.
11. Before generating the first artifact, run a quality pass using the loaded skills to verify accessibility, responsiveness, information hierarchy, platform fit, and visual distinctiveness.
11a. When using `figma`, add an Auto Layout readiness check before the first MCP generation call: confirm the planned structure for each screen can be represented with nested Auto Layout frames and explicit `Hug`/`Fill`/fixed behavior.
12. Produce the numbered checklist before any MCP call is made. For `figma`, the checklist must follow the canonical organization: Cover → Theming & Branding → Components → flow-grouped pages → `99 — User flows` → final Cover index refresh.
13. Generate artifacts in the order dictated by the selected tool:
   - **`figma`**: (1) Cover page → verify → (2) Theming & Branding page → verify → (3) Components page → verify → (4) Flow-grouped pages **in parallel** (each in its correct flow group / file) → verify each individually → (5) `99 — User flows` page → verify → (6) Refresh the Cover page index and re-verify.
    - **`stitch`**: Screens one at a time, in order; do not proceed to the next screen until the current one is verified `built`.
14. After all artifacts are generated, run the final MCP verification loop.
15. Apply the loaded skills as a final review pass on the verified output before presenting the result.

## Output Format

- **Section 1 — Requirements check**: Inputs confirmed, tool availability, branching decisions, and status of optional Figma links (design system and existing design)
- **Section 2 — Page & section breakdown**: Hero patterns, layout sequences, component inventories, interaction notes per page
- **Section 3 — UX direction and visual notes**: Theme, typography, color, spacing, motion, navbar/footer spec
- **Section 4 — Screen checklist**: Numbered list with device, hero, navbar, and footer columns; used as the generation tracking record
- **Section 5 — Sequential generation log**: Per-screen entry confirming MCP call, verification result, and checklist update
- **Section 6 — Final MCP verification report**: Complete checklist status after all passes, retry count per screen, any documented blockers
- **Section 7 — Design summary**: Concise summary plus the project link or project ID from Stitch or Figma MCP

## Behavior Constraints

- Do not skip the clarification step when inputs are incomplete.
- Always ask for optional design system and existing design references before planning, and require both of those optional references to be Figma links when provided.
- Do not generate any artifact before the page breakdown and checklist are complete.
- Do not proceed past the beginning if neither `stitch` MCP nor `figma` MCP is available.
- Do not use `stitch` unless the user explicitly mentioned it in the brief or follow-ups; default to `figma`.
- When using `figma`, always organize the output as: `01 — Cover`, `02 — Theming & Branding`, `03 — Components`, then `04+` flow-grouped pages (Auth, Onboarding, Home/Dashboard, Brand & Marketing, Products, Checkout, Account & Settings, Support, Legal & Terms, etc., as applicable). Do not invent or skip flow groups arbitrarily.
- When using `figma`, do not generate the Theming & Branding page before the Cover page is verified `built`.
- When using `figma`, do not generate the Components page before the Theming & Branding page is verified `built`.
- When using `figma`, do not generate any flow-grouped page before the Components page is verified `built`.
- When using `figma`, flow-grouped pages may be generated in parallel only after Cover, Theming, and Components are all verified.
- When using `figma`, every screen must be placed inside its correct flow group; never place a screen at the top level outside a flow group.
- When using `figma`, every generated screen, section container, and reusable component must use Auto Layout by default — including the top-level screen frame itself, not only the sections nested inside it; treat non-Auto-Layout structure at any level as non-compliant unless a documented overlap exception is required.
- When using `figma`, never build a recurring UI element as a duplicated or hand-rebuilt node tree. Every recurring element must be defined once on `03 — Components` and consumed everywhere else as a live component instance, so an edit to the master component propagates to every screen automatically. Extend the master component with new variants/properties instead of forking a one-off copy on a screen.
- When using `figma`, never detach a component instance to make a local edit; use instance overrides or extend the master component with a new variant instead.
- When using `figma`, only split the project across multiple Figma files when the size thresholds are met, and always keep Cover + Theming + Components together in the primary/foundations file.
- When using `figma`, after all flow-grouped pages are built, refresh the Cover page index so it links every flow group, file, and screen, and re-verify the Cover page.
- When a Design URL is provided, user-flow generation must be incremental only: discover an existing flow page first, then produce a tagged `[NEW]`/`[UPDATE]` flow output with only new/updated connections from this request.
- When a Design URL is provided and no flow page exists, create one and include only new/updated design connections (if any); do not backfill unchanged existing designs.
- When using `stitch`, never generate pages in parallel — always one screen at a time, in order, with verification between each.
- When using `stitch`, do not apply the Cover / Theming / Components / flow-grouped file organization — it is figma-only.
- Do not reuse the same hero layout pattern on more than one page.
- Do not use any hero layout that places an image as a full or partial background with text overlaid on top — this is prohibited without exception.
- Do not stack two consecutive sections with the same layout pattern on any page.
- Do not generate multiple screens in a single MCP call when using `stitch`; always generate one screen at a time.
- When using `stitch`, do not advance to the next screen until the current screen is verified `built`.
- Do not apply different navbar or footer styling across screens; treat them as locked global components, and (for `figma`) define them once in the Components page.
- Do not redefine theme tokens or core components inline inside pages when using `figma`; always reference the Theming & Branding and Components pages.
- Do not use generic market trends without connecting them to the user's product.
- Keep recommendations practical, defensible, and aligned with usability best practices.
- Avoid AI-generic UI patterns when the skills indicate a stronger, more product-appropriate direction.
- Enforce accessibility, responsive behavior, and interaction quality as non-optional design constraints.
- Do not claim completion unless the final MCP verification loop confirms every required artifact (for `figma`: Cover, Theming & Branding, Components, every flow-grouped page, `99 — User flows`, and the refreshed Cover index; for `stitch`: every screen) is `built`, or a clearly documented blocker prevents completion.
- Never modify an existing Figma frame or page in place when working from a provided Design URL or when handling an update request. Always use a new page only.
- Use `[NEW] <original-page-or-screen-name>` for net-new designs/pages and `[UPDATE] <original-page-or-screen-name>` for updates to existing designs/pages.
- Every tagged page (`[NEW]` or `[UPDATE]`) must be added to the Cover page index with the same tag before the workflow is declared complete.
- When using `figma`, always create a final page named `99 — User flows` that visualizes navigation between all generated pages/screens, and include it in the Cover index.
