import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { HowItWorks, MoreOptions } from "../components/ui/MoreOptions";
import { Sheet } from "../components/ui/Sheet";
import { RuleEditor } from "../components/user/RuleEditor";
import { blankRule } from "../utils/automationText";

afterEach(cleanup);
const detailsOf = (text: string) => screen.getByText(text).closest("details") as HTMLDetailsElement;

describe("the folds in long forms", () => {
  it("More options is closed until opened, says what is inside, and keeps its fields in the page", () => {
    render(
      <MoreOptions title="Follow-up and fallback" hint="Pipeline step and reminder">
        <input aria-label="Pipeline step" />
      </MoreOptions>,
    );
    expect(detailsOf("Follow-up and fallback").open).toBe(false);
    expect(screen.getByText("Pipeline step and reminder")).toBeDefined();
    expect(screen.getByLabelText("Pipeline step")).toBeDefined();
    fireEvent.click(screen.getByText("Follow-up and fallback"));
    detailsOf("Follow-up and fallback").open = true;
    expect(detailsOf("Follow-up and fallback").open).toBe(true);
  });

  it("More options can start open", () => {
    render(
      <MoreOptions title="More options" defaultOpen>
        <p>inside</p>
      </MoreOptions>,
    );
    expect(detailsOf("More options").open).toBe(true);
  });

  it("How this works is open while making something new and folded when changing it", () => {
    const { unmount } = render(
      <HowItWorks open>
        <p>1. Someone writes</p>
      </HowItWorks>,
    );
    expect(detailsOf("How this works").open).toBe(true);
    unmount();
    render(
      <HowItWorks open={false}>
        <p>1. Someone writes</p>
      </HowItWorks>,
    );
    expect(detailsOf("How this works").open).toBe(false);
  });

  it("a long form's dialog can be medium width, between the default and the wide one", () => {
    const { unmount } = render(<Sheet open onClose={vi.fn()} title="Plain">x</Sheet>);
    expect(screen.getByRole("dialog").className).toContain("sm:max-w-lg");
    unmount();
    render(<Sheet open medium onClose={vi.fn()} title="Roomy">x</Sheet>);
    const cls = screen.getByRole("dialog").className;
    expect(cls).toContain("sm:max-w-2xl");
    expect(cls).not.toContain("sm:max-w-lg");
  });

  it("the rule editor folds away 'wait before repeating' unless the rule already has one", () => {
    const props = { open: true, editing: false, teammates: [], onClose: vi.fn(), onSave: vi.fn() };
    const { unmount } = render(<RuleEditor {...props} initial={blankRule()} />);
    expect(detailsOf("More options").open).toBe(false);
    expect(screen.getByLabelText("Wait before repeating")).toBeDefined();
    unmount();
    render(<RuleEditor {...props} initial={{ ...blankRule(), config: { cooldownHours: 12 } }} />);
    expect(detailsOf("More options").open).toBe(true);
    expect((screen.getByLabelText("Wait before repeating") as HTMLInputElement).value).toBe("12");
  });
});
