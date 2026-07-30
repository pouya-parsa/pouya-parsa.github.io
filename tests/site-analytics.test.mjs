import test from "node:test";
import assert from "node:assert/strict";
import {
  createActionPayload,
  initActionTracking,
  normalizePagePath,
  transmitAction,
} from "../scripts/site-analytics.mjs";

test("action payload is limited to event and normalized page path", () => {
  assert.equal(normalizePagePath("/cloud-drive/index.html"), "/cloud-drive/");
  assert.equal(normalizePagePath("/"), "/");
  assert.equal(normalizePagePath("/unknown/"), null);
  assert.deepEqual(createActionPayload("paper_pdf", "/cloud-drive/"), {
    event: "paper_pdf",
    pagePath: "/cloud-drive/",
  });
  assert.equal(createActionPayload("page_view", "/"), null);
});

test("fetch fallback uses keepalive and sends no visitor fields", async () => {
  const calls = [];
  const accepted = transmitAction({
    endpoint: "https://events.example.test/event",
    event: "cv",
    pagePath: "/",
    navigatorImpl: {},
    fetchImpl: async (url, options) => calls.push({ url, options }),
  });

  assert.equal(accepted, true);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls[0].options.keepalive, true);
  assert.equal(calls[0].options.headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    event: "cv",
    pagePath: "/",
  });
  assert.doesNotMatch(calls[0].options.body, /email|referrer|userAgent|ip/i);
});

test("successful sendBeacon avoids the fetch fallback", () => {
  const beacons = [];
  const fetchCalls = [];
  const accepted = transmitAction({
    endpoint: "https://events.example.test/event",
    event: "copy_citation",
    pagePath: "/cloud-drive/",
    navigatorImpl: {
      sendBeacon(url, body) {
        beacons.push({ url, body });
        return true;
      },
    },
    fetchImpl: (...args) => fetchCalls.push(args),
  });

  assert.equal(accepted, true);
  assert.equal(beacons.length, 1);
  assert.equal(beacons[0].url, "https://events.example.test/event");
  assert.equal(beacons[0].body.type, "application/json");
  assert.deepEqual(fetchCalls, []);
});

test("tracking attaches only annotated clicks on known pages", async () => {
  const calls = [];
  let clickListener;
  const documentImpl = {
    querySelector(selector) {
      assert.equal(selector, 'meta[name="site-analytics-endpoint"]');
      return {
        getAttribute(name) {
          assert.equal(name, "content");
          return "https://events.example.test/event";
        },
      };
    },
    addEventListener(type, listener) {
      assert.equal(type, "click");
      clickListener = listener;
    },
  };

  initActionTracking({
    documentImpl,
    locationImpl: { pathname: "/cloud-drive/index.html" },
    navigatorImpl: {},
    fetchImpl: async (url, options) => calls.push({ url, options }),
  });

  clickListener({
    target: {
      closest(selector) {
        assert.equal(selector, "[data-analytics-event]");
        return {
          getAttribute(name) {
            assert.equal(name, "data-analytics-event");
            return "paper_pdf";
          },
        };
      },
    },
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(JSON.parse(calls[0].options.body), {
    event: "paper_pdf",
    pagePath: "/cloud-drive/",
  });
});
