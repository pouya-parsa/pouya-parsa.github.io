# Maintainable CV Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stale downloadable CV with a current two-to-three-page PDF generated from a committed, maintainable LaTeX source.

**Architecture:** Add one self-contained LaTeX source at the site root and compile it to the existing public PDF path. Protect the approved contact details, research interests, publications, page count, and PDF links with a focused Node regression test that uses the repository's existing test runner and Poppler tools.

**Tech Stack:** LaTeX (`article`, `geometry`, `hyperref`, `enumitem`, `titlesec`, `needspace`, `fancyhdr`), `latexmk`, Poppler (`pdftotext`, `pdfinfo`, `pdftoppm`), Node.js 22 built-in test runner.

## Global Constraints

- The public artifact must remain `PouyaParsa_CV.pdf` so the current homepage links continue to work.
- The editable source of truth must be `PouyaParsa_CV.tex`.
- The header must contain `parsa025@umn.edu`, `pouya-parsa.github.io`, and `github.com/pouya-parsa`.
- Neither the source nor PDF may contain the phone number `+989046444142` or the old email `pouya.parsa@aut.ac.ir`.
- The research interests must be exactly “Vision-Language Models” and “Memory-Augmented Large Language Models”; do not include “Long-context AI systems.”
- Include the four approved publications in reverse chronological order with complete author lists, current arXiv or venue status, working links, and one concise contribution line each.
- Treat the current homepage as authoritative for education, experience, awards, and publications.
- Preserve older-CV skills, teaching, selected projects, service, and languages only where they do not conflict with the homepage.
- Keep the homepage unchanged.
- The final PDF must contain two or three readable pages.

## File Map

- Create `PouyaParsa_CV.tex`: editable CV source, layout primitives, and all approved content.
- Modify `PouyaParsa_CV.pdf`: generated public artifact linked from the homepage.
- Create `tests/cv-content.test.mjs`: source/PDF content, privacy, page-count, and URL regression coverage.

---

### Task 1: Rebuild and Verify the Downloadable CV

**Files:**
- Create: `PouyaParsa_CV.tex`
- Modify: `PouyaParsa_CV.pdf`
- Create: `tests/cv-content.test.mjs`

**Interfaces:**
- Consumes: current content in `index.html`, stable details extracted from the old `PouyaParsa_CV.pdf`, and the homepage's existing links to `PouyaParsa_CV.pdf`.
- Produces: `PouyaParsa_CV.tex` as the only editable CV source and `PouyaParsa_CV.pdf` as its compiled GitHub Pages artifact.

- [ ] **Step 1: Write the failing CV regression test**

Create `tests/cv-content.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "PouyaParsa_CV.tex");
const pdfPath = path.join(root, "PouyaParsa_CV.pdf");
const publicationTitles = [
  "Visual Distribution Anchoring for Efficient Prompt Tuning",
  "Can the Cloud Drive? Infrastructure Feasibility of Offloading Autonomous Driving Across 5G and 6G",
  "Video-based Vehicle Surveillance in the Wild: License Plate, Make, and Model Recognition with Self-Reflective Vision-Language Models",
  "Where2Start: Leveraging Initial States for Robust and Sample-Efficient Reinforcement Learning",
];
const pdfPublicationMarkers = [
  "Visual Distribution Anchoring for Efficient Prompt Tuning",
  "Can the Cloud Drive? Infrastructure Feasibility",
  "Video-based Vehicle Surveillance in the Wild",
  "Where2Start: Leveraging Initial States",
];

const normalize = (value) => value.replace(/\s+/g, " ").trim();

test("CV source contains only the approved contact and research-interest details", () => {
  assert.equal(fs.existsSync(sourcePath), true, "PouyaParsa_CV.tex is missing");
  const source = fs.readFileSync(sourcePath, "utf8");

  assert.match(source, /mailto:parsa025@umn\.edu/);
  assert.match(source, /https:\/\/pouya-parsa\.github\.io/);
  assert.match(source, /https:\/\/github\.com\/pouya-parsa/);
  assert.match(
    normalize(source),
    /Research Interests:.*Vision-Language Models.*Memory-Augmented Large Language Models/
  );
  assert.doesNotMatch(source, /Long-context AI systems/i);
  assert.doesNotMatch(source, /\+?989046444142/);
  assert.doesNotMatch(source, /pouya\.parsa@aut\.ac\.ir/i);

  for (const title of publicationTitles) {
    assert.ok(normalize(source).includes(title), `source is missing: ${title}`);
  }
});

test("published CV mirrors the approved source content and links", () => {
  assert.equal(fs.existsSync(pdfPath), true, "PouyaParsa_CV.pdf is missing");
  const text = execFileSync("pdftotext", ["-layout", pdfPath, "-"], {
    encoding: "utf8",
  });
  const normalizedText = normalize(text);
  const digitStream = text.replace(/\D/g, "");
  const info = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  const urls = execFileSync("pdfinfo", ["-url", pdfPath], {
    encoding: "utf8",
  });

  assert.match(normalizedText, /parsa025@umn\.edu/);
  assert.match(
    normalizedText,
    /Research Interests: Vision-Language Models.*Memory-Augmented Large Language Models/
  );
  assert.doesNotMatch(normalizedText, /Long-context AI systems/i);
  assert.ok(!digitStream.includes("989046444142"), "old phone number remains");
  assert.doesNotMatch(normalizedText, /pouya\.parsa@aut\.ac\.ir/i);

  for (const marker of pdfPublicationMarkers) {
    assert.ok(normalizedText.includes(marker), `PDF is missing: ${marker}`);
  }

  const pages = Number(info.match(/^Pages:\s+(\d+)$/m)?.[1]);
  assert.ok(pages >= 2 && pages <= 3, `expected 2-3 pages, received ${pages}`);

  for (const url of [
    "mailto:parsa025@umn.edu",
    "https://pouya-parsa.github.io",
    "https://github.com/pouya-parsa",
    "https://arxiv.org/abs/2607.28967",
    "https://arxiv.org/abs/2607.09045",
    "https://arxiv.org/abs/2508.01387",
    "https://arxiv.org/abs/2311.15089",
  ]) {
    assert.ok(urls.includes(url), `PDF annotation is missing: ${url}`);
  }
  assert.doesNotMatch(urls, /tel:/i);
});
```

