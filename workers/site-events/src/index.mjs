export const EVENT_NAMES = new Set([
  "paper_pdf",
  "interactive_article",
  "cv",
  "github_profile",
  "copy_citation",
]);

export const PAGE_PATHS = new Set(["/", "/cloud-drive/"]);
const MAX_BODY_BYTES = 512;

const corsHeaders = (origin) => ({
  "access-control-allow-origin": origin,
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "Content-Type",
  "access-control-max-age": "86400",
  vary: "Origin",
});

const response = (status, message, origin = "") =>
  new Response(message, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
      "x-content-type-options": "nosniff",
      ...(origin ? corsHeaders(origin) : {}),
    },
  });

const readBoundedBody = async (request, maximumBytes) => {
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let byteLength = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    byteLength += value.byteLength;
    if (byteLength > maximumBytes) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
};

export async function handleRequest(request, env) {
  const origin = request.headers.get("origin") ?? "";
  const allowedOrigins = new Set(
    String(env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );

  if (!allowedOrigins.has(origin)) return response(403, "Forbidden");
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (new URL(request.url).pathname !== "/event") {
    return response(404, "Not found", origin);
  }
  if (request.method !== "POST") {
    return response(405, "Method not allowed", origin);
  }
  const mediaType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (mediaType !== "application/json") {
    return response(415, "JSON required", origin);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return response(413, "Payload too large", origin);
  }

  const text = await readBoundedBody(request, MAX_BODY_BYTES);
  if (text === null) {
    return response(413, "Payload too large", origin);
  }

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return response(400, "Invalid JSON", origin);
  }

  const keys = Object.keys(body ?? {}).sort();
  if (
    keys.join(",") !== "event,pagePath" ||
    !EVENT_NAMES.has(body.event) ||
    !PAGE_PATHS.has(body.pagePath)
  ) {
    return response(400, "Invalid event", origin);
  }

  env.EVENTS.writeDataPoint({
    blobs: [body.event, body.pagePath],
    doubles: [1],
    indexes: [body.event],
  });
  return response(202, "Accepted", origin);
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};
