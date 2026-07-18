import { handleKmaRequest } from "./kma";

export interface ApiEnv {
  KMA_API_KEY?: string;
  ALLOWED_ORIGINS?: string;
}

function corsHeaders(request: Request, env: ApiEnv) {
  const origin = request.headers.get("Origin");
  const allowedOrigins = new Set((env.ALLOWED_ORIGINS ?? "").split(",").map((value) => value.trim()).filter(Boolean));
  if (!origin || !allowedOrigins.has(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "3600",
    Vary: "Origin",
  };
}

const api = {
  async fetch(request: Request, env: ApiEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/api/kma") return new Response(null, { status: 404 });

    const headers = corsHeaders(request, env);
    if (request.method === "OPTIONS") {
      return headers ? new Response(null, { status: 204, headers }) : new Response(null, { status: 403 });
    }
    if (request.method !== "GET") return new Response(null, { status: 405 });

    const response = await handleKmaRequest(request, env.KMA_API_KEY);
    if (!headers) return response;
    const responseHeaders = new Headers(response.headers);
    for (const [name, value] of Object.entries(headers)) responseHeaders.set(name, value);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: responseHeaders });
  },
};

export default api;