- [ ] **Step 2: Run the focused test and confirm the RED state**

Run:

```bash
node --test tests/cv-content.test.mjs
```

Expected: FAIL with `PouyaParsa_CV.tex is missing`; the old PDF assertions may also fail because it still contains the old phone, email, interests, and publications.

- [ ] **Step 3: Add the maintainable LaTeX source**

Create `PouyaParsa_CV.tex`:

```tex
% Build with: latexmk -pdf -interaction=nonstopmode -halt-on-error PouyaParsa_CV.tex
\documentclass[10pt,letterpaper]{article}

\usepackage[margin=0.62in]{geometry}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{lmodern}
\usepackage{microtype}
\usepackage[dvipsnames]{xcolor}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage{needspace}
\usepackage{fancyhdr}
\usepackage{lastpage}
\usepackage[colorlinks=true,urlcolor=MidnightBlue,linkcolor=MidnightBlue]{hyperref}

\definecolor{sectionblue}{HTML}{245B86}
\definecolor{muted}{HTML}{555555}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0pt}
\setlist[itemize]{leftmargin=1.2em,itemsep=1.2pt,topsep=2pt,parsep=0pt}
\urlstyle{same}

\titleformat{\section}
  {\large\bfseries\color{sectionblue}}
  {}{0pt}{}
  [\vspace{-0.35em}\color{sectionblue}\titlerule]
\titlespacing*{\section}{0pt}{0.8em}{0.45em}

\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0pt}
\fancyfoot[C]{\footnotesize\color{muted}Pouya Parsa \enspace\textbar\enspace Page \thepage\ of \pageref*{LastPage}}

\newcommand{\cvheading}[4]{%
  \needspace{4\baselineskip}%
  \textbf{#1}\hfill\textbf{#2}\par
  \textit{#3}\hfill\textit{#4}\par
  \vspace{0.15em}%
}

\newcommand{\publication}[5]{%
  \needspace{6\baselineskip}%
  \href{#4}{\textbf{#1}}\par
  #2\hfill\textit{#3}\par
  \begin{itemize}
    \item #5
  \end{itemize}
  \vspace{0.15em}%
}

\newcommand{\project}[3]{%
  \needspace{3\baselineskip}%
  \textbf{#1}\hfill\href{#2}{Project link}\par
  #3\par\vspace{0.25em}%
}

\begin{document}

\begin{center}
  {\LARGE\bfseries\color{sectionblue} Pouya Parsa}\par
  \vspace{0.35em}
  \href{mailto:parsa025@umn.edu}{parsa025@umn.edu}
  \enspace\textbullet\enspace
  \href{https://pouya-parsa.github.io}{pouya-parsa.github.io}
  \enspace\textbullet\enspace
  \href{https://github.com/pouya-parsa}{github.com/pouya-parsa}
\end{center}

\vspace{0.25em}
\textbf{Research Interests:} Vision-Language Models \enspace\textbullet\enspace Memory-Augmented Large Language Models

\section{Education}

\cvheading
  {Master of Science}
  {Minneapolis, USA}
  {University of Minnesota Twin Cities}
  {2024--2026}
\begin{itemize}
  \item GPA: 3.7/4.00; selected coursework: Computer Vision and Generative AI.
\end{itemize}

\cvheading
  {Bachelor of Science in Computer Science}
  {Tehran, Iran}
  {Amirkabir University of Technology (Tehran Polytechnic)}
  {2018--2022}
\begin{itemize}
  \item GPA: 3.72/4.00; thesis: \textit{Transformer-Based Deep Learning Method for Portfolio Optimization}.
\end{itemize}

\section{Publications}

\publication
  {Visual Distribution Anchoring for Efficient Prompt Tuning}
  {\textbf{Pouya Parsa}, Raoof Zare Moayedi, and Seongjin Choi}
  {arXiv:2607.28967, July 2026}
  {https://arxiv.org/abs/2607.28967}
  {Introduced class-specific visual prototypes from an unlabeled target pool, improving mean frozen vision--language classification accuracy from 65.82\% to 69.21\% without target-side optimization or test-query access.}

\publication
  {Can the Cloud Drive? Infrastructure Feasibility of Offloading Autonomous Driving Across 5G and 6G}
  {\textbf{Pouya Parsa}, Kawon Han, and Seongjin Choi}
  {arXiv:2607.09045, 2026}
  {https://arxiv.org/abs/2607.09045}
  {Analyzed cloud offloading for vision--language--action driving models, showing when GPU memory bandwidth remains the bottleneck after 5G/6G uplink constraints are satisfied.}

\publication
  {Video-based Vehicle Surveillance in the Wild: License Plate, Make, and Model Recognition with Self-Reflective Vision-Language Models}
  {\textbf{Pouya Parsa}, Keya Li, Kara M. Kockelman, and Seongjin Choi}
  {arXiv:2508.01387; TRB 2026}
  {https://arxiv.org/abs/2508.01387}
  {Designed a self-reflective vision--language framework that improved license-plate, make, and model recognition performance by 20\% over CNN-based baselines.}

\publication
  {Where2Start: Leveraging Initial States for Robust and Sample-Efficient Reinforcement Learning}
  {\textbf{Pouya Parsa}, Raoof Zare Moayedi, Mohammad Bornosi, and Mohammad Mahdi Bejani}
  {arXiv:2311.15089, 2023}
  {https://arxiv.org/abs/2311.15089}
  {Proposed an informative initial-state selection method that achieved up to an 8$\times$ improvement in sample efficiency over reinforcement-learning baselines.}

\section{Experience}

\cvheading
  {Research Assistant}
  {Minneapolis, USA}
  {University of Minnesota; advisor: Dr. Seongjin Choi}
  {Aug 2024--Present}
\begin{itemize}
  \item Conduct research in machine learning with an emphasis on vision--language models, computer vision, and generative AI.
  \item Develop methods for self-reflective recognition, efficient prompt tuning, and infrastructure-aware autonomous-driving inference.
\end{itemize}

\cvheading
  {Project Manager}
  {Remote (Dubai)}
  {XTON}
  {Apr 2024--Jul 2024}
\begin{itemize}
  \item Managed infrastructure for a high-availability crypto clicker application serving more than 500,000 users.
  \item Implemented a serverless architecture using AWS Lambda and auto-scaling and coordinated stakeholder expectations.
\end{itemize}

\cvheading
  {Machine Learning Engineer}
  {Remote (Germany)}
  {ZebraCat.ai}
  {Sep 2022--Mar 2023}
\begin{itemize}
  \item Developed embedding-based video retrieval and semantic video-segmentation methods.
  \item Collected a dataset of more than one million advertisement videos.
\end{itemize}

\cvheading
  {Data Science Intern}
  {Tehran, Iran}
  {MCI (Hamrahe Aval)}
  {Jul 2022--Sep 2022}
\begin{itemize}
  \item Built a fault-tolerant ETL pipeline and collaborative-filtering service for recommender systems at Iran's largest mobile operator, delivering recommendations in under 10 ms.
\end{itemize}

\cvheading
  {Machine Learning Engineer Intern}
  {Zurich, Switzerland}
  {University of Zurich}
  {Jan 2022--Mar 2022}
\begin{itemize}
  \item Developed interfaces for data ingestion, preprocessing, machine learning, visualization, and report generation.
\end{itemize}

\section{Honors and Awards}

\cvheading
  {Departmental Fellowship Award}
  {2026}
  {University of Minnesota Twin Cities}
  {}
Awarded in recognition of academic excellence and research potential.

\vspace{0.35em}
\cvheading
  {CTS TRB Reimbursement Award}
  {2026}
  {Center for Transportation Studies}
  {}
Received competitive travel reimbursement to present research at TRB 2026.

\vspace{0.35em}
\cvheading
  {Outstanding Student Recognition}
  {}
  {Amirkabir University of Technology Honors and Olympiads Program}
  {}
Recognized for academic excellence; ranked 403rd among approximately 150,000 participants in Iran's national university entrance examination.

\section{Technical Skills}

\textbf{Programming:} Python, Java, C/C++ \quad
\textbf{Machine Learning:} PyTorch, TensorFlow, scikit-learn, OpenCV \quad
\textbf{Data:} NumPy, pandas, SQL, NoSQL

\section{Selected Projects}

\project
  {Heart Rate Measurement from Video}
  {https://github.com/pouya-parsa/heart_rate_estimation}
  {Estimated heart rate non-invasively from subtle color changes in facial video.}

\project
  {Neural-Network Optimizer Comparison}
  {https://github.com/pouya-parsa/Applied_AI_Projects/blob/main/optimizers.pdf}
  {Compared particle swarm optimization with Adam for neural-network training.}

\project
  {Movie Recommender}
  {https://github.com/pouya-parsa/movie_recommender}
  {Implemented collaborative filtering with singular value decomposition.}

\section{Teaching and Service}

\textbf{Teaching Assistant:} Computer Vision (Winter 2023); Optimization in Neural Networks (Winter 2023); Artificial Intelligence (Winter 2022).\par
\textbf{Service:} Board Member, Scientific Association, Amirkabir University of Technology (2020--2021); Member, Khayam--Turing Machine Learning and Data Science Competition Group (2020--2021).

\section{Languages}

\textbf{English:} Fluent (TOEFL iBT 104/120) \quad
\textbf{Persian:} Native

\end{document}
```

