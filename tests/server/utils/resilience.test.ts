import { describe, it, expect, vi } from "vitest";
import { delay, withRetry, withTimeout } from "../../../src/server/utils/resilience";

describe("delay", () => {
  it("should delay for the specified time", async () => {
    const start = Date.now();
    await delay(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some tolerance
  });
});

describe("withRetry", () => {
  it("should return result on success", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await withRetry(fn, { maxRetries: 3 });
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure", async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error("fail")).mockResolvedValue("success");

    const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should throw after max retries", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always fails"));

    await expect(withRetry(fn, { maxRetries: 2, baseDelayMs: 10 })).rejects.toThrow("always fails");
    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });
});

describe("withTimeout", () => {
  it("should return result if within timeout", async () => {
    const fn = async () => {
      await delay(10);
      return "fast";
    };

    const result = await withTimeout(fn, 100);
    expect(result).toBe("fast");
  });

  it("should throw if timeout exceeded", async () => {
    const fn = async () => {
      await delay(200);
      return "slow";
    };

    await expect(withTimeout(fn, 50, "Too slow!")).rejects.toThrow("Too slow!");
  });
});
