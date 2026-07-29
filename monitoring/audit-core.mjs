import * as cheerio from "cheerio";
import robotsParser from "robots-parser";

const makeCheck = (id, passed, message, detail = {}) => ({
  id,
  status: passed ? "pass" : "fail",
  message,
  ...detail,
});

const content = ($, selector, attribute = "content") =>
  $(selector).first().attr(attribute)?.trim() ?? "";

const countId = ($, id) =>
  $("[id]").filter((_, element) => $(element).attr("id") === id).length;

const normalizeText = (value) => value.replace(/\s+/g, " ").trim();

const schemaTypes = (nodes) =>
  new Set(
    nodes.flatMap((node) => {
      const type = node?.["@type"];
      return Array.isArray(type) ? type : type ? [type] : [];
    })
  );

const hasSameAs = (person) =>
  typeof person?.sameAs === "string"
    ? person.sameAs.length > 0
    : Array.isArray(person?.sameAs) && person.sameAs.length > 0;

const isIgnoredUrl = (raw) =>
  !raw ||
  raw.startsWith("#") ||
  /^(mailto:|tel:|data:|javascript:)/i.test(raw);

export function collectJsonLdNodes($) {
  const nodes = [];
  const errors = [];

  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const value = JSON.parse($(element).text());
      if (Array.isArray(value)) {
        nodes.push(...value);
      } else if (Array.isArray(value?.["@graph"])) {
        nodes.push(...value["@graph"]);
      } else {
        nodes.push(value);
      }
    } catch (error) {
      errors.push(error.message);
    }
  });

  return { nodes, errors };
}

