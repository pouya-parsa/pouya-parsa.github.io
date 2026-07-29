# Can the Cloud Drive? Interactive Article Design

## Summary

Add Pouya Parsa's July 2026 paper, “Can the Cloud Drive? Infrastructure Feasibility of Offloading Autonomous Driving Across 5G and 6G,” to the personal website and publish a paper-faithful interactive article at `/cloud-drive/`.

The article will serve two audiences at once:

- researchers and infrastructure practitioners who want to inspect the study's assumptions and results; and
- general technical readers who need the communication → compute → cost argument explained visually.

The experience will combine a guided research story, a constrained scenario simulator, and an explorer containing all ten figures from the paper. It will remain a dependency-free static site so it fits the repository's existing GitHub Pages architecture.

## Goals

1. Add a clear 2026 homepage news item and a new first publication entry for the paper.
2. Make the paper title and “Interactive article” call to action link to `/cloud-drive/`.
3. Explain the paper's central result as three sequential feasibility gates:
   communication, compute latency, and economics.
4. Let readers explore the published scenario space without implying unsupported predictions.
5. Include every numbered figure from the paper with a faithful image, caption, accessible description, and contextual annotation.
6. Make the article discoverable and understandable to search engines and answer engines through semantic structure, structured data, direct answers, and explicit source attribution.
7. Preserve the fast, accessible, static character of the existing personal site.

## Non-goals

- The article will not accept arbitrary continuous engineering parameters outside the study's calibrated scenario space.
- The simulator will not claim to be a production deployment or safety-certification tool.
- The project will not add a framework, package manager, build system, analytics platform, database, or server-side API.
- The homepage will not be redesigned beyond the additions needed to feature the new work.
- The article will not reproduce the paper's full prose or bibliography.

## Information Architecture

### Homepage

The existing `index.html` will receive:

- a new first News line announcing the July 2026 preprint;
- a new first Publications article containing the complete title, authors, arXiv identifier, a two-sentence summary, and links to the interactive article and official arXiv paper; and
- descriptive link text rather than a generic “click here.”

The existing sections, typography, and profile layout will remain intact.

### Interactive article

The route `/cloud-drive/` will use the following sequence:

1. **Hero and direct answer**
   - Paper title, authors, publication date, arXiv link, and a concise answer to “Can the cloud drive?”
   - A short three-gate overview and a visible disclaimer that the tool is an explainer of the published analytical model.
2. **The central question**
   - Why larger E2E, VLM, and VLA models change the onboard-versus-cloud trade-off.
3. **Three-gate guided story**
   - Communication: can a dense cell carry the selected offload?
   - Compute: can cloud inference and network tails fit the latency tier?
   - Cost: once admissible, is shared cloud infrastructure cheaper than onboard hardware?
4. **Interactive scenario simulator**
   - A control panel and a sequential gate result that explains the first binding constraint.
5. **Strategy comparison**
   - S1 raw-sensor, S2 feature-level, and S3 query-level offloading shown as an accessible comparison.
6. **All-figure explorer**
   - Figures 1–10, filterable by Framework, Communication, Compute, and Cost.
7. **Key findings and limitations**
   - Evidence-backed conclusions, including the role of a local reactive fallback in the 300 ms tier.
8. **Frequently asked questions**
   - Short, self-contained answers to likely search and answer-engine queries.
9. **Citation and paper links**
   - Copyable BibTeX, arXiv abstract/PDF links, and a link back to the portfolio.

## Visual Direction

The article will extend the restrained academic look of the homepage while giving the paper its own recognizable visual system:

- warm white page background and dark navy text for long-form readability;
- cyan/blue for communication, amber for compute, and green for cost;
- a slim “three gates” progress motif repeated across the hero, narrative, and simulator;
- generous whitespace, editorial typography, and figure-first layouts;
- paper figures displayed on clean white surfaces with readable captions and optional enlargement;
- subtle transitions that respect `prefers-reduced-motion`;
- no ornamental stock photography or invented scientific imagery.

