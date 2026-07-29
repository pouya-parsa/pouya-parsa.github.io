# Cloud Drive “DynamicMem+” Redesign

**Date:** 2026-07-29  
**Status:** Approved for implementation planning  
**Reference:** [DynamicMem project page](https://wenyaxie023.github.io/DynamicMem/)

## Goal

Restyle the “Can the Cloud Drive?” interactive research article as a restrained
academic project page inspired by DynamicMem, while preserving the paper’s
technical depth and making the existing interactions easier to understand.

The result should feel simpler than the current editorial design and modestly
richer than the DynamicMem reference: a quiet scholarly page on the surface,
with a paper-grounded simulator, figure exploration, scenario sharing, and
accessible progressive enhancement underneath.

## Success Criteria

1. The first viewport clearly reads as an academic paper project page rather
   than an editorial feature or product landing page.
2. The page uses a centered, approximately 980 px reading column, a white
   background, a cobalt primary accent, pale-gray supporting surfaces, and
   restrained semantic colors for the three feasibility gates.
3. The existing paper content, all ten official figures, citations, metadata,
   structured data, simulator formulas, and canonical URLs remain intact.
4. The simulator exposes four paper-grounded presets in addition to the full
   scenario controls.
5. A reader can copy a URL that restores the selected scenario.
6. A compact sticky navigator indicates the section currently being read.
7. Figure filtering, enlargement, deep links, and citation copying continue to
   work with keyboard and touch input.
8. The complete narrative, figures, citation, and a reference scenario remain
   readable when JavaScript is unavailable.
9. The redesign remains responsive, print-friendly, WCAG 2.2 AA-oriented, and
   compatible with the repository’s package-free GitHub Pages architecture.

## Non-Goals

- Do not copy DynamicMem’s source, wording, figures, or branding.
- Do not change the scientific model, published parameter grid, or reported
  conclusions.
- Do not add a framework, package manager, build system, analytics service,
  server-side API, or third-party interactive dependency.
- Do not turn the article into a dashboard or add decorative animation.
- Do not remove SEO/GEO metadata, FAQ content, scholarly citation metadata,
  crawler files, or the social preview.
- Do not change the portfolio homepage beyond preserving its existing links to
  the article.

## Design Direction

### Visual language

The DynamicMem reference establishes the desired academic rhythm: a centered
hero, compact project metadata, pill-shaped resource links, a narrow reading
column, simple section dividers, full-width figures, and restrained cards. The
Cloud Drive redesign adopts that rhythm without reproducing its implementation.

The new visual system will use:

- a white page background;
- a near-black primary text color;
- a muted slate text color;
- cobalt blue as the main interactive and brand accent;
- pale blue and pale gray as supporting surfaces;
- thin neutral borders;
- small border radii and minimal shadows;
- system/Inter-style sans-serif typography throughout;
- cyan, amber, and green only for communication, compute, and cost meaning.

The current full-height navy hero, oversized serif title, dark content bands,
large shadows, and dramatic editorial scale will be removed.

### Layout

The primary wrapper will be approximately 980 px wide with 24 px side padding.
Sections will use consistent vertical spacing and thin horizontal dividers.
Long explanatory paragraphs will retain a narrower readable measure within the
wrapper.

Desktop layouts may use two or three columns only when the information is
parallel, such as the gate cards, fact cards, strategy cards, and figure
gallery. Mobile layouts collapse to one column without changing reading order.

## Page Structure

### 1. Compact paper hero

The hero will be centered and contain:

- a small uppercase project label;
- the complete paper title, with “Can the Cloud Drive?” receiving the cobalt
  accent rather than oversized serif treatment;
- the existing one-sentence subtitle;
- authors and affiliation;
- preprint/date information;
- pill-shaped links for Paper, Interactive Simulator, and Portfolio.

The hero will not fill the viewport and will use only a subtle pale-blue radial
or linear background treatment.

### 2. Overview figure and facts

Figure 1, the analytical pipeline, will appear immediately below the hero as
the visual overview of the project. It will retain its result-oriented alt text
and full caption.

Below it, four compact fact cards will summarize:

- three sequential feasibility gates;
- 1,296 evaluated scenarios;
- ten official paper figures;
- communication coverage from 5G through 6G.

These are navigation and orientation aids, not new scientific claims.

### 3. Sticky section navigator

A compact sticky navigator will appear below the opening material and link to:

- Overview
- Simulator
- Strategies
- Figures
- Findings
- FAQ

The active section will be communicated with text treatment and an
`aria-current` state, not color alone. On narrow screens the navigator becomes
a horizontally scrollable row with visible focus states.

### 4. Three-gate explanation

Communication, compute, and cost will become three restrained numbered cards.
Each card contains:

- the gate number and name;
- one short question;
- a concise explanation;
- the paper’s key takeaway;
- a direct link to the most relevant figure.

Cyan, amber, and green appear as a small top rule, icon-free marker, or status
detail. The cards otherwise share the same neutral surface.

### 5. Simulator

The simulator remains the primary interactive feature and uses a light bordered
panel. It contains:

- four paper-grounded preset buttons;
- the existing native select and range controls;
- a compact summary of the active scenario;
- three sequential result cards;
- caveats and the 300 ms local-fallback disclosure;
- a “Copy scenario link” control and live status message.

The result order remains Communication → Compute → Cost. The cost card remains
blocked until both prior gates pass. Pass, fail, and blocked states use explicit
text in addition to color.

### 6. Strategies

S1, S2, and S3 remain three parallel cards with a simple comparison table.
Their explanatory content and published values are unchanged. The section loses
decorative editorial treatments and uses the same neutral card system as the
rest of the page.

### 7. Figure explorer

The ten official paper figures remain available in a two-column desktop gallery
and one-column mobile layout. Figure 1 may be visually featured at the opening
of the page while retaining its stable `#figure-1` target in the figure
explorer.

The figure explorer retains:

- All, Framework, Communication, Compute, and Cost filters;
- visible figure numbering;
- complete captions;
- “Why it matters” notes;
- result-oriented alt text;
- stable `#figure-N` anchors;
- native-dialog enlargement with focus restoration;
- direct full-size image links as a fallback.

Filter controls use compact pill styling consistent with the hero resource
links.

### 8. Findings, limitations, FAQ, and citation

Findings become a simple vertical sequence with small “Finding N” badges.
Limitations use a pale-gray card grid rather than a dark full-width band. FAQ
details remain native disclosure widgets. The citation section retains the
visible BibTeX block and copy feedback.

## Interactions

### Scenario presets

Four presets will map to valid combinations in the existing published scenario
grid:

1. **Dense NYC Reference** — the current VLA-S2, 5G-Advanced, 100 ms,
   10% penetration, 0.45 utilization, 2028 reference.
2. **5G Bottleneck** — VLA-S2, 5G, 100 ms, 10% penetration, 0.45 utilization,
   2028. Communication is the first binding gate.
3. **6G VLA** — VLA-S2, 6G, 100 ms, 10% penetration, 0.45 utilization, 2028.
   The branch is jointly feasible and the analytical cloud estimate is lower.
4. **Low-Utilization Cost Case** — VLA-S2, 5G-Advanced, 300 ms,
   10% penetration, 0.12 utilization, 2028. The branch is jointly feasible and
   illustrates the utilization-driven cloud-cost direction while retaining the
   required onboard reactive-fallback caveat.

Implementation tests will lock each preset’s exact input and promised result.

Preset definitions belong beside the scenario options in
`scripts/cloud-drive-model.js`. The DOM controller must consume exported preset
inputs rather than duplicate scientific constants.

Selecting a preset updates all native controls and renders through the same
`evaluateScenario` path as manual input. Any manual input clears the preset’s
active state without restricting the user.

### Shareable scenarios

The existing URL hash remains the source of truth for a shared scenario. The
new copy control:

1. serializes the validated model input;
2. updates the current URL hash;
3. writes the complete URL to the clipboard;
4. announces success or fallback guidance in a polite live region.

Invalid or incomplete hashes continue to fall back safely to the documented
reference scenario.

### Section highlighting

`IntersectionObserver` will update `aria-current="location"` on the sticky
navigator as the reader crosses major section boundaries. The behavior must not
rewrite history, steal focus, or alter the document’s heading structure.

If `IntersectionObserver` is unavailable, all navigation links remain usable
and no active-section marker is required.

### Existing interactions

Figure filters, native dialog enlargement, focus restoration, BibTeX copying,
range output, and simulator rendering remain. Their styling will change, but
their progressive-enhancement contracts will not.

## Architecture and Data Flow

The package-free static architecture remains:

```text
cloud-drive/index.html
    ├── css/cloud-drive.css
    ├── scripts/cloud-drive-model.js
    ├── scripts/cloud-drive.js
    └── images/cloud-drive/*
```

`cloud-drive-model.js` owns:

- the published scenario option grid;
- immutable scientific parameters;
- preset input objects;
- scenario validation;
- pure scenario evaluation.

`cloud-drive.js` owns:

- reading and updating native form controls;
- choosing a preset;
- rendering gate states;
- serializing and restoring URL state;
- copying a scenario URL;
- figure filters and dialog behavior;
- citation copy behavior;
- section navigation highlighting.

`cloud-drive/index.html` owns all meaningful static content and fallback states.
`cloud-drive.css` owns presentation, responsive layout, focus visibility,
reduced motion, dialog presentation, and print rules.

No scientific formula or deployment threshold may be duplicated in the DOM
controller.

## Progressive Enhancement and Failure Handling

- Without JavaScript, the full narrative, all figures, FAQ, limitations,
  citation, and static reference result remain visible.
- Simulator controls remain understandable native elements even when they
  cannot update dynamically.
- Figure images remain wrapped in direct links, so enlargement still works
  without native dialog support.
- Clipboard failures leave selectable text and display manual-copy guidance.
- Invalid shared scenario hashes are sanitized by the existing model contract.
- Missing `IntersectionObserver` support only disables active navigation state.
- The article must not display an economic recommendation for an infeasible
  communication or latency branch.
- The 300 ms tier must always disclose its dependency on an onboard 100 ms
  reactive fallback.

## Accessibility and Responsive Behavior

- Preserve semantic headings, landmarks, figure/caption relationships, native
  form labels, native details/summary widgets, and live regions.
- Maintain at least 44 px interactive targets.
- Keep visible keyboard focus on links, buttons, controls, and dialog actions.
- Use explicit status words so gate meaning never depends on color alone.
- The sticky navigator must not obscure anchor targets; sections receive
  appropriate scroll margin.
- Respect `prefers-reduced-motion`.
- At mobile widths, hero links wrap, facts and cards become one column, controls
  become one column, the figure gallery becomes one column, and the sticky
  navigator scrolls horizontally.
- Print output omits interactive controls while retaining all paper content,
  figures, captions, and citation text.

## SEO and GEO Preservation

The redesign must preserve:

- canonical article URL;
- description and robots metadata;
- citation meta tags;
- Open Graph and X metadata;
- `ScholarlyArticle`, `Person`, `BreadcrumbList`, and `FAQPage` JSON-LD;
- visible direct answer;
- descriptive headings and FAQ answers;
- complete captions and alt text;
- arXiv abstract and PDF links;
- `robots.txt` and `sitemap.xml`.

Visual simplification must not remove visible explanatory content that supports
search engines or generative answer systems.

## Files in Scope

- Modify `cloud-drive/index.html`
- Modify `css/cloud-drive.css`
- Modify `scripts/cloud-drive-model.js`
- Modify `scripts/cloud-drive.js`
- Modify `tests/cloud-drive-model.test.js`
- Modify `tests/site-content.test.js`
- Modify `tests/homepage-smoke.html` only if navigation assertions require it

The official paper figures, social preview, crawler files, portfolio homepage,
and unrelated `main.tex` are not expected to change.

## Verification

Implementation must extend the current test suite to verify:

- all four preset definitions are valid published-grid inputs;
- each preset produces its promised first binding gate or jointly feasible
  result;
- preset selection uses the shared model evaluation path;
- copied scenario URLs restore the same validated input;
- active navigation markup and fallback links exist;
- every figure, caption, filter, dialog control, and stable anchor remains;
- structured data parses as JSON;
- all local HTML assets resolve;
- the complete no-JavaScript article remains present;
- both the homepage and article routes return HTTP 200;
- the article remains usable at desktop and mobile viewport widths;
- no new console errors appear during simulator, preset, figure, or citation
  interactions.

The existing 1,296-branch finite-value model sweep and all current content
integrity checks remain mandatory.
