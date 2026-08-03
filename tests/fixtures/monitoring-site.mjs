export function page({
  canonical,
  title,
  schema,
  body = "<main><h1>Page heading</h1><h2>Section heading</h2></main>",
  extraHead = "",
  socialImage = "https://pouya-parsa.github.io/profile_image.png",
}) {
  const description = `${title} has a sufficiently descriptive summary.`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${socialImage}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${socialImage}">
  ${extraHead}
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>${body}</body>
</html>`;
}

export const personNode = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://pouya-parsa.github.io/#pouya-parsa",
  name: "Pouya Parsa",
  url: "https://pouya-parsa.github.io/",
  sameAs: "https://github.com/pouya-parsa",
};

export const validHomepageHtml = page({
  canonical: "https://pouya-parsa.github.io/",
  title: "Pouya Parsa",
  schema: personNode,
  body: '<main><h1>Pouya Parsa</h1><h2>About me</h2><img src="/profile_image.png" alt="Pouya Parsa"></main>',
});

export const validArticleHtml = page({
  canonical: "https://pouya-parsa.github.io/cloud-drive/",
  title: "Can the Cloud Drive? Interactive 5G/6G Study | Pouya Parsa",
  schema: {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ScholarlyArticle",
        headline:
          "Can the Cloud Drive? Infrastructure Feasibility of Offloading Autonomous Driving Across 5G and 6G",
        identifier: "arXiv:2607.09045",
        datePublished: "2026-07-10",
        url: "https://pouya-parsa.github.io/cloud-drive/",
        sameAs: "https://arxiv.org/abs/2607.09045",
        author: [{ "@id": "https://pouya-parsa.github.io/#pouya-parsa" }],
      },
      personNode,
      { "@type": "BreadcrumbList", itemListElement: [] },
    ],
  },
  extraHead: `
    <meta name="citation_title" content="Can the Cloud Drive? Infrastructure Feasibility of Offloading Autonomous Driving Across 5G and 6G">
    <meta name="citation_author" content="Parsa, Pouya">
    <meta name="citation_author" content="Han, Kawon">
    <meta name="citation_author" content="Choi, Seongjin">
    <meta name="citation_publication_date" content="2026/07/10">
    <meta name="citation_arxiv_id" content="2607.09045">
    <meta name="citation_pdf_url" content="https://arxiv.org/pdf/2607.09045">`,
  body: `<main><h1>Can the Cloud Drive? Infrastructure Feasibility of Offloading Autonomous Driving Across 5G and 6G</h1>
    <h2>Paper overview</h2>
    <a href="https://arxiv.org/pdf/2607.09045">Paper</a>
    ${Array.from({ length: 10 }, (_, index) =>
      `<figure id="figure-${index + 1}"><img src="/images/cloud-drive/figure-${String(index + 1).padStart(2, "0")}.svg" alt="Figure ${index + 1} description"><figcaption>Figure ${index + 1}: Result</figcaption></figure>`
    ).join("")}</main>`,
});

export const validVdaArticleHtml = page({
  canonical:
    "https://pouya-parsa.github.io/visual-distribution-anchoring/",
  title:
    "Visual Distribution Anchoring for Efficient Prompt Tuning | Pouya Parsa",
  socialImage:
    "https://pouya-parsa.github.io/images/visual-distribution-anchoring/method-overview.webp",
  schema: {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ScholarlyArticle",
        headline:
          "Visual Distribution Anchoring for Efficient Prompt Tuning",
        identifier: "arXiv:2607.28967",
        datePublished: "2026-07-30",
        url:
          "https://pouya-parsa.github.io/visual-distribution-anchoring/",
        sameAs: "https://arxiv.org/abs/2607.28967",
        image:
          "https://pouya-parsa.github.io/images/visual-distribution-anchoring/method-overview.webp",
        author: [
          { "@id": "https://pouya-parsa.github.io/#pouya-parsa" },
          { "@type": "Person", name: "Raoof Zare Moayedi" },
          { "@type": "Person", name: "Seongjin Choi" },
        ],
      },
      personNode,
      { "@type": "BreadcrumbList", itemListElement: [] },
    ],
  },
  extraHead: `
    <meta name="citation_title" content="Visual Distribution Anchoring for Efficient Prompt Tuning">
    <meta name="citation_author" content="Parsa, Pouya">
    <meta name="citation_author" content="Moayedi, Raoof Zare">
    <meta name="citation_author" content="Choi, Seongjin">
    <meta name="citation_publication_date" content="2026/07/30">
    <meta name="citation_arxiv_id" content="2607.28967">`,
  body: `<main>
    <h1>Visual Distribution Anchoring for Efficient Prompt Tuning</h1>
    <h2>Paper overview</h2>
    <a href="https://arxiv.org/abs/2607.28967">Paper</a>
    <figure id="figure-1">
      <img src="/images/visual-distribution-anchoring/method-overview.webp" alt="VDA method overview">
      <figcaption>Figure 1: Visual Distribution Anchoring method overview.</figcaption>
    </figure>
  </main>`,
});

export const validRobots = `User-agent: *
Allow: /

Sitemap: https://pouya-parsa.github.io/sitemap.xml
`;

export const validSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://pouya-parsa.github.io/</loc></url>
  <url><loc>https://pouya-parsa.github.io/cloud-drive/</loc></url>
  <url><loc>https://pouya-parsa.github.io/visual-distribution-anchoring/</loc></url>
</urlset>`;