The article will be responsive down to narrow mobile viewports. Controls will stack vertically, figures will remain legible without horizontal page scrolling, and tap targets will be at least 44 CSS pixels.

## Simulator Design

### Inputs

The simulator will expose only values used by the paper:

- model class: E2E, VLM, or VLA;
- offloading strategy: S1, S2, or S3;
- communication generation: 5G, 5G-Advanced, or 6G;
- latency tier: 100 ms reactive or 300 ms deliberative;
- AV penetration: 0.1%, 1%, 5%, 10%, 20%, 30%, 50%, or 100%;
- vehicle utilization: 0.05, 0.12, 0.30, 0.45, 0.65, or 1.0; and
- GPU year: an integer from 2025 through 2040.

The initial state will use the paper's dense-corridor reference scenario:
VLA, S2, 5G-Advanced, 10% penetration, 0.45 utilization, and the 100 ms reactive tier. The initial GPU year will be 2028 so the interface can demonstrate that clearing the deterministic compute floor is not the same as clearing the loaded-network tail.

### Outputs

Each change will recompute and display:

- estimated active vehicles per cell;
- target uplink demand for the selected strategy;
- communication generation and bandwidth gate result;
- deterministic inference/control-loop floor;
- latency-budget result, including whether an access-scheduling tail remains binding;
- joint feasibility result and the first gate that fails;
- hybrid cloud-plus-residual-onboard annual cost where the selected branch is admissible;
- corresponding full-onboard annual cost; and
- a plain-language interpretation tied to the relevant figure and paper section.

Results will be ordered as gates. The cost result will not be presented as actionable when communication or latency fails.

### Model fidelity

The implementation will encode the paper's published equations and constants from Tables 1–7 and the scenario values described in Sections 3–4. A dedicated data/model module will separate constants and calculations from UI rendering.

The interface will label values as analytical estimates, identify the paper version (`arXiv:2607.09045v1`), and state that results depend on the study's NYC cell-count, fleet, hardware-evolution, and cost assumptions. It will not interpolate unsupported categorical inputs or extend the GPU trend beyond 2040.

## Figure Explorer

The explorer will contain:

1. Analytical pipeline.
2. Offloading strategy spectrum.
3. Bandwidth-capacity trade-off.
4. End-to-end control-loop delay decomposition.
5. Tail latency under increasing cell utilization.
6. NYC communication frontier.
7. NYC communication sweep.
8. Compute-bound VLA latency and memory-bandwidth decomposition.
9. Reactive-budget hybrid cost comparison.
10. Deliberative-tier 2028 cost-ratio map.

Images will be extracted from the official arXiv paper/source at sufficient resolution for high-density displays. Each `<figure>` will include:

- a stable anchor such as `#figure-8`;
- the complete paper caption;
- concise alt text that communicates the chart's conclusion;
- a “Why it matters” annotation;
- applicable category tags; and
- an enlargement control implemented as an accessible dialog or native link fallback.

Filtering will never remove the figures from the document source; it will only change their visual presentation so crawlers and no-JavaScript readers retain the complete content.

## Files and Boundaries

- `index.html`: homepage news/publication additions and homepage metadata links.
- `cloud-drive/index.html`: semantic long-form article and all no-JavaScript content.
- `css/cloud-drive.css`: article-only visual system and responsive states.
- `scripts/cloud-drive-model.js`: immutable paper constants and pure feasibility/cost calculations.
- `scripts/cloud-drive.js`: simulator controls, result rendering, figure filters, dialog behavior, and copy-citation behavior.
- `images/cloud-drive/`: the ten extracted figure assets plus one social-preview image.
- `tests/homepage-smoke.html`: updated homepage content/link assertions.
- `tests/cloud-drive-smoke.html`: article structure, metadata, figure, and accessible-control assertions.
- `tests/cloud-drive-model.test.js`: calculation checks against published reference scenarios and boundary cases.
- `robots.txt`: crawler policy and sitemap location.
- `sitemap.xml`: homepage and article URLs.

