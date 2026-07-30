# Audience Analytics and Search Performance Design

**Date:** 2026-07-29  
**Status:** Approved for implementation planning

## Goal

Extend the existing daily SEO and GEO monitor with privacy-conscious audience
and search-performance reporting. The website owner should be able to see
Google Search clicks, impressions, click-through rate, approximate visits,
popular pages, referral sources, and selected high-value actions in both the
provider dashboards and the existing daily GitHub Actions summary.

The design adds:

- Google Search Console for organic-search performance
- Cloudflare Web Analytics for cookie-free browser traffic and real-user
  performance
- A small Cloudflare Worker backed by Analytics Engine for aggregate,
  first-party action events
- A separate traffic-reporting job in the existing daily monitoring workflow

The existing deterministic site-health, SEO, GEO, and Lighthouse checks remain
unchanged and independently interpretable.

## Success metrics

The reporting surface should answer:

- How many Google Search clicks and impressions did the site receive?
- What were the site's Google Search CTR and average position?
- How many page views and approximate visits did the site receive?
- Which pages and referral groups generated the most traffic?
- How many visitors selected the paper PDF, interactive article, CV, GitHub
  profile, or copy-citation action?
- Did traffic arrive through browser referrals from AI assistants such as
  ChatGPT or Perplexity?

Search Console data is delayed and is reported using the latest finalized date
available from Google. Cloudflare traffic and action data is reported for the
previous UTC day. Both sources also include a trailing seven-day view.

## Scope and non-goals

### In scope

- Search Console verification for the GitHub Pages URL-prefix property
- Short-lived GitHub-to-Google authentication with Workload Identity
  Federation
- Cloudflare Web Analytics on the homepage and Cloud Drive article
- Aggregate tracking for five approved, high-value actions
- Daily Markdown and JSON traffic reports in GitHub Actions
- Provider dashboards for deeper investigation
- Clear credential-setup and maintenance documentation
- Fixture-based tests that do not contact live analytics APIs

### Out of scope

- Google Analytics, advertising pixels, remarketing, or cross-site tracking
- Cookies, fingerprinting, email addresses, names, or persistent visitor IDs
- Exact identification of unique humans
- Exact identification or counting of AI crawler requests
- Automatic attribution of an action to a particular person
- Writing analytics data back into the Git repository
- A custom domain or reverse proxy

Cloudflare browser referrals from known AI-assistant domains can be grouped as
`AI assistants`. These are people arriving through those products, not crawler
requests. Reliable counts for `OAI-SearchBot`, `GPTBot`, `ChatGPT-User`,
`PerplexityBot`, and similar agents require request logs at a custom domain or
proxy and remain a later phase.

## Architecture

The solution has four independently useful parts:

1. **Google Search Console** remains the source of truth for Google organic
   search clicks, impressions, CTR, average position, pages, and queries.
2. **Cloudflare Web Analytics** supplies privacy-preserving page views,
   approximate visits, page paths, referrers, country/device groupings, and
   real-user performance without requiring the domain to use Cloudflare DNS.
3. **Cloudflare click collector** accepts a small allowlist of first-party
   action events and writes aggregate data points to Analytics Engine. It does
   not create a user profile or session identifier.
4. **Daily traffic reporter** queries both providers, normalizes their
   different freshness windows, and publishes a compact GitHub Actions summary
   plus downloadable JSON and Markdown artifacts.

The traffic reporter runs as a separate job in the existing daily workflow.
This prevents an analytics credential or provider outage from being presented
as a website availability, SEO, or GEO regression.

## Search Console integration

### Property verification

The property is the exact URL prefix:

`https://pouya-parsa.github.io/`

The owner has supplied Google's HTML verification file:

`googlec2d107d84ed0147d.html`

Its content is valid, but the current repository copy is under
`google-console/`. Implementation will relocate it to the repository root so
GitHub Pages serves the exact URL Google requests:

`https://pouya-parsa.github.io/googlec2d107d84ed0147d.html`

The file must remain published after verification because Google periodically
rechecks ownership.

