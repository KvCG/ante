/**
 * Test fixtures
 *
 * Reusable test data for consistent testing across the application.
 */

export const mockUser = {
  id: "1",
  name: "Test User",
  email: "test@example.com",
  createdAt: "2024-01-01T00:00:00.000Z",
};

export const mockItems = [
  { id: 1, name: "Item 1", createdAt: "2024-01-01T00:00:00.000Z" },
  { id: 2, name: "Item 2", createdAt: "2024-01-02T00:00:00.000Z" },
  { id: 3, name: "Item 3", createdAt: "2024-01-03T00:00:00.000Z" },
];

export const mockHealthResponse = {
  status: "healthy",
  uptime: 12345,
  timestamp: "2024-01-01T00:00:00.000Z",
  version: "1.0.0",
};

export const mockErrorResponse = {
  error: "Something went wrong",
  code: "INTERNAL_ERROR",
};

export const mockValidationErrorResponse = {
  error: "Invalid request body",
  code: "VALIDATION_ERROR",
  context: {
    issues: ["name: Required"],
  },
};
