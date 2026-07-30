export const ACTION_EVENTS = new Set([
  "paper_pdf",
  "interactive_article",
  "cv",
  "github_profile",
  "copy_citation",
]);

export function normalizePagePath(pathname) {
  if (pathname === "/") return "/";
  if (pathname === "/cloud-drive/" || pathname === "/cloud-drive/index.html") {
    return "/cloud-drive/";
  }
  return null;
}

export function createActionPayload(event, pathname) {
  const pagePath = normalizePagePath(pathname);
  if (!ACTION_EVENTS.has(event) || !pagePath) return null;
  return { event, pagePath };
}

export function transmitAction({
  endpoint,
  event,
  pagePath,
  navigatorImpl = globalThis.navigator,
  fetchImpl = globalThis.fetch,
}) {
  const payload = createActionPayload(event, pagePath);
  if (!endpoint || !payload) return false;
  const body = JSON.stringify(payload);

  if (typeof fetchImpl === "function") {
    void fetchImpl(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
      mode: "cors",
      credentials: "omit",
    }).catch(() => {});
    return true;
  }

  if (typeof navigatorImpl?.sendBeacon !== "function") return false;
  const blob = new Blob([body], { type: "application/json" });
  return navigatorImpl.sendBeacon(endpoint, blob);
}

export function initActionTracking({
  documentImpl = globalThis.document,
  locationImpl = globalThis.location,
  navigatorImpl = globalThis.navigator,
  fetchImpl = globalThis.fetch,
} = {}) {
  const endpoint = documentImpl
    ?.querySelector('meta[name="site-analytics-endpoint"]')
    ?.getAttribute("content");
  const pagePath = normalizePagePath(locationImpl?.pathname ?? "");
  if (!endpoint || !pagePath) return;

  documentImpl.addEventListener("click", (event) => {
    const target = event.target?.closest?.("[data-analytics-event]");
    if (!target) return;
    transmitAction({
      endpoint,
      event: target.getAttribute("data-analytics-event"),
      pagePath,
      navigatorImpl,
      fetchImpl,
    });
  });
}

if (typeof document !== "undefined") initActionTracking();
