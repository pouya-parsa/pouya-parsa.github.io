# Daily SEO and GEO Monitoring Design

**Date:** 2026-07-29  
**Status:** Approved for implementation planning

## Goal

Add a credential-free daily monitor for the deployed personal website that
detects availability, crawlability, metadata, structured-data, link, asset,
and performance regressions. The monitor should make failures easy to
understand from GitHub Actions without adding analytics scripts, paid
services, repository secrets, or noisy automated issues.

The monitor covers:

- `https://pouya-parsa.github.io/`
- `https://pouya-parsa.github.io/cloud-drive/`
- `https://pouya-parsa.github.io/robots.txt`
- `https://pouya-parsa.github.io/sitemap.xml`

## Scope and non-goals

### In scope

- Daily and manually triggered live-site audits
- GitHub Actions failure notifications and run summaries
- Downloadable audit and Lighthouse artifacts
- Tests for the monitor's validation behavior
- Remediation of metadata gaps that would make the initial audit fail
- SEO and GEO technical-readiness checks based on crawlability, explicit
  entities, citations, semantic structure, and machine-readable metadata

### Out of scope

- Google Search Console, Google Analytics, or other credentialed APIs
- User tracking or client-side analytics
- Paid monitoring services
- Automated AI prompt/citation testing
- A synthetic universal "GEO score"
- Automatically opening GitHub issues
- Writing daily monitoring data back to the repository

Credential-free monitoring can verify that search engines and answer engines
can access and understand the pages. It cannot measure impressions, clicks,
AI citations, or referral traffic without later adding a data source.

## Architecture

The solution has four parts:

1. A small Node-based live-site auditor fetches the configured URLs, parses
   their HTML and discovery files, evaluates deterministic rules, and writes
   both JSON and Markdown reports.
2. Lighthouse CI runs mobile audits against the homepage and Cloud Drive
   article, using repeated runs to reduce runner noise.
3. A scheduled GitHub Actions workflow runs the existing repository tests,
   the live-site audit, and Lighthouse. It always publishes a human-readable
   job summary and downloadable artifacts before applying the final failure
   gate.
4. Focused unit tests exercise the audit rules with local fixtures so parser
   and policy changes can be verified without relying on the network.

The repository will gain a minimal Node package manifest and lockfile for
reproducible versions of the HTML, robots, and Lighthouse tooling. The site
itself remains static and receives no runtime dependency.

## Live-site checks

### Availability

- Each configured URL must return a successful HTTP response.
- Redirects are followed, and the final page URL must remain on the expected
  canonical host.
- HTML pages must not contain a `noindex` robots directive.
- Internal links, stylesheets, scripts, images, and local document links must
  resolve successfully.
- Same-page fragment links must point to existing element IDs.
- External links are reported for visibility but do not fail the daily run,
  because third-party availability is outside this site's control.

### Discovery and crawlability

- `robots.txt` must be available and reference the canonical sitemap.
- The homepage and Cloud Drive article must be allowed for Googlebot,
  OAI-SearchBot, PerplexityBot, and a generic crawler under the effective
  robots rules.
- `sitemap.xml` must parse successfully and contain the canonical homepage
  and article URLs exactly once.
- Every sitemap page must return successfully and use a matching canonical
  URL.

### Page metadata

Every monitored HTML page must have:

- A non-empty, unique title
- A non-empty meta description
- A canonical HTTPS URL matching the fetched page
- A single clear `h1`
- A valid document language and viewport declaration
- Open Graph title, description, URL, type, and image
- Twitter card metadata
- Descriptive `alt` text on meaningful images
- Valid JSON-LD blocks

The homepage must expose a `Person` entity with the site's canonical identity
and relevant same-as links. The Cloud Drive article must expose a
`ScholarlyArticle` entity, its authorship and publication details, the arXiv
identifier and paper URL, breadcrumb metadata, citation meta tags, and the
ten expected captioned figures.

Structured data must agree with visible page content. The monitor validates
JSON syntax and the required project-specific fields; it does not claim to
replace Google's Rich Results Test or Search Console validation.

### GEO-readiness rules

The GEO portion is a named group of deterministic prerequisites rather than
a separate score. It checks:

- Answer-engine crawlers are permitted
- The author is represented as a stable `Person` entity
- The paper is represented as a `ScholarlyArticle`
- Authorship, paper title, arXiv identifier, canonical URL, and citation
  metadata agree
- Main content uses semantic headings and visible, descriptive figure
  captions
- The research article links to its primary paper source

These checks make the content easier to retrieve and attribute. Actual
appearance in AI answers remains outside the monitor's observable scope.

## Lighthouse policy

Lighthouse CI runs three mobile audits for each monitored HTML page and uses
the representative result. Thresholds are intentionally firm for semantic
quality and conservative for shared-runner performance:

| Metric | Failure threshold |
| --- | ---: |
| SEO category | below 95 |
| Accessibility category | below 90 |
| Best Practices category | below 90 |
| Performance category | below 80 |
| Largest Contentful Paint | above 3,000 ms |
| Cumulative Layout Shift | above 0.10 |
| Total Blocking Time | above 300 ms |

The desired user-facing LCP target remains 2.5 seconds; the 3-second CI
threshold provides limited tolerance for GitHub runner variability. INP is a
field metric and is not treated as a Lighthouse lab assertion. It can be
added later through Search Console or another real-user data source.

## Workflow behavior

The GitHub Actions workflow:

- Runs once per day at an off-peak minute and supports `workflow_dispatch`
- Uses read-only repository permissions
- Prevents overlapping runs with a concurrency group
- Has an explicit timeout
- Runs the existing Node test suite before network checks
- Allows the audit and Lighthouse steps to finish independently so both
  reports are available when one fails
- Appends a compact table of checks and metrics to the GitHub Actions job
  summary
- Uploads JSON, Markdown, and Lighthouse output on both success and failure
- Retains artifacts for 90 days
- Applies one final gate that fails the workflow if any required check or
  threshold failed

GitHub's normal Actions notification preferences provide the alerting layer.
The workflow does not create issues or send messages to external systems.

## Report format

The JSON audit report contains:

- Run timestamp and base URL
- Monitor version
- Per-page HTTP and canonical details
- Per-check status (`pass`, `warn`, or `fail`)
- Short actionable messages
- Relevant observed and expected values
- A summary count

The Markdown report mirrors the important information for the Actions job
summary. It begins with the overall result, lists failures first, then shows
page-level SEO/GEO checks and performance measurements.

No report contains secrets or user data.

## Initial metadata remediation

The current Cloud Drive article already has strong research and social
metadata. The homepage lacks some fields that the approved policy requires.
Implementation therefore includes adding:

- A canonical homepage URL
- Open Graph metadata
- Twitter card metadata
- A `Person` JSON-LD entity

The added metadata must describe existing visible content and use existing
site assets. This keeps the first daily run green without changing the
homepage's visual design.

## Error handling

- Network requests use bounded timeouts and clear URL-specific errors.
- A transient failure is retried a small number of times before it becomes a
  failure.
- Duplicate URLs are normalized before checking to avoid redundant requests.
- External resource failures are warnings unless the resource is explicitly
  designated as required.
- Reports are written before the process exits unsuccessfully.
- Lighthouse and live-audit failures are collected and displayed together.
- The final workflow gate returns a non-zero status only after artifacts and
  the job summary have been produced.

## Testing and acceptance criteria

Unit tests cover at least:

- Valid pages and discovery files passing
- Missing canonical, description, `h1`, social metadata, and image alt text
- Invalid or inconsistent JSON-LD
- Blocked crawler user agents
- Missing or duplicate sitemap entries
- Broken internal resources and fragments
- Report aggregation and exit status

Repository content tests are extended to cover the new homepage metadata.

The feature is accepted when:

1. All existing and new local tests pass.
2. The live auditor passes against the deployed homepage and article after
   metadata remediation is deployed.
3. Lighthouse configuration covers both pages with the approved thresholds.
4. A manual GitHub Actions run produces a readable summary and downloadable
   artifacts.
5. A deliberately failing local fixture proves that required violations make
   the final gate fail.
6. The workflow requires no secrets and has only read-only repository
   permissions.
