const baseUrl = new URL(
  "/",
  process.env.LHCI_BASE_URL || "https://pouya-parsa.github.io/"
);
const metric = (maxNumericValue) => [
  "error",
  { maxNumericValue, aggregationMethod: "median" },
];
const category = (minScore) => [
  "error",
  { minScore, aggregationMethod: "median" },
];

module.exports = {
  ci: {
    collect: {
      url: [
        new URL("/", baseUrl).href,
        new URL("/cloud-drive/", baseUrl).href,
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: "--headless --no-sandbox",
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
      },
    },
    assert: {
      assertions: {
        "categories:performance": category(0.8),
        "categories:accessibility": category(0.9),
        "categories:best-practices": category(0.9),
        "categories:seo": category(0.95),
        "largest-contentful-paint": metric(3000),
        "cumulative-layout-shift": metric(0.1),
        "total-blocking-time": metric(300),
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".monitoring/lighthouse",
    },
  },
};
