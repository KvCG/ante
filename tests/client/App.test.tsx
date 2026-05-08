import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../../src/client/App";

describe("App", () => {
  it("renders the app header", () => {
    render(<App />);
    expect(screen.getByText("Baseline Project")).toBeInTheDocument();
  });

  it("renders the health check button", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /check api status/i })).toBeInTheDocument();
  });

  it("renders getting started section", () => {
    render(<App />);
    expect(screen.getByText("Getting Started")).toBeInTheDocument();
  });
});
