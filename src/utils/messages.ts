import type { ChatMessage } from "../types";
export function reconcileMessages(
  existing: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  type Group = { message: ChatMessage; keys: Set<string> };
  const identities = new Map<string, Group>(),
    groups = new Set<Group>();
  for (const message of [...existing, ...incoming]) {
    const keys = [
      "id:" + message.id,
      ...(message.idempotencyKey ? ["idem:" + message.idempotencyKey] : []),
      ...(message.providerMessageId
        ? ["provider:" + message.providerMessageId]
        : []),
    ];
    const matches = new Set(
      keys
        .map((key) => identities.get(key))
        .filter((g): g is Group => Boolean(g)),
    );
    let merged = message;
    const allKeys = new Set(keys);
    for (const group of matches) {
      const old = group.message,
        ack = Math.max(old.ack || 0, merged.ack || 0);
      merged = {
        ...old,
        ...merged,
        ack,
        status: (old.ack || 0) > (merged.ack || 0) ? old.status : merged.status,
      };
      for (const key of group.keys) allKeys.add(key);
      groups.delete(group);
    }
    const group = { message: merged, keys: allKeys };
    groups.add(group);
    for (const key of allKeys) identities.set(key, group);
  }
  return [...groups]
    .map((g) => g.message)
    .sort(
      (a, b) =>
        (a.timestampEpoch || 0) - (b.timestampEpoch || 0) ||
        a.id.localeCompare(b.id),
    );
}
