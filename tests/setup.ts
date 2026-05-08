/**
 * Global test setup
 *
 * This file runs before all tests. Use it to:
 * - Configure testing-library matchers
 * - Set up global mocks
 * - Configure MSW handlers
 */
import "@testing-library/jest-dom";

// Suppress console output during tests (optional)
// Uncomment to reduce test output noise
// beforeAll(() => {
//     vi.spyOn(console, 'log').mockImplementation(() => {})
//     vi.spyOn(console, 'info').mockImplementation(() => {})
//     vi.spyOn(console, 'warn').mockImplementation(() => {})
// })

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  vi.restoreAllMocks();
});