- [ ] **Step 4: Compile the new public PDF**

Run:

```bash
latexmk -pdf -interaction=nonstopmode -halt-on-error PouyaParsa_CV.tex
```

Expected: exit code 0 and `PouyaParsa_CV.pdf` regenerated from the new source. Resolve any LaTeX error before continuing; do not fall back to editing the PDF directly.

- [ ] **Step 5: Run the focused test and confirm the GREEN state**

Run:

```bash
node --test tests/cv-content.test.mjs
```

Expected: 2 tests pass, 0 fail. If the page-count assertion fails, tighten list spacing or page breaks in `PouyaParsa_CV.tex`, recompile, and rerun until the document is two or three pages.

- [ ] **Step 6: Inspect every page visually**

Render the PDF at 170 DPI into a unique temporary directory:

```bash
cv_render_dir=$(mktemp -d /tmp/pouya-cv-render.XXXXXX)
pdftoppm -png -r 170 PouyaParsa_CV.pdf "$cv_render_dir/page"
magick "$cv_render_dir"/page-*.png -append "$cv_render_dir/contact-sheet.png"
find "$cv_render_dir" -maxdepth 1 -type f -print | sort
```

Open `contact-sheet.png` with the image-inspection tool, then open each `page-N.png` at original detail. Confirm all of the following:

