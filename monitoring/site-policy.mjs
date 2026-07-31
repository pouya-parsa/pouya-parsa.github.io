const absolute = (pathname, base) =>
  new URL(pathname.replace(/^\//, ""), base).href;

export function buildSitePolicy({
  fetchBaseUrl = "https://pouya-parsa.github.io/",
  canonicalBaseUrl = "https://pouya-parsa.github.io/",
} = {}) {
  const fetchBase = new URL("/", fetchBaseUrl).href;
  const canonicalBase = new URL("/", canonicalBaseUrl).href;
  const shared = {
    requiredOpenGraph: [
      "og:type",
      "og:url",
      "og:title",
      "og:description",
      "og:image",
    ],
    requiredTwitter: [
      "twitter:card",
      "twitter:title",
      "twitter:description",
      "twitter:image",
    ],
  };

  return {
    fetchBaseUrl: fetchBase,
    canonicalBaseUrl: canonicalBase,
    robotsUrl: absolute("/robots.txt", fetchBase),
    sitemapUrl: absolute("/sitemap.xml", fetchBase),
    canonicalSitemapUrl: absolute("/sitemap.xml", canonicalBase),
    userAgents: [
      "Googlebot",
      "OAI-SearchBot",
      "PerplexityBot",
      "SiteMonitor",
    ],
    pages: [
      {
        ...shared,
        path: "/",
        fetchUrl: absolute("/", fetchBase),
        canonicalUrl: absolute("/", canonicalBase),
        requiredSchemaTypes: ["Person"],
        personId: `${canonicalBase}#pouya-parsa`,
      },
      {
        ...shared,
        path: "/cloud-drive/",
        fetchUrl: absolute("/cloud-drive/", fetchBase),
        canonicalUrl: absolute("/cloud-drive/", canonicalBase),
        requiredSchemaTypes: [
          "ScholarlyArticle",
          "Person",
          "BreadcrumbList",
        ],
        personId: `${canonicalBase}#pouya-parsa`,
        paper: {
          arxivId: "2607.09045",
          title:
            "Can the Cloud Drive? Infrastructure Feasibility of Offloading Autonomous Driving Across 5G and 6G",
          authors: ["Parsa, Pouya", "Han, Kawon", "Choi, Seongjin"],
          datePublished: "2026-07-10",
          citationDate: "2026/07/10",
          pdfUrl: "https://arxiv.org/pdf/2607.09045",
          sourceUrl: "https://arxiv.org/abs/2607.09045",
          figureCount: 10,
        },
      },
      {
        ...shared,
        path: "/visual-distribution-anchoring/",
        fetchUrl: absolute(
          "/visual-distribution-anchoring/",
          fetchBase
        ),
        canonicalUrl: absolute(
          "/visual-distribution-anchoring/",
          canonicalBase
        ),
        requiredSchemaTypes: [
          "ScholarlyArticle",
          "Person",
          "BreadcrumbList",
        ],
        personId: `${canonicalBase}#pouya-parsa`,
        paper: {
          title:
            "Visual Distribution Anchoring for Efficient Prompt Tuning",
          authors: [
            "Parsa, Pouya",
            "Moayedi, Raoof Zare",
            "Choi, Seongjin",
          ],
          datePublished: "2026-07-30",
          citationDate: "2026/07/30",
          figureCount: 1,
        },
      },
    ],
  };
}
