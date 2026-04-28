import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the heading", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { level: 1, name: /moiz/i }),
    ).toBeInTheDocument();
  });

  it("renders the hello message", () => {
    render(<App />);
    expect(screen.getByText(/hello, world/i)).toBeInTheDocument();
  });
});