### Daily authentication

GitHub Actions authenticates without a stored Google private key:

- A dedicated Google Cloud service account receives only the access required
  to read the verified Search Console property.
- A Workload Identity Pool trusts GitHub's OIDC issuer.
- The provider condition is restricted to
  `pouya-parsa/pouya-parsa.github.io` and `refs/heads/main`.
- The traffic job receives `id-token: write` and `contents: read`; other jobs
  retain read-only repository permissions.
- GitHub exchanges its OIDC token for short-lived Google credentials during
  each run.

The repository uses these GitHub Actions variables:

- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT_EMAIL`
- `SEARCH_CONSOLE_SITE_URL`

No Google JSON key is created or stored.

### Search report

The report includes:

- Latest finalized date
- Clicks, impressions, CTR, and average position for that date
- The same aggregate metrics for the trailing seven available days
- Top landing pages by clicks
- Top non-sensitive search queries by clicks

The report labels the source date prominently so delayed Search Console data
is not mistaken for real-time traffic.

## Cloudflare integration

### Web Analytics

Cloudflare's deferred beacon is added to both monitored HTML pages. Its public
site tag is not a password and may appear in page source. The integration does
not add cookies or persistent identifiers.

The daily report includes:

- Page views and approximate visits
- Top normalized page paths
- Top referrer groups
- Browser referrals from known AI-assistant domains as a distinct group
- Selected country and device aggregates when available
- Real-user performance data when the sample size is sufficient

Low-volume, sampled, or unavailable dimensions are shown as unavailable rather
than converted into misleading zeroes.

### First-party action events

The five allowed event names are:

- `paper_pdf`
- `interactive_article`
- `cv`
- `github_profile`
- `copy_citation`

A small deferred client script attaches only to elements explicitly annotated
with an allowed action. It sends the event without delaying navigation, using
`sendBeacon` or a keepalive request when supported.

The payload contains only:

- The allowlisted event name
- The normalized page path

It excludes full URLs, query strings, fragments, referrer values, IP
addresses, user agents, names, email addresses, and session or visitor IDs.

The Worker:

- Accepts only `POST` and CORS preflight requests
- Restricts browser origins to the production site and explicit local
  development origins
- Enforces a small request-body limit and JSON content type
- Validates the event allowlist and normalized page path
- Writes one aggregate Analytics Engine data point for a valid event
- Returns a small response and discloses no stored data

Origin validation limits accidental and browser-based misuse but is not proof
that every request came from a human. Action totals are therefore labeled
approximate and directional.

### Cloudflare credentials

Interactive development and deployment use Wrangler OAuth stored in the
macOS keychain. GitHub does not receive deployment permission.

The daily reporter uses:

- Secret: `CLOUDFLARE_API_TOKEN`
- Variable: `CLOUDFLARE_ACCOUNT_ID`
- Variable: `CLOUDFLARE_WEB_ANALYTICS_SITE_TAG`
- Variable: `CLOUDFLARE_ANALYTICS_DATASET`

The API token is restricted to the selected Cloudflare account with
`Account Analytics: Read`. The public Worker endpoint and Web Analytics site
tag may be committed or exposed as non-secret configuration.

## Daily report and workflow behavior

The existing scheduled workflow gains a `traffic-report` job that:

1. Authenticates to Google through GitHub OIDC.
2. Queries Search Console for its latest finalized data.
3. Queries Cloudflare Web Analytics and Analytics Engine for the previous UTC
   day and trailing seven days.
4. Normalizes provider responses into a stable internal report model.
5. Writes `traffic-report.json` and `traffic-report.md`.
6. Appends the Markdown report to the GitHub Actions job summary.
7. Uploads both files as artifacts on success or failure.

The summary clearly separates:

- **Site health:** availability, SEO, GEO, links, and Lighthouse
- **Search performance:** Search Console metrics
- **Audience:** Cloudflare page and visit metrics
- **Actions:** the five approved click events
- **Data quality:** source dates, sampling, freshness, and unavailable fields

Missing credentials, rejected authentication, or provider API failures produce
an actionable `DATA UNAVAILABLE` message. Reports and diagnostic metadata are
written before the traffic job fails. The independent site-health job can
still remain green, while the overall run visibly alerts the owner that the
analytics report needs attention.

No secret values, authorization headers, or raw API responses containing
unexpected fields are written to logs or artifacts.

## Privacy and interpretation

The implementation is designed not to use cookies, persistent identifiers, or
personal profiles. It records aggregate activity needed to understand whether
the site's research content is being discovered and used.

The public documentation will state:

- Visits and action counts are approximate.
- Search Console metrics are delayed.
- AI-assistant referrals are browser referrals, not crawler counts.
- Low-volume Cloudflare results may be sampled.
- Legal requirements can vary by jurisdiction; the design is a technical
  privacy decision, not a legal guarantee.

Because the site remains static and the analytics scripts are deferred, the
integration must not block rendering, change canonical content, or make page
content dependent on JavaScript.

## Credential handoff

The owner performs only account authentication and security-sensitive consent:

1. Add the Search Console URL-prefix property and obtain its verification
   file.
2. After the root verification file is live, click **Verify** in Search
   Console.
3. Complete the browser prompts launched by `gcloud auth login`.
4. Complete the browser prompts launched by
   `wrangler login --use-keyring`.
5. Confirm any provider security prompt or account-selection decision that
   cannot safely be inferred.

After those prompts, implementation can create and configure the Google Cloud
project, API, service account, Workload Identity Federation, Cloudflare Worker,
Analytics Engine binding, Web Analytics site, scoped reporting token, and
GitHub variables/secrets. If a provider requires a dashboard-only permission
change, it can be completed in the owner's authenticated browser session.

The repository documentation will include exact dashboard paths, CLI
verification commands, GitHub variable names, rotation/revocation steps, and
the expected output of a successful manual workflow run.

## Testing

Automated tests cover:

- Search Console and Cloudflare response normalization from local fixtures
- Latest-finalized-date and trailing-window calculations
- CTR and average-position aggregation without averaging averages incorrectly
- Referrer classification, including AI-assistant browser referrals
- Event-name and page-path validation
- Worker method, origin, content-type, size, and malformed-payload rejection
- Confirmation that stored event data contains no disallowed fields
- Markdown/JSON report generation and unavailable-data behavior
- Presence of the Web Analytics beacon on both monitored pages
- Presence and correctness of annotations for all five actions
- The Search Console verification file's required root path and exact content

Live provider calls are not part of the unit test suite. A manual,
credentialed workflow run provides the final integration check.

The existing site content, SEO/GEO audit, and Lighthouse test suites continue
to run. Performance verification confirms that the deferred instrumentation
does not cause the existing thresholds to regress.

## Acceptance criteria

The feature is accepted when:

1. The Search Console property is verified and the service account can query
   it through short-lived GitHub credentials.
2. Cloudflare Web Analytics receives production page views from both monitored
   pages.
3. Each high-value action produces an allowlisted aggregate event without
   storing a persistent identifier or disallowed payload field.
4. A manual daily workflow run shows search, audience, and action sections
   with explicit source dates and interpretation labels.
5. Provider dashboards remain available for detailed investigation.
6. An invalid credential fixture and an unavailable provider fixture produce
   a readable diagnostic report.
7. Existing repository tests and site-health monitoring pass.
8. No permanent Google key or Cloudflare deployment credential is stored in
   GitHub.

## Alternatives considered

### Google Analytics 4

GA4 provides mature event reporting, but it adds a broader tracking stack and
more identity/session concepts than this personal research site needs.
Search Console plus Cloudflare keeps the design smaller and more
privacy-conscious.

### Provider dashboards only

This is simpler initially, but it separates traffic data from the existing
daily operational summary and makes missed credential failures less visible.

### Custom domain and Cloudflare proxy now

A proxy would provide request logs for reliable AI crawler classification, but
it changes DNS and hosting infrastructure. It is better treated as a later,
explicit phase after browser and search reporting is working.
