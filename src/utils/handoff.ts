export type HandoffReason = "person" | "pricing" | "qualified";

// Why a chat is waiting for a person, in words for the team: on the Today cards and in the inbox list.
export function handoffLabel(reason?: HandoffReason | null): { label: string; hint: string } {
  if (reason === "pricing")
    return { label: "Wants pricing", hint: "The customer asked for pricing or a proposal. Riwo told them an executive will reply, and has stopped answering." };
  if (reason === "qualified")
    return { label: "Ready for an executive", hint: "Riwo has asked all its questions and kept the answers. Riwo has stopped answering." };
  return { label: "Asked for a person", hint: "The customer asked to talk to a person. Riwo has stopped answering them." };
}
