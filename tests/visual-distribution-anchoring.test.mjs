import test from "node:test";
import assert from "node:assert/strict";
import {
  copyCitation,
  initCitationCopy,
} from "../scripts/visual-distribution-anchoring.mjs";

const bibtex = `@article{parsa2026visual,
  title={Visual Distribution Anchoring for Efficient Prompt Tuning}
}`;

test("citation copy sends trimmed BibTeX to the clipboard", async () => {
  const copied = [];
  const status = { textContent: "" };
  let clickHandler;
  const elements = {
    "#copy-citation": {
      addEventListener(type, handler) {
        assert.equal(type, "click");
        clickHandler = handler;
      },
    },
    "#bibtex": { textContent: `\n${bibtex}\n` },
    "#citation-status": status,
  };

  const initialized = initCitationCopy({
    documentImpl: {
      querySelector(selector) {
        return elements[selector] ?? null;
      },
    },
    navigatorImpl: {
      clipboard: {
        async writeText(value) {
          copied.push(value);
        },
      },
    },
  });

  assert.equal(initialized, true);
  await clickHandler();
  assert.deepEqual(copied, [bibtex]);
  assert.equal(status.textContent, "Citation copied.");
});

test("citation copy exposes the manual fallback without Clipboard API", async () => {
  const status = { textContent: "" };
  const result = await copyCitation({
    citation: { textContent: bibtex },
    status,
    navigatorImpl: {},
  });

  assert.equal(result, false);
  assert.equal(
    status.textContent,
    "Select the BibTeX text and copy it manually."
  );
});
