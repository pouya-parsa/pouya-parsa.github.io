export const searchDates = {
  rows: [
    {
      keys: ["2026-07-25"],
      clicks: 2,
      impressions: 80,
      ctr: 0.025,
      position: 9.2,
    },
    {
      keys: ["2026-07-26"],
      clicks: 3,
      impressions: 100,
      ctr: 0.03,
      position: 8.4,
    },
  ],
  metadata: { first_incomplete_date: "2026-07-27" },
};

export const searchDaily = {
  rows: [{ clicks: 3, impressions: 100, ctr: 0.03, position: 8.4 }],
};

export const searchTrailing7 = {
  rows: [{ clicks: 14, impressions: 500, ctr: 0.028, position: 9.1 }],
};

export const searchPages = {
  rows: [
    {
      keys: ["https://pouya-parsa.github.io/cloud-drive/"],
      clicks: 8,
      impressions: 220,
      ctr: 0.03636,
      position: 7.5,
    },
  ],
};

export const searchQueries = {
  rows: [
    {
      keys: ["cloud vla inference"],
      clicks: 4,
      impressions: 70,
      ctr: 0.05714,
      position: 6.2,
    },
  ],
};

export const cloudflareRum = {
  data: {
    viewer: {
      accounts: [
        {
          total: [
            { count: 12, avg: { sampleInterval: 1 }, sum: { visits: 8 } },
          ],
          topPaths: [
            {
              count: 7,
              avg: { sampleInterval: 1 },
              sum: { visits: 5 },
              dimensions: { requestPath: "/cloud-drive/" },
            },
          ],
          topReferrers: [
            {
              count: 3,
              avg: { sampleInterval: 1 },
              sum: { visits: 2 },
              dimensions: { refererHost: "chatgpt.com" },
            },
            {
              count: 4,
              avg: { sampleInterval: 1 },
              sum: { visits: 3 },
              dimensions: { refererHost: "www.google.com" },
            },
          ],
          countries: [],
          devices: [],
          webVitals: [
            {
              count: 100,
              quantiles: {
                largestContentfulPaintP75: 1350,
                interactionToNextPaintP75: 120,
                cumulativeLayoutShiftP75: 0.01,
              },
            },
          ],
        },
      ],
    },
  },
};

export const cloudflareActions = {
  meta: [
    { name: "event", type: "String" },
    { name: "page_path", type: "String" },
    { name: "count", type: "UInt64" },
  ],
  data: [
    { event: "paper_pdf", page_path: "/cloud-drive/", count: 4 },
    { event: "copy_citation", page_path: "/cloud-drive/", count: 2 },
  ],
  rows: 2,
};