The model module will expose a small browser-and-Node-compatible API:

```js
window.CloudDriveModel.evaluateScenario(input)
window.CloudDriveModel.SCENARIO_OPTIONS
```

`evaluateScenario(input)` will return a serializable object with the three gate results, intermediate values used in the explanation, and the first binding constraint. UI code will consume that result without duplicating formulas.

## Accessibility and Progressive Enhancement

- The full article, all captions, FAQs, and citation will be meaningful without JavaScript.
- Simulator inputs will use native form controls, persistent labels, fieldsets, and keyboard navigation.
- Dynamic results will update inside a restrained `aria-live="polite"` region.
- Gate states will use icons/text in addition to color.
- The figure dialog will trap focus, close with Escape, restore focus, and have a non-dialog link fallback.
- Heading order, landmarks, focus styles, link purpose, and color contrast will meet WCAG 2.2 AA expectations.
- Motion and smooth scrolling will be disabled when the visitor prefers reduced motion.

## SEO and Generative-Engine Optimization

### Page metadata

The article will include:

- a unique, query-oriented `<title>`;
- concise meta description;
- canonical URL for `https://pouya-parsa.github.io/cloud-drive/`;
- Open Graph and X/Twitter metadata;
- a dedicated social-preview image;
- `citation_title`, `citation_author`, `citation_publication_date`, `citation_pdf_url`, and `citation_arxiv_id` meta tags; and
- descriptive internal links from the homepage.

### Structured data

One valid JSON-LD graph will describe:

- `ScholarlyArticle` with title, authors, date, arXiv identifier, abstract summary, keywords, and same-as link;
- `Person` for Pouya Parsa;
- `BreadcrumbList`; and
- `FAQPage` matching the visible FAQ.

### Answer-friendly content

- The direct answer will appear near the top in plain language.
- Major sections will use natural-language question headings.
- Each important claim will sit beside its qualifying conditions and figure/section reference.
- Acronyms such as AV, E2E, VLM, VLA, HBM, and TCO will be defined on first use.
- The simulator result will be reproducible in human-readable text, not only color or graphics.
- Limitations and the distinction between reactive and deliberative control will be explicit.
- `robots.txt` will allow public crawling, and `sitemap.xml` will list the canonical pages.

## Error Handling

- Invalid or missing simulator values will fall back to the documented reference scenario and show a non-blocking explanation.
- A failed figure image will retain its caption and accessible description.
- Citation-copy failure will reveal selectable BibTeX text rather than silently failing.
- JavaScript failure will leave the complete narrative, figure set, and a static reference-scenario result visible.

## Verification

1. Run the existing homepage smoke test after adding new assertions.
2. Run the article smoke test to verify:
   - canonical, scholarly citation, social, and JSON-LD metadata;
   - exactly ten numbered figures;
   - simulator labels, options, result region, FAQ, and paper links;
   - valid internal homepage/article navigation; and
   - no missing local assets.
3. Run model tests against paper reference points, including:
   - at 10% penetration and 0.45 utilization, 5G fails S2 while 5G-Advanced is the practical communication threshold;
   - the 2025 VLA deterministic floor exceeds 100 ms for S1–S3;
   - the VLA deterministic floor first falls below 100 ms around 2027;
   - at the dense reference point, 6G admits VLA-S2 around 2028 while 5G-Advanced remains reactive-infeasible; and
   - cost is suppressed as non-actionable until communication and latency both pass.
4. Serve the site through a local HTTP server and verify both routes return successfully.
5. Validate that the JSON-LD parses, sitemap URLs are canonical, and all figure assets are present.
6. Check the source with JavaScript disabled to confirm the article and figures remain understandable.

## Success Criteria

The work is complete when a visitor can discover the new paper from the homepage, open the dedicated article, understand the three binding regimes, explore any of the paper's ten figures, and test any published scenario combination with an explained feasibility/cost result. The experience must work on desktop and mobile, remain useful without JavaScript, and expose complete scholarly metadata to crawlers and answer engines.
