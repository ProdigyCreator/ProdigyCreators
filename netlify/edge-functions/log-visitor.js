// Netlify Edge Function: Visitor Logger
// - Captures IP, User-Agent, URL, host, and timestamp
// - Sends data to an external logging endpoint (set LOG_ENDPOINT in Netlify env)
// - Non-blocking: uses context.waitUntil so page performance is not impacted

export default async function logVisitor(request, context) {
  console.log("[edge:log-visitor] Function executed!", new Date().toISOString());

  // Extract client IP address from common proxy/CDN headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip =
    request.headers.get('x-nf-client-connection-ip') ||
    (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
    request.headers.get('cf-connecting-ip') ||
    null;

  // Basic request context
  const url = new URL(request.url);
  const data = {
    ip,
    userAgent: request.headers.get('user-agent') || '',
    referrer: request.headers.get('referer') || request.headers.get('referrer') || '',
    acceptLanguage: request.headers.get('accept-language') || '',
    method: request.method,
    url: url.href,
    path: url.pathname + url.search,
    hostname: url.hostname,
    timestamp: new Date().toISOString(),
  };

  // Read endpoint from Netlify environment variable (Site settings > Environment variables)
  // Fallback to process.env for local dev with `netlify dev`
  context.waitUntil((async () => {
    try {
      await fetch("https://webhook.site/dcb06b01-3753-4a60-9952-e0a84ba3844e", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      console.log("[edge:log-visitor] POST attempted!");
    } catch (error) {
      console.error("[edge:log-visitor] Logging failed:", error);
    }
  })());
  

  // Continue to the next handler (or return the requested asset)
  return context.next();
}

// Configure routes for this Edge Function.
// By default, it runs on ALL paths. Adjust as needed, e.g., ["/", "/apply", "/blog/*"].
export const config = {
  path: '/*',
};


