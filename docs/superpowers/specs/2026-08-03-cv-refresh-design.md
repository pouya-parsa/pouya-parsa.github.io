# Maintainable CV Refresh Design

**Date:** 2026-08-03

## Goal

Replace the stale 2023 downloadable CV with a current, maintainable LaTeX CV. The refreshed document will remove Pouya Parsa's phone number, use `parsa025@umn.edu`, focus the research-interest line on vision-language models and memory-augmented large language models, and include the four publications currently featured on the homepage.

## Scope and Sources

- Add `PouyaParsa_CV.tex` as the editable source of truth.
- Continue publishing the generated document at `PouyaParsa_CV.pdf` so existing website links remain valid.
- Treat the current homepage as the source of truth for education, experience, awards, and publications.
- Preserve useful details from the older CV for skills, teaching, selected projects, service, and languages only when they do not conflict with the homepage.
- Keep the homepage unchanged; this refresh applies only to the downloadable CV and its new LaTeX source.

## Content Structure

The CV will target two to three readable pages and use this order:

1. Header with name, email, website, and GitHub. No phone number will appear in the source or generated PDF.
2. Research interests containing only “Vision-Language Models” and “Memory-Augmented Large Language Models.”
3. Education updated from the homepage.
4. Publications in reverse chronological order:
   - *Visual Distribution Anchoring for Efficient Prompt Tuning*
   - *Can the Cloud Drive? Infrastructure Feasibility of Offloading Autonomous Driving Across 5G and 6G*
   - *Video-based Vehicle Surveillance in the Wild: License Plate, Make, and Model Recognition with Self-Reflective Vision-Language Models*
   - *Where2Start: Leveraging Initial States for Robust and Sample-Efficient Reinforcement Learning*
5. Experience updated from the homepage.
6. Awards updated from the homepage.
7. Technical skills, teaching, selected projects, service, and languages preserved from the older CV where still consistent.

Each publication will include its complete author list, current arXiv or venue status, a working link, and one concise contribution statement. Pouya Parsa's name will be visually emphasized in each author list.

## LaTeX Design

The source will use a compact academic-CV layout and define small reusable commands for dated entries and publications. Content will remain directly editable in the `.tex` file without a separate generator or runtime dependency. The output filename will remain stable for GitHub Pages.

The document will use consistent typography, restrained color for links and section rules, compact list spacing, and deliberate page breaks. It will prioritize clear scanning and reliable compilation over decorative elements.

## Build and Data Flow

1. Edit `PouyaParsa_CV.tex`.
2. Compile it with `latexmk`.
3. Publish the generated `PouyaParsa_CV.pdf` at the repository root.
4. Leave the existing homepage CV links unchanged because they already target that filename.

A compilation error will stop the refresh; the existing PDF will not be described as updated unless the LaTeX source compiles successfully and the generated artifact passes content and visual verification.

## Verification

- Compile the source successfully with `latexmk`.
- Extract text from the final PDF and confirm it contains:
  - `parsa025@umn.edu`
  - `Vision-Language Models`
  - `Memory-Augmented Large Language Models`
  - all four confirmed publication titles
- Confirm the extracted text contains neither `+989046444142` nor `pouya.parsa@aut.ac.ir`.
- Inspect PDF link annotations or extracted link targets for the email, website, GitHub, and paper URLs.
- Render every PDF page to an image and visually inspect spacing, wrapping, page breaks, clipping, and overall legibility.
- Run the repository's relevant website tests to confirm the unchanged CV link still resolves to the published filename.

## Success Criteria

The repository contains an editable LaTeX source and a visually verified PDF at the existing public path. The PDF has no phone number, uses the approved email and research interests, includes the four approved works, reflects current homepage education and experience, and remains concise enough for a two-to-three-page academic CV.