export function auditHtmlPage({ html, fetchUrl, policy }) {
  const $ = cheerio.load(html);
  const checks = [];
  const title = $("title").first().text().trim();
  const description = content($, 'meta[name="description"]');
  const canonical = content($, 'link[rel="canonical"]', "href");
  const robots = content($, 'meta[name="robots"]').toLowerCase();
  const h1Count = $("h1").length;
  const h2Count = $("main h2").length;
  const lang = $("html").attr("lang")?.trim() ?? "";
  const viewport = content($, 'meta[name="viewport"]');
  const openGraph = Object.fromEntries(
    policy.requiredOpenGraph.map((name) => [
      name,
      content($, `meta[property="${name}"]`),
    ])
  );
  const twitter = Object.fromEntries(
    policy.requiredTwitter.map((name) => [
      name,
      content($, `meta[name="${name}"]`),
    ])
  );
  const missingAlt = $("img").filter((_, image) => {
    const alt = $(image).attr("alt");
    return alt === undefined || alt.trim() === "";
  }).length;
  const { nodes, errors } = collectJsonLdNodes($);
  const types = schemaTypes(nodes);

  checks.push(
    makeCheck("meta.title", Boolean(title), "Page has a title", {
      url: fetchUrl,
    })
  );
  checks.push(
    makeCheck(
      "meta.description",
      Boolean(description),
      "Page has a meta description",
      { url: fetchUrl }
    )
  );
  checks.push(
    makeCheck(
      "meta.canonical",
      canonical === policy.canonicalUrl,
      "Canonical matches policy",
      {
        url: fetchUrl,
        expected: policy.canonicalUrl,
        observed: canonical,
      }
    )
  );
  checks.push(
    makeCheck("meta.h1", h1Count === 1, "Page has exactly one h1", {
      url: fetchUrl,
      expected: 1,
      observed: h1Count,
    })
  );
  checks.push(
    makeCheck(
      "geo.semantic-headings",
      h1Count === 1 && h2Count > 0,
      "Main content has a semantic h1/h2 hierarchy",
      {
        url: fetchUrl,
        observed: { h1: h1Count, h2: h2Count },
      }
    )
  );
  checks.push(
    makeCheck(
      "meta.lang",
      Boolean(lang),
      "Document language is declared",
      { url: fetchUrl }
    )
  );
  checks.push(
    makeCheck(
      "meta.viewport",
      Boolean(viewport),
      "Viewport is declared",
      { url: fetchUrl }
    )
  );
  checks.push(
    makeCheck(
      "meta.indexable",
      !robots.includes("noindex"),
      "Page does not request noindex",
      { url: fetchUrl }
    )
  );
  checks.push(
    makeCheck(
      "meta.open-graph",
      Object.values(openGraph).every(Boolean) &&
        openGraph["og:url"] === policy.canonicalUrl,
      "Required Open Graph fields are present and og:url matches canonical",
      { url: fetchUrl }
    )
  );
  checks.push(
    makeCheck(
      "meta.twitter",
      Object.values(twitter).every(Boolean),
      "Required Twitter fields are present",
      { url: fetchUrl }
    )
  );
  checks.push(
    makeCheck(
      "images.alt",
      missingAlt === 0,
      "Meaningful images have alt text",
      {
        url: fetchUrl,
        expected: 0,
        observed: missingAlt,
      }
    )
  );
  checks.push(
    makeCheck(
      "schema.json",
      errors.length === 0 && nodes.length > 0,
      "JSON-LD parses",
      {
        url: fetchUrl,
        observed: errors,
      }
    )
  );
  checks.push(
    makeCheck(
      "schema.required-types",
      policy.requiredSchemaTypes.every((type) => types.has(type)),
      "Required schema types are present",
      {
        url: fetchUrl,
        expected: policy.requiredSchemaTypes,
        observed: [...types],
      }
    )
  );

  const person = nodes.find((node) => node?.["@type"] === "Person");
  checks.push(
    makeCheck(
      "geo.person-identity",
      person?.["@id"] === policy.personId &&
        person?.name === "Pouya Parsa" &&
        person?.url === new URL("/", policy.canonicalUrl).href &&
        hasSameAs(person),
      "Person identity is stable and attributable",
      { url: fetchUrl }
    )
  );

  if (policy.paper) {
    const article = nodes.find(
      (node) => node?.["@type"] === "ScholarlyArticle"
    );
    const citationTitle = content($, 'meta[name="citation_title"]');
    const citationAuthors = $('meta[name="citation_author"]')
      .map((_, element) => $(element).attr("content")?.trim())
      .get();
    const citationDate = content(
      $,
      'meta[name="citation_publication_date"]'
    );
    const citationArxiv = content($, 'meta[name="citation_arxiv_id"]');
    const citationPdf = content($, 'meta[name="citation_pdf_url"]');
    const figureCount = $("figure").length;
    const captionCount = $("figure figcaption").length;
    const paperLinked = $(`a[href="${policy.paper.pdfUrl}"]`).length > 0;
    const visibleHeading = normalizeText($("h1").text());
    const articleAuthorIds = Array.isArray(article?.author)
      ? article.author.map((author) => author?.["@id"])
      : [];

    checks.push(
      makeCheck(
        "geo.paper-identity",
        article?.headline === policy.paper.title &&
          article?.identifier === `arXiv:${policy.paper.arxivId}` &&
          article?.datePublished === policy.paper.datePublished &&
          article?.url === policy.canonicalUrl &&
          article?.sameAs === policy.paper.sourceUrl &&
          articleAuthorIds.includes(policy.personId) &&
          visibleHeading === policy.paper.title &&
          citationTitle === policy.paper.title &&
          JSON.stringify(citationAuthors) ===
            JSON.stringify(policy.paper.authors) &&
          citationDate === policy.paper.citationDate &&
          citationArxiv === policy.paper.arxivId &&
          citationPdf === policy.paper.pdfUrl,
        "Visible and machine-readable paper identity agrees",
        { url: fetchUrl }
      )
    );
    checks.push(
      makeCheck(
        "geo.paper-source",
        paperLinked,
        "Article links to the primary paper PDF",
        { url: fetchUrl }
      )
    );
    checks.push(
      makeCheck(
        "geo.figures",
        figureCount === policy.paper.figureCount &&
          captionCount === policy.paper.figureCount,
        "All official figures have visible captions",
        {
          url: fetchUrl,
          expected: policy.paper.figureCount,
          observed: { figures: figureCount, captions: captionCount },
        }
      )
    );
  }

  const internalUrls = new Set();
  const externalUrls = new Set();
  const linkTargets = [
    ["a[href]", "href"],
    ["img[src]", "src"],
    [
      'link[rel~="stylesheet"][href], link[rel~="icon"][href], link[rel="preload"][href]',
      "href",
    ],
    ["script[src]", "src"],
    ['meta[property="og:image"]', "content"],
    ['meta[name="twitter:image"]', "content"],
  ];

  for (const [selector, attribute] of linkTargets) {
    $(selector).each((_, element) => {
      const raw = $(element).attr(attribute);
      if (isIgnoredUrl(raw)) return;

      try {
        const resolved = new URL(raw, fetchUrl);
        resolved.hash = "";
        if (resolved.origin === new URL(fetchUrl).origin) {
          internalUrls.add(resolved.href);
        } else {
          externalUrls.add(resolved.href);
        }
      } catch {
        checks.push(
          makeCheck(
            "links.url",
            false,
            `Link target is not a valid URL: ${raw}`,
            { url: fetchUrl, observed: raw }
          )
        );
      }
    });
  }

  $("a[href^='#']").each((_, anchor) => {
    const fragment = decodeURIComponent($(anchor).attr("href").slice(1));
    if (!fragment) return;

    checks.push(
      makeCheck(
        `fragment.${fragment}`,
        countId($, fragment) === 1,
        `Fragment #${fragment} resolves exactly once`,
        { url: fetchUrl }
      )
    );
  });

  return {
    checks,
    internalUrls: [...internalUrls].sort(),
    externalUrls: [...externalUrls].sort(),
    title,
    canonical,
  };
}

