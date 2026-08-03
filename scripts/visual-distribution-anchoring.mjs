export async function copyCitation({
  citation,
  status,
  navigatorImpl = globalThis.navigator,
} = {}) {
  try {
    const writeText = navigatorImpl?.clipboard?.writeText;
    if (typeof writeText !== "function") throw new Error("Clipboard unavailable");

    await writeText.call(
      navigatorImpl.clipboard,
      citation.textContent.trim()
    );
    status.textContent = "Citation copied.";
    return true;
  } catch {
    status.textContent =
      "Select the BibTeX text and copy it manually.";
    return false;
  }
}

export function initCitationCopy({
  documentImpl = globalThis.document,
  navigatorImpl = globalThis.navigator,
} = {}) {
  const button = documentImpl?.querySelector("#copy-citation");
  const citation = documentImpl?.querySelector("#bibtex");
  const status = documentImpl?.querySelector("#citation-status");
  if (!button || !citation || !status) return false;

  button.addEventListener("click", () =>
    copyCitation({ citation, status, navigatorImpl })
  );
  return true;
}

if (typeof document !== "undefined") initCitationCopy();
