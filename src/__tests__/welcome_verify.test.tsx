import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";

const api = vi.hoisted(() => ({ verifyEmail: vi.fn(), resendVerification: vi.fn() }));
vi.mock("../services/api", () => api);
import { WelcomeGuide } from "../components/onboarding/WelcomeGuide";
import { VerifyEmailBanner, VerifyEmailPage } from "../components/onboarding/VerifyEmail";
import { APP_GUIDE, HOMES_GUIDE } from "../components/onboarding/guideSteps";

describe("welcome guide", () => {
  it("walks through the steps and ends with a button that closes it", () => {
    const done = vi.fn();
    render(<WelcomeGuide name="Asha Rao" onDone={done} />);
    expect(screen.getByText(/Hi Asha\./)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Hi, I'm Riwo" })).toBeTruthy();
    for (let n = 1; n < APP_GUIDE.length; n++) {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      expect(screen.getByRole("heading", { name: APP_GUIDE[n].title })).toBeTruthy();
    }
    expect(done).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Start using Scriwo/ }));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("can be skipped at any step, and goes back", () => {
    const done = vi.fn();
    render(<WelcomeGuide onDone={done} />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Hi, I'm Riwo" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Skip the guide" }));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("speaks property for Scriwo Homes, and keeps manager-only steps from teammates", () => {
    render(<WelcomeGuide variant="homes" manager={false} onDone={() => {}} />);
    const titles = HOMES_GUIDE.filter((s) => !s.managerOnly).map((s) => s.title);
    expect(screen.getByText(/property agencies/i)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Go to step/ })).toHaveLength(titles.length);
    expect(HOMES_GUIDE.some((s) => s.managerOnly)).toBe(true);
  });
});

describe("email confirmation", () => {
  beforeEach(() => Object.values(api).forEach((f) => f.mockReset()));

  it("confirms the address from the emailed link", async () => {
    api.verifyEmail.mockResolvedValue({ status: "success", email: "a@b.co" });
    const go = vi.fn();
    render(<VerifyEmailPage token="tok" onContinue={go} />);
    expect(await screen.findByText("Email confirmed")).toBeTruthy();
    expect(api.verifyEmail).toHaveBeenCalledWith("tok");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(go).toHaveBeenCalled();
  });

  it("says plainly when the link no longer works", async () => {
    api.verifyEmail.mockResolvedValue({ status: "error", message: "x" });
    render(<VerifyEmailPage token="tok" onContinue={() => {}} />);
    expect(await screen.findByText("This link no longer works")).toBeTruthy();
  });

  it("the banner asks for a new link, and can be hidden", async () => {
    api.resendVerification.mockResolvedValue({ status: "success", sent: true });
    render(<VerifyEmailBanner email="a@b.co" />);
    fireEvent.click(screen.getByRole("button", { name: "Send it again" }));
    await waitFor(() => expect(screen.getByText(/new link is on its way to a@b.co/)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Hide this reminder" }));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("tells the person when they have asked too often", async () => {
    api.resendVerification.mockResolvedValue({ status: "error", message: "limit" });
    render(<VerifyEmailBanner email="a@b.co" />);
    fireEvent.click(screen.getByRole("button", { name: "Send it again" }));
    await waitFor(() => expect(screen.getByText(/asked for a few links already/)).toBeTruthy());
  });
});
