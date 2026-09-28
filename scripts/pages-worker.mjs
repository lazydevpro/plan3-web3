import app from "./server/index.js";

export default {
  fetch(request, env, context) {
    const pathname = new URL(request.url).pathname;
    const isStaticAsset = pathname.startsWith("/_next/static/") ||
      (/\.[a-zA-Z0-9]{2,8}$/.test(pathname) && !pathname.startsWith("/api/"));
    if (isStaticAsset && (request.method === "GET" || request.method === "HEAD")) {
      return env.ASSETS.fetch(request);
    }
    return app.fetch(request, env, context);
  },
};
