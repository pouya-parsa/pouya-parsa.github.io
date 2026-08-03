# VDA Citation Section Design

**Date:** 2026-08-02

**Page:** `visual-distribution-anchoring/index.html`

**Paper:** “Visual Distribution Anchoring for Efficient Prompt Tuning”

## Context

The VDA project page links to the paper on arXiv but does not provide a complete citation surface. The Cloud Drive paper page already establishes a useful local pattern: source links beside a BibTeX card with copy feedback. The VDA page should gain the same capability while retaining its own visual system and avoiding a broader shared-component refactor.

The authoritative source is <https://arxiv.org/abs/2607.28967>. It lists the title, author order, arXiv identifier, primary category `cs.CV`, 2026 publication year, and arXiv DOI `10.48550/arXiv.2607.28967`.

## Goals

- Give readers a human-readable citation directly on the VDA page.
- Provide accurate, selectable BibTeX and a one-click copy action.
- Link directly to both the arXiv abstract and PDF.
- Preserve the VDA page's responsive design, accessibility, metadata, and site-audit behavior.

## Non-goals

- Do not refactor the Cloud Drive citation implementation into a shared component.
- Do not add citation-format switching, citation downloads, or third-party bibliographic widgets.
- Do not add new analytics event types or modify the analytics worker.
- Do not change the paper's existing visible month-level venue line or unrelated page content.

## Citation Content

The readable citation will use this neutral arXiv form:

> Pouya Parsa, Raoof Zare Moayedi, and Seongjin Choi. “Visual Distribution Anchoring for Efficient Prompt Tuning.” arXiv:2607.28967 [cs.CV], 2026. doi:10.48550/arXiv.2607.28967.

The BibTeX card will contain:

```bibtex
@article{parsa2026visual,
  title={Visual Distribution Anchoring for Efficient Prompt Tuning},
  author={Parsa, Pouya and Moayedi, Raoof Zare and Choi, Seongjin},
  journal={arXiv preprint arXiv:2607.28967},
  year={2026},
  doi={10.48550/arXiv.2607.28967},
  url={https://arxiv.org/abs/2607.28967}
}
```

## Page Structure

Add a `Citation` item to the sticky paper navigation. Its target, `#citation`, will be a new section between `#limitations` and the page footer.

The section will use a two-column desktop layout:

1. A source/details column with the section heading, readable citation, `Download PDF` button, and `Open on arXiv` button.
2. A BibTeX card with the citation text, `Copy citation` button, and an `aria-live` status message.

At the existing narrow breakpoint, the columns will stack, buttons will remain comfortably tappable, and the BibTeX block will scroll horizontally rather than overflow the viewport.

## Copy Behavior and Accessibility

A small VDA-specific module will initialize only the citation copy control. On activation it will copy the exact text content of the BibTeX block through the Clipboard API.

- Success feedback: `Citation copied.`
- Clipboard failure or unavailable API: `Select the BibTeX text and copy it manually.`
- The button remains a native `button` with `type="button"`.
- The status element uses `aria-live="polite"`.
- The BibTeX remains visible and selectable without JavaScript.
- No new analytics attribute will be added to the citation controls.

## Styling

Extend `css/visual-distribution-anchoring.css` with VDA-specific citation styles. Reuse existing VDA tokens, button classes, spacing, border radii, and responsive breakpoints. The BibTeX card will use a dark, high-contrast code surface so it is visually distinct from the explanatory column while remaining consistent with the page's academic aesthetic.

Print styles will hide interactive controls while leaving the readable citation and BibTeX visible.

## Files and Responsibilities

- `visual-distribution-anchoring/index.html`: navigation item, citation section, source links, readable citation, BibTeX, copy status, and module inclusion.
- `css/visual-distribution-anchoring.css`: citation layout, card, controls, responsive behavior, and print treatment.
- `scripts/visual-distribution-anchoring.mjs`: citation-copy initialization and feedback only.
- `tests/site-content.test.js`: page structure, exact source URLs, citation fields, accessible controls, and responsive-style contract.
- `tests/visual-distribution-anchoring.test.mjs`: real copy success and failure behavior through injected browser dependencies rather than mock-only assertions.

## Testing and Verification

Implementation will follow a red-green cycle:

1. Add failing content tests for the new navigation target, citation text, arXiv/PDF links, BibTeX fields, accessible copy control, script, and styles.
2. Add failing behavior tests for successful copy and the manual-copy fallback.
3. Implement the smallest HTML, CSS, and JavaScript changes needed to pass.
4. Run the complete `npm test` suite.
5. Run the deterministic local site audit against all three public pages.
6. Confirm `git diff --check` and review the final scoped diff.

## Success Criteria

- A reader can find the citation section from the sticky navigation.
- Both readable and BibTeX citations match the official arXiv record.
- The abstract and PDF links target arXiv `2607.28967`.
- Copying BibTeX gives accessible success or fallback feedback.
- The section works on narrow screens, in print, and without JavaScript.
- The full automated test suite and local page audit pass.