export function auditRobots({
  text,
  robotsUrl,
  sitemapUrl,
  pageUrls,
  userAgents,
}) {
  const parser = robotsParser(robotsUrl, text);
  const sitemapDeclared = text
    .split(/\r?\n/)
    .some(
      (line) =>
        line.trim().toLowerCase() ===
        `sitemap: ${sitemapUrl}`.toLowerCase()
    );
  const checks = [
    makeCheck(
      "robots.sitemap",
      sitemapDeclared,
      "robots.txt references the canonical sitemap",
      { url: robotsUrl, expected: sitemapUrl }
    ),
  ];

  for (const agent of userAgents) {
    const allowed = pageUrls.every(
      (pageUrl) => parser.isAllowed(pageUrl, agent) !== false
    );
    checks.push(
      makeCheck(
        `robots.${agent}`,
        allowed,
        `${agent} can crawl every monitored page`,
        { url: robotsUrl }
      )
    );
  }

  return checks;
}

export function auditSitemap({ xml, requiredCanonicalUrls }) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const locations = $("urlset > url > loc")
    .map((_, element) => $(element).text().trim())
    .get();
  const absoluteLocations = locations.filter((location) => {
    try {
      return new URL(location).protocol.startsWith("http");
    } catch {
      return false;
    }
  });
  const counts = new Map();
  for (const location of locations) {
    counts.set(location, (counts.get(location) ?? 0) + 1);
  }
  const duplicates = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([location]) => location);
  const missingOrRepeated = requiredCanonicalUrls.filter(
    (url) => counts.get(url) !== 1
  );

  return [
    makeCheck(
      "sitemap.xml",
      $("urlset").length === 1 &&
        locations.length > 0 &&
        absoluteLocations.length === locations.length,
      "Sitemap has a valid urlset with absolute URLs",
      { observed: locations }
    ),
    makeCheck(
      "sitemap.required",
      missingOrRepeated.length === 0,
      "Every monitored canonical URL appears exactly once",
      {
        expected: requiredCanonicalUrls,
        observed: locations,
      }
    ),
    makeCheck(
      "sitemap.duplicates",
      duplicates.length === 0,
      "Sitemap has no duplicate URLs",
      { observed: duplicates }
    ),
  ];
}

export function auditCrossPageMetadata(pageResults) {
  const duplicateValues = (key) => {
    const counts = new Map();
    for (const page of pageResults) {
      const value = page[key];
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([value]) => value);
  };
  const duplicateTitles = duplicateValues("title");
  const duplicateCanonicals = duplicateValues("canonical");

  return [
    makeCheck(
      "meta.unique-title",
      duplicateTitles.length === 0,
      "Monitored page titles are unique",
      { observed: duplicateTitles }
    ),
    makeCheck(
      "meta.unique-canonical",
      duplicateCanonicals.length === 0,
      "Monitored page canonicals are unique",
      { observed: duplicateCanonicals }
    ),
  ];
}
