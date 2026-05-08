/**
 * MSW (Mock Service Worker) handlers
 *
 * Define mock API handlers here for testing client components
 * that make HTTP requests.
 */
import { http, HttpResponse } from "msw";

export const handlers = [
  // Example handler - customize for your API
  http.get("/api/status", () => {
    return HttpResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  }),

  http.get("/api/example/items", ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const items = Array.from({ length: limit }, (_, i) => ({
      id: offset + i + 1,
      name: `Mock Item ${offset + i + 1}`,
      createdAt: new Date().toISOString(),
    }));

    return HttpResponse.json(items);
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = [
  http.get("/api/error", () => {
    return HttpResponse.json({ error: "Something went wrong", code: "INTERNAL_ERROR" }, { status: 500 });
  }),

  http.get("/api/not-found", () => {
    return HttpResponse.json({ error: "Resource not found", code: "NOT_FOUND" }, { status: 404 });
  }),
];
