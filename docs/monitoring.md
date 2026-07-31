# Daily site monitoring

The **Daily SEO and GEO monitor** workflow checks the deployed homepage,
Cloud Drive article, and Visual Distribution Anchoring preprint page every day
at 12:17 UTC. It can also be started from GitHub's
**Actions → Daily SEO and GEO monitor → Run workflow** menu.

## What is measured

- HTTP availability, redirects, internal resources, and page fragments
- `robots.txt` and sitemap discovery
- Googlebot, OAI-SearchBot, and PerplexityBot access
- Canonical, title, description, `h1`, image alt, social, and JSON-LD metadata
- Stable `Person` and `ScholarlyArticle` attribution
- Mobile Lighthouse SEO, accessibility, best-practices, performance, LCP,
  CLS, and TBT

## Failure thresholds

| Metric | Required |
| --- | ---: |
| Broken required/internal URLs | 0 |
| Metadata or structured-data errors | 0 |
| SEO | ≥ 95 |
| Accessibility | ≥ 90 |
| Best Practices | ≥ 90 |
| Performance | ≥ 80 |
| LCP | ≤ 3,000 ms |
| CLS | ≤ 0.10 |
| TBT | ≤ 300 ms |

Open a workflow run to see failures first in its job summary. Download the
artifact named for that workflow run for the full JSON, Markdown, HTML, and
Lighthouse reports. Artifacts are retained for 90 days. GitHub sends failed
workflow notifications according to each account's Actions notification
settings.

## Audience and search metrics

The independent `traffic-report` job adds finalized Google Search performance,
bot-filtered Cloudflare page views and approximate visits, browser referral
categories, real-user p75 Web Vitals, and five high-value site actions. See the
[audience and search analytics runbook](analytics.md) for metric definitions,
date and sampling rules, dashboard paths, credentials, manual runs, and
rotation procedures.

## Run locally

```bash
npm ci
npm test
npm run monitor:site
npm run monitor:lighthouse:collect
npm run monitor:lighthouse:upload
npm run monitor:lighthouse:assert
npm run monitor:lighthouse:summary
```

For a local HTTP server, set `SITE_BASE_URL` and `LHCI_BASE_URL` to its URL
while keeping
`SITE_CANONICAL_BASE_URL=https://pouya-parsa.github.io/`.

## Interpretation limits

The GEO checks verify crawlability, attribution, primary-source links,
semantic structure, and machine-readable entities. They do not measure
whether an answer engine cited a page. The audience report measures
AI-assistant browser referrals, not crawler requests or answer-engine
citations.
