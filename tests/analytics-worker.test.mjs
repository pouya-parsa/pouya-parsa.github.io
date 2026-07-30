import test from "node:test";
import assert from "node:assert/strict";
import { handleRequest } from "../workers/site-events/src/index.mjs";

const origin = "https://pouya-parsa.github.io";

const post = (body, headers = {}) =>
  new Request("https://events.example.test/event", {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

const request = ({
  method = "POST",
  path = "/event",
  body,
  headers = {},
} = {}) =>
  new Request(`https://events.example.test${path}`, {
    method,
    headers: {
      origin,
      ...headers,
    },
    ...(body === undefined ? {} : { body }),
  });

const environment = () => {
  const points = [];
  return {
    points,
    env: {
      EVENTS: {
        writeDataPoint(point) {
          points.push(point);
        },
      },
      ALLOWED_ORIGINS:
        "https://pouya-parsa.github.io,http://localhost:8000,http://127.0.0.1:8000",
    },
  };
};

test("collector stores only event and normalized page path", async () => {
  const { env, points } = environment();
  const response = await handleRequest(
    post({ event: "paper_pdf", pagePath: "/cloud-drive/" }),
    env
  );

  assert.equal(response.status, 202);
  assert.equal(response.headers.get("access-control-allow-origin"), origin);
  assert.deepEqual(points, [
    {
      blobs: ["paper_pdf", "/cloud-drive/"],
      doubles: [1],
      indexes: ["paper_pdf"],
    },
  ]);
  assert.doesNotMatch(JSON.stringify(points), /email|userAgent|referrer|ip/i);
});

test("collector rejects extra fields and disallowed events", async () => {
  for (const body of [
    { event: "page_view", pagePath: "/" },
    { event: "cv", pagePath: "/", email: "visitor@example.test" },
    { event: "cv", pagePath: "/?source=mail" },
  ]) {
    const { env, points } = environment();
    const response = await handleRequest(post(body), env);
    assert.equal(response.status, 400);
    assert.deepEqual(points, []);
  }
});

test("collector answers an allowed CORS preflight without storing data", async () => {
  const { env, points } = environment();
  const response = await handleRequest(
    request({
      method: "OPTIONS",
      headers: {
        "access-control-request-method": "POST",
        "access-control-request-headers": "Content-Type",
      },
    }),
    env
  );

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), origin);
  assert.equal(
    response.headers.get("access-control-allow-methods"),
    "POST, OPTIONS"
  );
  assert.deepEqual(points, []);
});

test("collector rejects disallowed origins, routes, methods, and media types", async () => {
  const cases = [
    {
      expected: 403,
      value: post(
        { event: "cv", pagePath: "/" },
        { origin: "https://attacker.example" }
      ),
    },
    {
      expected: 404,
      value: request({
        path: "/unknown",
        body: '{"event":"cv","pagePath":"/"}',
        headers: { "content-type": "application/json" },
      }),
    },
    {
      expected: 405,
      value: request({ method: "GET" }),
    },
    {
      expected: 415,
      value: request({
        body: '{"event":"cv","pagePath":"/"}',
        headers: { "content-type": "text/plain" },
      }),
    },
    {
      expected: 415,
      value: request({
        body: '{"event":"cv","pagePath":"/"}',
        headers: { "content-type": "application/jsonp" },
      }),
    },
  ];

  for (const { expected, value } of cases) {
    const { env, points } = environment();
    const response = await handleRequest(value, env);
    assert.equal(response.status, expected);
    assert.deepEqual(points, []);
  }
});

test("collector rejects malformed and oversized JSON without storing data", async () => {
  const cases = [
    {
      expected: 400,
      value: request({
        body: "{",
        headers: { "content-type": "application/json" },
      }),
    },
    {
      expected: 413,
      value: request({
        body: "{}",
        headers: {
          "content-type": "application/json",
          "content-length": "513",
        },
      }),
    },
    {
      expected: 413,
      value: request({
        body: JSON.stringify({
          event: "cv",
          pagePath: "/",
          padding: "x".repeat(512),
        }),
        headers: { "content-type": "application/json" },
      }),
    },
  ];

  for (const { expected, value } of cases) {
    const { env, points } = environment();
    const response = await handleRequest(value, env);
    assert.equal(response.status, expected);
    assert.deepEqual(points, []);
  }
});
