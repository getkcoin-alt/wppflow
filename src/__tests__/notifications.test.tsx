import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { NotificationBell } from "../components/layout/NotificationBell";
import { timeAgo } from "../utils/timeAgo";
import {
  markNotificationsRead,
  upsertNotification,
} from "../services/realtimeCache";
import type { AppNotification } from "../types";

const n = (
  id: string,
  over: Partial<AppNotification> = {},
): AppNotification => ({
  id,
  type: "note",
  title: `Olivia left a team note on Alice (${id})`,
  body: "Customer wants a call back",
  conversationId: "conv-1",
  actorName: "Olivia",
  createdAt: new Date().toISOString(),
  read: false,
  ...over,
});
const T = "tenant_1";
const seed = (
  qc: QueryClient,
  items: AppNotification[],
  unread = items.filter((i) => !i.read).length,
) =>
  qc.setQueryData(["notifications", T], {
    notifications: items,
    unreadCount: unread,
    nextCursor: null,
  });
const get = (qc: QueryClient) => qc.getQueryData(["notifications", T]) as any;

describe("notification bell", () => {
  const props = {
    desktop: "granted" as const,
    onEnableDesktop: () => {},
    onMarkAllRead: () => {},
  };

  it("shows the unread count and lists notifications; clicking one opens it", () => {
    const onOpen = vi.fn();
    render(
      <NotificationBell
        {...props}
        items={[n("a"), n("b", { read: true })]}
        unreadCount={1}
        onOpen={onOpen}
      />,
    );
    expect(screen.getByTestId("unread-badge").textContent).toBe("1");
    fireEvent.click(screen.getByLabelText(/Notifications, 1 unread/));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByText(/\(a\)/));
    expect(onOpen).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a", conversationId: "conv-1" }),
    );
  });

  it("has no badge when everything is read, and a friendly empty state", () => {
    render(
      <NotificationBell
        {...props}
        items={[]}
        unreadCount={0}
        onOpen={() => {}}
      />,
    );
    expect(screen.queryByTestId("unread-badge")).toBeNull();
    fireEvent.click(screen.getByLabelText("Notifications"));
    expect(screen.getByText(/all caught up/i)).toBeTruthy();
  });

  it("offers desktop alerts only until the choice has been made", () => {
    const enable = vi.fn();
    const { rerender } = render(
      <NotificationBell
        {...props}
        desktop="default"
        onEnableDesktop={enable}
        items={[]}
        unreadCount={0}
        onOpen={() => {}}
      />,
    );
    fireEvent.click(screen.getByLabelText("Notifications"));
    fireEvent.click(screen.getByText(/desktop alerts/));
    expect(enable).toHaveBeenCalled();
    rerender(
      <NotificationBell
        {...props}
        desktop="granted"
        items={[]}
        unreadCount={0}
        onOpen={() => {}}
      />,
    );
    expect(screen.queryByText(/desktop alerts/)).toBeNull();
  });

  it("marks all read from the panel", () => {
    const all = vi.fn();
    render(
      <NotificationBell
        {...props}
        onMarkAllRead={all}
        items={[n("a")]}
        unreadCount={1}
        onOpen={() => {}}
      />,
    );
    fireEvent.click(screen.getByLabelText(/Notifications/));
    fireEvent.click(screen.getByText("Mark all read"));
    expect(all).toHaveBeenCalled();
  });
});

describe("notification cache", () => {
  it("adds a pushed notification once and bumps the badge", () => {
    const qc = new QueryClient();
    seed(qc, [n("a")]);
    upsertNotification(qc, T, n("b"));
    upsertNotification(qc, T, n("b")); // delivered twice
    expect(get(qc).notifications.map((x: any) => x.id)).toEqual(["b", "a"]);
    expect(get(qc).unreadCount).toBe(2);
  });

  it("clears one or all, including older notifications that were never loaded", () => {
    const qc = new QueryClient();
    seed(qc, [n("a"), n("b")], 5); // 3 more unread exist on the server
    markNotificationsRead(qc, T, "a");
    expect(get(qc).unreadCount).toBe(4);
    markNotificationsRead(qc, T, "a"); // already read: no double count
    expect(get(qc).unreadCount).toBe(4);
    markNotificationsRead(qc, T, "all");
    expect(get(qc).unreadCount).toBe(0);
    expect(get(qc).notifications.every((x: any) => x.read)).toBe(true);
  });

  it("refetches instead of guessing when nothing is cached yet", () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    upsertNotification(qc, T, n("a"));
    expect(spy).toHaveBeenCalled();
  });
});

describe("time labels", () => {
  it("is short and human", () => {
    const now = Date.parse("2026-10-21T12:00:00Z");
    expect(timeAgo("2026-10-21T11:59:40Z", now)).toBe("just now");
    expect(timeAgo("2026-10-21T11:45:00Z", now)).toBe("15m ago");
    expect(timeAgo("2026-10-21T09:00:00Z", now)).toBe("3h ago");
    expect(timeAgo("2026-10-18T12:00:00Z", now)).toBe("3d ago");
  });
});
