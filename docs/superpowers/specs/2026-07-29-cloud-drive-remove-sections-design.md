# Cloud Drive Section Removal Design

## Goal

Shorten the Cloud Drive article by completely removing the “What this study does not prove.” and “Questions about cloud driving.” sections.

## Scope

- Delete the complete `#limitations` and `#faq` sections from `cloud-drive/index.html`.
- Remove the `FAQ` link from the article’s sticky section navigation.
- Remove the `FAQPage` node from the page’s JSON-LD graph so structured data matches visible content.
- Remove CSS rules used only by the limitations and FAQ sections, including their responsive and print overrides.
- Update content tests to require the removed sections, navigation entry, and FAQ schema to be absent.

## Preserved Content

- Keep the three-gate article structure.
- Keep the VLA/Roofline compute explainer, its timing values, and Figure 8 link.
- Keep the simulator, strategies, all ten official figures, findings, and citation.
- Keep the `ScholarlyArticle`, `Person`, and `BreadcrumbList` structured data.
- Keep existing paper links and VLA/Roofline discovery metadata.

## Implementation and Verification

Use a test-first content regression: add assertions for the absence of both section headings, IDs, the FAQ navigation link, and the `FAQPage` schema; confirm the assertions fail; then remove the production markup and unused styles. Run the complete Node test suite, JavaScript syntax checks, JSON-LD parsing, local-asset checks, no-JavaScript content checks, route probes, and a desktop/mobile browser smoke test.