- the document has two or three pages;
- header links are legible and balanced;
- section headings do not appear alone at a page bottom;
- publication titles, author lines, dates, and contribution lines wrap without collision;
- no text is clipped at any edge;
- no page has a large avoidable blank region;
- footer page numbers are complete and unobtrusive.

If any condition fails, adjust only spacing, `\needspace`, or page-break placement in `PouyaParsa_CV.tex`; then repeat Steps 4--6.

- [ ] **Step 7: Confirm PDF annotations and private-data removal directly**

Run:

```bash
pdfinfo -url PouyaParsa_CV.pdf
pdftotext -layout PouyaParsa_CV.pdf - | rg -n "parsa025@umn.edu|Vision-Language Models|Memory-Augmented Large Language Models|Visual Distribution Anchoring|Can the Cloud Drive|Video-based Vehicle Surveillance|Where2Start"
pdftotext -layout PouyaParsa_CV.pdf - | rg -n "989046444142|pouya.parsa@aut.ac.ir|Long-context AI systems"
```

Expected: the first command lists the approved email, website, GitHub, and four arXiv annotations; the second finds all approved content; the final search produces no matches and exits with status 1.

- [ ] **Step 8: Run the full repository verification**

Run:

```bash
npm test
git diff --check
```

Expected: all Node tests pass and `git diff --check` prints nothing.

- [ ] **Step 9: Remove LaTeX intermediates without deleting the generated PDF**

Run:

```bash
latexmk -c PouyaParsa_CV.tex
git status --short
```

Expected: only `PouyaParsa_CV.tex`, `PouyaParsa_CV.pdf`, and `tests/cv-content.test.mjs` appear as implementation changes; LaTeX `.aux`, `.fdb_latexmk`, `.fls`, `.log`, and `.out` files are absent.

- [ ] **Step 10: Commit the verified CV refresh**

```bash
git add PouyaParsa_CV.tex PouyaParsa_CV.pdf tests/cv-content.test.mjs
git commit -m "feat: refresh downloadable CV"
```
