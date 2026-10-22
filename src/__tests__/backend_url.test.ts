import { describe, it, expect } from "vitest";
import { backendBaseFor, socketUrlFor } from "../services/api";

describe("which address the app uses to reach the backend", () => {
  it("uses its own address on every hosted domain, so custom domains work like vercel.app", () => {
    for (const host of [
      "scriwo.com",
      "www.scriwo.com",
      "wppflow-beige.vercel.app",
      "wppflow-abc-gitkcoin.vercel.app",
    ])
      expect(backendBaseFor(host)).toBe("");
  });

  it("only a developer machine falls back to localhost", () => {
    for (const host of ["localhost", "127.0.0.1", ""])
      expect(backendBaseFor(host)).toBe("http://localhost:8080");
  });

  it("an explicitly configured backend always wins", () => {
    expect(backendBaseFor("www.scriwo.com", "https://api.example.com")).toBe(
      "https://api.example.com",
    );
  });

  it("live updates connect to the real backend, never to the visitor's own computer", () => {
    expect(socketUrlFor("www.scriwo.com")).toBe(
      "https://srv1628639.hstgr.cloud",
    );
    expect(socketUrlFor("scriwo.com")).toBe("https://srv1628639.hstgr.cloud");
    expect(
      socketUrlFor("www.scriwo.com", { socket: "https://sock.example.com" }),
    ).toBe("https://sock.example.com");
    expect(socketUrlFor("localhost")).toBe("http://localhost:8080");
  });
});
