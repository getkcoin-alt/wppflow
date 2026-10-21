import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { DeveloperGuide } from "../components/developer/DeveloperGuide";

const view = (canManage: boolean) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <DeveloperGuide
        canManage={canManage}
        activeDevTab="docs"
        onSelectDevTab={() => {}}
      />
    </QueryClientProvider>,
  );

describe("developer guide access", () => {
  it("gives employees the API tester and SDK samples only", () => {
    view(false);
    expect(screen.getByText("API tester")).toBeTruthy();
    expect(screen.getByText("sdks")).toBeTruthy();
    expect(screen.queryByText("keys")).toBeNull();
    expect(screen.queryByText("webhooks")).toBeNull();
  });

  it("gives company admins keys and webhooks as well", () => {
    view(true);
    expect(screen.getByText("keys")).toBeTruthy();
    expect(screen.getByText("webhooks")).toBeTruthy();
  });
});
