# CV Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current homepage with a minimal AcademicPages-style static CV site based on `main.tex`.

**Architecture:** The site will be a single static `index.html` page with semantic sections and anchor navigation. Page styling will live in `css/main.css`, replacing the old template styling with a small responsive two-column academic layout. No JavaScript, build tools, package dependencies, or remote assets are needed.

**Tech Stack:** HTML5, CSS3, GitHub Pages static hosting, local assets (`profile_image.png`, `PouyaParsa_CV.pdf`).

---

### Task 1: Add A Static HTML Smoke Test

**Files:**
- Create: `tests/homepage-smoke.html`

- [ ] **Step 1: Write the failing smoke test**

```html
<!doctype html>
<meta charset="utf-8">
<title>Homepage Smoke Test</title>
<script>
  async function run() {
    const html = await fetch("../index.html").then((response) => response.text());
    const doc = new DOMParser().parseFromString(html, "text/html");

    const failures = [];
    const text = doc.body.textContent || "";

    if (doc.title !== "Pouya Parsa") failures.push("Expected title to be Pouya Parsa");
    if (!doc.querySelector('link[href="css/main.css"]')) failures.push("Expected css/main.css stylesheet link");
    if (!doc.querySelector('img[src="profile_image.png"]')) failures.push("Expected profile_image.png portrait");
    if (!doc.querySelector('a[href="mailto:parsa025@umn.edu"]')) failures.push("Expected email link");
    if (!doc.querySelector('a[href="https://github.com/pouya-parsa"]')) failures.push("Expected GitHub link");
    if (!doc.querySelector('a[href="PouyaParsa_CV.pdf"]')) failures.push("Expected CV PDF link");
    for (const id of ["about", "news", "publications", "awards", "education", "experience"]) {
      if (!doc.getElementById(id)) failures.push(`Expected #${id} section`);
    }
    if (!text.includes("Video-based Vehicle Surveillance in the Wild")) failures.push("Expected first publication title");
    if (!text.includes("Where2Start")) failures.push("Expected second publication title");
    const excludedTerm = ["trans", "portation"].join("");
    if (text.toLowerCase().includes(excludedTerm)) failures.push("Homepage copy includes an excluded domain term");

    const output = document.getElementById("output");
    if (failures.length) {
      output.textContent = failures.join("\\n");
      output.style.color = "red";
      throw new Error(failures.join("; "));
    }
    output.textContent = "PASS";
    output.style.color = "green";
  }
  window.addEventListener("load", run);
</script>
<pre id="output">Running...</pre>
```

- [ ] **Step 2: Run the smoke test to verify it fails**

Run a local server:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/tests/homepage-smoke.html`.

