import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { NumberSwitch } from "../components/user/NumberSwitch";
import { numberName, phoneText, sessionOfChat } from "../utils/numbers";
import type { WhatsAppSession } from "../types";

const line = (over: Partial<WhatsAppSession>): WhatsAppSession =>
  ({
    id: "s",
    sessionKey: "staff-1",
    displayName: "staff-1",
    phone: "919810011122@c.us",
    status: "CONNECTED",
    ownerUserId: 1,
    ownerName: "Olivia Owner",
    ...over,
  }) as WhatsAppSession;
const olivia = line({});
const sam = line({ sessionKey: "staff-2", ownerUserId: 2, ownerName: "Sam Staff", phone: "+91 98765 43210", status: "DISCONNECTED" });

describe("naming a WhatsApp number", () => {
  it("reads phone numbers from whatever form the server has", () => {
    expect(phoneText("919810011122@c.us")).toBe("+919810011122");
    expect(phoneText("+91 98765 43210")).toBe("+919876543210");
    expect(phoneText(null)).toBe("");
  });
  it("uses the owner's first name, and marks your own", () => {
    expect(numberName(sam, 1)).toBe("Sam");
    expect(numberName(olivia, 1)).toBe("Olivia (you)");
    expect(numberName(olivia, "1")).toBe("Olivia (you)");
  });
  it("falls back to the phone, then the name", () => {
    expect(numberName(line({ ownerName: null }), 9)).toBe("+919810011122");
    expect(numberName(line({ ownerName: null, phone: "" }), 9)).toBe("staff-1");
  });
  it("finds the number a chat came in on", () => {
    expect(sessionOfChat([olivia, sam], { channel: "staff-2" })).toBe(sam);
    expect(sessionOfChat([olivia, sam], { channel: "gone" })).toBeUndefined();
  });
});

describe("the number switcher", () => {
  it("is hidden when there is only one number", () => {
    const { container } = render(<NumberSwitch sessions={[olivia]} value="" onChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("lists every number and picks one, or all of them", () => {
    const onChange = vi.fn();
    render(<NumberSwitch sessions={[olivia, sam]} value="" onChange={onChange} currentUserId={1} />);
    expect(screen.getByRole("button", { name: "All numbers" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /Sam/ }));
    expect(onChange).toHaveBeenLastCalledWith("staff-2");
    fireEvent.click(screen.getByRole("button", { name: /Olivia \(you\)/ }));
    expect(onChange).toHaveBeenLastCalledWith("staff-1");
  });

  it("marks the chosen number and says whether each is connected", () => {
    const onChange = vi.fn();
    render(<NumberSwitch sessions={[olivia, sam]} value="staff-2" onChange={onChange} currentUserId={1} />);
    expect(screen.getByRole("button", { name: /Sam, not connected/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /Olivia \(you\), connected/ }).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "All numbers" }));
    expect(onChange).toHaveBeenLastCalledWith("");
  });
});
