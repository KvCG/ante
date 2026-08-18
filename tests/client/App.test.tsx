import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../../src/client/App";

describe("App", () => {
  it("renders the app header", () => {
    render(<App />);
    expect(screen.getByText("Ante")).toBeInTheDocument();
  });

  it("renders getting started section", () => {
    render(<App />);
    expect(screen.getByText("Getting Started")).toBeInTheDocument();
  });
});
