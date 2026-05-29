# CV Homepage Design

## Goal

Replace the current `index.html` with a minimal static academic homepage based on the updated CV content in `main.tex`. The page should feel close to the AcademicPages / Minimal Mistakes style used by <https://erfanshayegani.github.io>: a left profile sidebar, plain text-first research content, simple top navigation, blue links, and no large hero banner.

## Source Material

- `main.tex` is the source of truth for CV content.
- `profile_image.png` is the profile portrait and should be displayed as a circular sidebar image.
- `PouyaParsa_CV.pdf` remains the linked downloadable CV unless replaced later.
- Existing large template sections, animations, MDB styling, and EmailJS tracking are out of scope for the replacement page.

## Selected Approach

Use a single static HTML page with one small page-specific stylesheet. The site should be hand-authored from the CV content rather than generated from LaTeX at runtime.

This approach is preferred because the repository is already a GitHub Pages-style static site, the requested output is minimal, and hand-authored HTML avoids adding a build step or dependency chain.

## Page Structure

The homepage will use two main regions:

1. A narrow left sidebar with identity and contact information.
2. A wider main content column with academic profile content.

The top of the page will include a simple horizontal navigation bar with anchors for About, News, Publications, Awards, Education, Experience, and CV.

The sidebar will contain:

- Circular `profile_image.png`.
- Name: Pouya Parsa.
- Current academic identity: M.S. student at University of Minnesota Twin Cities.
- Location: Minneapolis, US.
- Email link: `parsa025@umn.edu`.
- GitHub link: `github.com/pouya-parsa`.
- CV link to `PouyaParsa_CV.pdf`.

The main column will contain:

- About me: concise summary of research interests in machine learning, computer vision, generative AI, vision-language models, and large language models. The public-facing wording should stay focused on AI/ML rather than domain framing.
- News: dated highlights from the CV, including the 2026 fellowship, CTS TRB reimbursement, and 2025 TRB 2026 paper acceptance.
- Publications: the two publications listed in `main.tex`, preserving titles, authorship emphasis, venue/arXiv details, and short contribution bullets.
- Awards: Departmental Fellowship Award and CTS TRB Reimbursement Award.
- Education: University of Minnesota Twin Cities M.S. and Amirkabir University of Technology B.S.
- Experience: Research Assistant, XTON, ZebraCat.ai, MCI, and University of Zurich entries.

## Visual Design

The page should be quiet, academic, and readable:

- White page background with dark gray text.
- Blue links similar to AcademicPages.
- Serif-free system font stack.
- Section headings with light bottom borders.
- Minimal spacing and restrained typography.
- No cards, shadows, hero image, decorative gradients, animation libraries, or visual effects.
- Use small inline icons or text labels for sidebar metadata only if they do not add dependencies.

## Responsive Behavior

Desktop layout:

- Top nav spans the page.
- Sidebar sits left of the main content.
- Main content remains constrained for readable line length.

Mobile layout:

- Sidebar stacks above the main content.
- Profile image remains circular but smaller.
- Navigation wraps naturally across lines.
- All content remains readable without horizontal scrolling.

## Files

Implementation should update:

- `index.html`
- `css/main.css`

Implementation should preserve:

- `profile_image.png`
- `PouyaParsa_CV.pdf`
- Existing project assets unless they are no longer referenced.

No new framework, package manager, build tool, or JavaScript dependency should be introduced.

## Verification

Verify the completed page by:

- Opening the local static page or serving the repository with a simple local HTTP server.
- Checking desktop and mobile widths.
- Confirming `profile_image.png` renders.
- Confirming email, GitHub, section anchors, and CV PDF links work.
- Checking that content from `main.tex` is represented accurately.