Expected: FAIL because the current `index.html` still uses the old template and does not satisfy the new AcademicPages-style structure.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/homepage-smoke.html
git commit -m "test: add homepage smoke test"
```

### Task 2: Replace Homepage Markup

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace `index.html` with the new static structure**

Use semantic HTML with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Pouya Parsa</title>
    <meta name="description" content="Pouya Parsa - machine learning researcher focused on computer vision, generative AI, vision-language models, and large language models.">
    <link rel="stylesheet" href="css/main.css">
  </head>
  <body>
    <header class="site-header">
      <a class="site-title" href="#top">Pouya Parsa</a>
      <nav class="site-nav" aria-label="Main navigation">
        <a href="#about">About</a>
        <a href="#news">News</a>
        <a href="#publications">Publications</a>
        <a href="#awards">Awards</a>
        <a href="#education">Education</a>
        <a href="#experience">Experience</a>
        <a href="PouyaParsa_CV.pdf">CV</a>
      </nav>
    </header>

    <div class="page" id="top">
      <aside class="sidebar" aria-label="Profile">
        <img class="profile-image" src="profile_image.png" alt="Pouya Parsa">
        <h1>Pouya Parsa</h1>
        <p class="role">M.S. student at University of Minnesota Twin Cities</p>
        <ul class="profile-links">
          <li>Minneapolis, US</li>
          <li><a href="mailto:parsa025@umn.edu">parsa025@umn.edu</a></li>
          <li><a href="tel:+17633467840">+1 763 346 7840</a></li>
          <li><a href="https://github.com/pouya-parsa">github.com/pouya-parsa</a></li>
          <li><a href="PouyaParsa_CV.pdf">CV</a></li>
        </ul>
      </aside>

      <main class="content">
        <section id="about">
          <h2>About me</h2>
          <p>I am an M.S. student at the University of Minnesota Twin Cities. My work focuses on machine learning, computer vision, generative AI, vision-language models, and large language models.</p>
          <p>I am especially interested in building reflective AI systems that can reason over visual and textual signals, improve recognition reliability, and support robust decision-making in real-world settings.</p>
        </section>

        <section id="news">
          <h2>News</h2>
          <ul>
            <li><strong>2026:</strong> Awarded a Departmental Fellowship Award.</li>
            <li><strong>2026:</strong> Received the CTS TRB Reimbursement Award to present research at TRB 2026.</li>
            <li><strong>2025:</strong> Paper on self-reflective vision-language models accepted for presentation at TRB 2026.</li>
          </ul>
        </section>

        <section id="publications">
          <h2>Publications</h2>
          <article>
            <h3>Video-based Vehicle Surveillance in the Wild: License Plate, Make, and Model Recognition with Self-Reflective Vision-Language Models</h3>
            <p><strong>Pouya Parsa</strong>, Keya Li, Kara M. Kockelman, and Seongjin Choi. arXiv:2508.01387. Accepted for presentation at TRB 2026.</p>
            <ul>
              <li>Designed and implemented a self-reflective vision-language model framework.</li>
              <li>Achieved a 20% performance improvement over CNN-based baselines on license plate, make, and model recognition tasks.</li>
            </ul>
          </article>
          <article>
            <h3>Where2Start: Leveraging Initial States for Robust and Sample-Efficient Reinforcement Learning</h3>
            <p><strong>Pouya Parsa</strong>, Raoof Zare Moayedi, Mohammad Bornosi, and Mohammad Mahdi Bejani. arXiv:2311.15089.</p>
            <ul>
              <li>Proposed and implemented the Where2Start algorithm to select informative initial states.</li>
              <li>Achieved up to 8x improvement in sample efficiency compared to baseline reinforcement learning methods.</li>
            </ul>
          </article>
        </section>

        <section id="awards">
          <h2>Awards</h2>
          <article>
            <h3>Departmental Fellowship Award</h3>
            <p class="meta">2026</p>
            <p>Awarded a competitive fellowship in recognition of academic excellence and research potential.</p>
          </article>
          <article>
            <h3>CTS TRB Reimbursement Award</h3>
            <p class="meta">2026</p>
            <p>Received competitive travel reimbursement to present research at TRB 2026.</p>
          </article>
        </section>

        <section id="education">
          <h2>Education</h2>
          <article>
            <h3>University of Minnesota Twin Cities</h3>
            <p class="meta">Master of Science, 2024-2026</p>
            <p>GPA: 3.7/4.00. Selected courses: Computer Vision, Traffic Flow Theory, Generative AI.</p>
          </article>
          <article>
            <h3>Amirkabir University of Technology (Tehran Polytechnic)</h3>
            <p class="meta">Bachelor of Science, 2018-2022</p>
            <p>GPA: 3.72/4.00. Thesis: Transformer-Based Deep Learning Method for Portfolio Optimization.</p>
          </article>
        </section>

        <section id="experience">
          <h2>Experience</h2>
          <article>
            <h3>Research Assistant, University of Minnesota</h3>
            <p class="meta">Minneapolis, USA · Aug 2024-Present</p>
            <p>Advisor: Dr. Seongjin Choi. Conducting research in machine learning with a focus on computer vision and generative AI.</p>
          </article>
          <article>
            <h3>Project Manager, XTON</h3>
            <p class="meta">Remote (Dubai) · Apr 2024-Jul 2024</p>
            <ul>
              <li>Managed infrastructure for a high-availability crypto clicker app serving 500k+ users.</li>
              <li>Implemented serverless architecture leveraging AWS Lambda and auto-scaling.</li>
              <li>Facilitated stakeholder communication to align expectations.</li>
            </ul>
          </article>
          <article>
            <h3>Machine Learning Engineer, ZebraCat.ai</h3>
            <p class="meta">Remote (Germany) · Sep 2022-Mar 2023</p>
            <ul>
              <li>Developed an embedding-based algorithm for efficient video retrieval.</li>
              <li>Developed a model to divide videos into semantic sections.</li>
              <li>Scraped more than 1M advertisement videos.</li>
            </ul>
          </article>
          <article>
            <h3>Data Science Intern, MCI (Hamrahe Aval)</h3>
            <p class="meta">Tehran, Iran · Jul 2022-Sep 2022</p>
            <ul>
              <li>Contributed to recommender systems at Iran's largest mobile operator.</li>
              <li>Built a fault-tolerant ETL pipeline for recommender data preparation.</li>
              <li>Implemented collaborative filtering delivering posts with less than 10 ms latency.</li>
            </ul>
          </article>
          <article>
            <h3>Machine Learning Engineer Intern, University of Zurich</h3>
            <p class="meta">Zurich, Switzerland · Jan 2022-Mar 2022</p>
            <p>Developed software interfaces for data ingestion, preprocessing, machine learning, visualization, and report generation.</p>
          </article>
        </section>
      </main>
    </div>
  </body>
</html>
```

