# Audience and search analytics

The daily report combines finalized Google Search Console performance,
bot-filtered Cloudflare Web Analytics, and five privacy-conscious site actions.
Open **GitHub → Actions → Daily SEO and GEO monitor** to see the latest report.
Each run publishes a readable job summary and a `traffic-report-<run-id>`
artifact containing JSON and Markdown. Artifacts are retained for 90 days.

## Provider dashboards

- Google Search Console → **Performance → Search results** shows search clicks,
  impressions, queries, pages, countries, devices, and appearance.
- Cloudflare → **Analytics & Logs → Web Analytics** shows page views,
  approximate visits, referrers, paths, geography, devices, and real-user Web
  Vitals.
- GitHub → **Actions → Daily SEO and GEO monitor** combines both providers with
  the high-value action counts.

## Metric definitions

| Metric | Meaning |
| --- | --- |
| Clicks | Google search-result clicks that opened the site. |
| Impressions | Times Google showed a site result on a search results page. |
| CTR | Clicks divided by impressions. |
| Average position | Google's average position for the topmost site result in each impression. Lower is generally better. |
| Page views | Bot-filtered Cloudflare page-load events, adjusted for provider sampling. |
| Approx. visits | Cloudflare's approximate visit total. It is not a durable user identifier or an exact people count. |
| High-value actions | Approximate clicks on the paper PDF, interactive article, CV, GitHub profile, and copy-citation button. |
| AI-assistant browser referrals | Page loads whose browser referrer is ChatGPT, Perplexity, Claude, Gemini, or Microsoft Copilot. |
| p75 Web Vitals | The 75th-percentile LCP, INP, and CLS from real-user measurements. The report withholds them below 75 samples. |

Search Console normally lags by two to three days. The collector discovers the
latest finalized day and labels Search Console ranges in
`America/Los_Angeles`, matching Google. It uses Google's aggregate row for CTR
and average position rather than averaging query or page rows.

Cloudflare ranges are the previous complete UTC day and previous seven complete
UTC days. Page views and action events may be sampled; the report applies the
providers' sample intervals. Visits and action counts are therefore labeled
approximate.

AI-assistant referrals are browser referrals, not crawler requests. GitHub Pages
does not expose the server request logs needed to count GPTBot,
OAI-SearchBot, PerplexityBot, or similar crawlers. Counting those requests would
require a future custom domain or reverse proxy with privacy-conscious request
logging.

## Credentials and access

The workflow uses these GitHub repository variables:

- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT_EMAIL`
- `SEARCH_CONSOLE_SITE_URL`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_WEB_ANALYTICS_SITE_TAG`
- `CLOUDFLARE_ANALYTICS_DATASET`

It uses one GitHub repository secret:

- `CLOUDFLARE_API_TOKEN`

The Google identity is keyless. GitHub OIDC may impersonate the reporting
service account only for `pouya-parsa/pouya-parsa.github.io` on
`refs/heads/main`. The service account is a **Restricted** Search Console user
and has no user-managed keys.

The Search Console property remains verifiable through
`/googlec2d107d84ed0147d.html`. If access is rebuilt, deploy that root file,
verify `https://pouya-parsa.github.io/`, then add
`site-traffic-reporter@pp-site-metrics-2607300206.iam.gserviceaccount.com` in
**Search Console → Settings → Users and permissions** with **Restricted**
permission.

The Cloudflare token must have only **Account Analytics: Read**, restricted to
the account containing Web Analytics and Analytics Engine. Do not grant Workers
write, account settings write, or zone edit permissions.

Verify local CLI sessions without printing tokens:

```bash
gcloud auth login
gcloud auth list
gcloud config get project

npx wrangler login --use-keyring
npx wrangler whoami --json

gh auth status
gh variable list
gh secret list
```

## Run and inspect manually

From GitHub, open **Actions → Daily SEO and GEO monitor → Run workflow**, choose
`main`, and select **Run workflow**. The `monitor` and `traffic-report` jobs are
independent: a traffic-provider failure does not hide the live-site, crawler,
metadata, or Lighthouse results.

The same operation is available through GitHub CLI:

```bash
gh workflow run daily-site-monitor.yml --ref main
gh run list --workflow daily-site-monitor.yml --limit 5
gh run view --web
```

Open the `traffic-report` job summary for the daily tables. Download the
`traffic-report-<run-id>` artifact for `.monitoring/traffic-report.json` and
`.monitoring/traffic-report.md`. A configured provider that cannot be read marks
the job **DATA UNAVAILABLE** and fails the reporting gate after preserving the
artifact.

## Revoke or rotate access

To rotate Cloudflare access:

1. Create a replacement under **My Profile → API Tokens** with only
   **Account Analytics: Read** and the single account resource.
2. Store it through the hidden prompt:

   ```bash
   gh secret set CLOUDFLARE_API_TOKEN
   ```

3. Run the workflow manually and confirm both Cloudflare queries succeed.
4. Delete the old Cloudflare token.

To remove Google Search Console access, open
**Settings → Users and permissions**, open the service-account row, and remove
it. To stop GitHub federation without deleting resources:

```bash
gcloud iam workload-identity-pools providers update-oidc site-monitor \
  --location=global \
  --workload-identity-pool=github-actions \
  --project=pp-site-metrics-2607300206 \
  --disabled
```

To end the local Cloudflare CLI session:

```bash
npx wrangler logout
```

The browser instrumentation is designed without cookies or persistent
identifiers. The action collector stores only an approved action name, a
normalized page path, and an aggregate count. This is an engineering privacy
choice, not legal advice.