- [ ] **Step 2: Commit homepage markup**

```bash
git add index.html
git commit -m "feat: replace homepage markup"
```

### Task 3: Replace Homepage CSS

**Files:**
- Modify: `css/main.css`

- [ ] **Step 1: Replace `css/main.css` with focused responsive styling**

Use CSS that defines:

```css
:root {
  --text: #2f2f2f;
  --muted: #666;
  --border: #e5e5e5;
  --link: #267cb9;
  --link-hover: #1f5f8b;
  --page-width: 1180px;
}

* { box-sizing: border-box; }

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  color: var(--text);
  background: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.62;
}

a {
  color: var(--link);
  text-decoration: none;
}

a:hover,
a:focus {
  color: var(--link-hover);
  text-decoration: underline;
}

.site-header {
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin: 0 auto;
  max-width: var(--page-width);
  padding: 1rem 1.25rem;
}

.site-title {
  color: #333;
  font-size: 1.05rem;
  font-weight: 700;
}

.site-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  justify-content: flex-end;
}

.site-nav a {
  color: #555;
  font-size: 0.95rem;
}

.page {
  display: grid;
  gap: 3rem;
  grid-template-columns: 260px minmax(0, 1fr);
  margin: 0 auto;
  max-width: var(--page-width);
  padding: 2.25rem 1.25rem 3rem;
}

.sidebar {
  color: var(--muted);
}

.profile-image {
  border-radius: 50%;
  display: block;
  height: 180px;
  margin-bottom: 1.2rem;
  object-fit: cover;
  width: 180px;
}

.sidebar h1 {
  color: #222;
  font-size: 1.55rem;
  line-height: 1.2;
  margin: 0 0 0.35rem;
}

.role {
  margin: 0 0 1rem;
}

.profile-links {
  list-style: none;
  margin: 0;
  padding: 0;
}

.profile-links li {
  margin: 0.25rem 0;
}

.content {
  max-width: 780px;
}

section {
  margin-bottom: 2rem;
}

h2 {
  border-bottom: 1px solid var(--border);
  color: #222;
  font-size: 1.65rem;
  font-weight: 500;
  line-height: 1.25;
  margin: 0 0 1rem;
  padding-bottom: 0.35rem;
}

h3 {
  color: #222;
  font-size: 1.08rem;
  line-height: 1.35;
  margin: 0 0 0.25rem;
}

p,
ul {
  margin-top: 0;
}

article {
  margin-bottom: 1.4rem;
}

.meta {
  color: var(--muted);
  font-size: 0.94rem;
  margin-bottom: 0.45rem;
}

@media (max-width: 760px) {
  .site-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .site-nav {
    justify-content: flex-start;
  }

  .page {
    grid-template-columns: 1fr;
    gap: 1.75rem;
    padding-top: 1.5rem;
  }

  .profile-image {
    height: 132px;
    width: 132px;
  }
}
```

- [ ] **Step 2: Run the smoke test to verify it passes**

Open `http://localhost:8000/tests/homepage-smoke.html`.

Expected: PASS.

- [ ] **Step 3: Commit CSS and passing smoke test state**

```bash
git add css/main.css tests/homepage-smoke.html
git commit -m "style: add academic homepage layout"
```

### Task 4: Manual Responsive Verification

**Files:**
- No source edits expected.

- [ ] **Step 1: Open the homepage locally**

Run:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/index.html`.

- [ ] **Step 2: Verify desktop layout**

Expected:

- Top nav is visible.
- Sidebar appears on the left.
- `profile_image.png` renders as a circle.
- Main content is readable and does not exceed comfortable line length.
- The excluded domain term does not appear anywhere in the visible page text.

- [ ] **Step 3: Verify mobile layout**

Expected:

- Sidebar stacks above content.
- Nav wraps without horizontal scrolling.
- Profile image remains circular and does not overlap text.
- Sections remain readable.

- [ ] **Step 4: Verify links**

Expected:

- Email link opens `mailto:parsa025@umn.edu`.
- Phone link opens `tel:+17633467840`.
- GitHub link points to `https://github.com/pouya-parsa`.
- CV link points to `PouyaParsa_CV.pdf`.

- [ ] **Step 5: Commit verification notes if any source changes were required**

If verification required source edits:

```bash
git add index.html css/main.css
git commit -m "fix: polish homepage responsiveness"
```

If no edits were needed, do not create an empty commit.
