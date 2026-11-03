import type { Workflow, WorkflowStep, WorkflowStepType } from "../../../services/api";

// What each kind of step is called on the screen, and which of its words the owner can change in place.
export const STEP_NAMES: Record<WorkflowStepType, string> = {
  say: "Says",
  ask: "Asks",
  collect: "Asks and keeps the answer",
  meeting: "Asks when to meet",
  branch: "Checks",
  agent: "Riwo talks",
  label: "Labels the contact",
  notify: "Tells you",
  assign: "Gives the chat to",
  lead: "Adds to the pipeline",
  task: "Makes a follow-up",
  handoff: "Hands over to a person",
  end: "Finishes",
};

export interface EditableField {
  field: string;
  label: string;
  long?: boolean;
}
// the words of a step the owner may edit, by step type
export const EDITABLE: Partial<Record<WorkflowStepType, EditableField[]>> = {
  say: [{ field: "text", label: "What Riwo says", long: true }],
  ask: [{ field: "question", label: "The question", long: true }],
  collect: [{ field: "question", label: "The question", long: true }],
  meeting: [{ field: "question", label: "The question" }, { field: "confirm", label: "The thank-you", long: true }],
  notify: [{ field: "text", label: "What you are told", long: true }],
  label: [{ field: "add", label: "The label" }],
  task: [{ field: "title", label: "The follow-up" }],
  agent: [{ field: "goal", label: "What Riwo should achieve" }, { field: "playbook", label: "How Riwo should talk", long: true }],
};

export const valueOf = (step: WorkflowStep, field: string): string => String(step[field] ?? "");

/** The labels the flow looks at, so "try it" can pretend a contact is already known */
export const labelsLookedAt = (wf: Workflow | undefined): string[] => [...new Set(Object.values(wf?.nodes || {}).filter((n) => n.type === "branch" && n.on === "label").map((n) => String(n.label)))];

/** A flow with one words-field of one step changed */
export const withStepField = (wf: Workflow, id: string, field: string, value: string): Workflow => ({ ...wf, nodes: { ...wf.nodes, [id]: { ...wf.nodes[id], [field]: value } } });

/** Digits of what the owner typed as a phone number: "+91 99716 94047" is 919971694047 */
export const digitsOf = (v: string) => v.replace(/\D/g, "");
export const phonesFrom = (text: string): string[] => [...new Set(text.split(/[\n,;]+/).map(digitsOf).filter(Boolean))];
export const validPhone = (digits: string) => digits.length >= 8 && digits.length <= 15;

const FIELD_WORDS: Record<string, string> = { name: "their name", first_name: "their first name", company: "your company", last_message: "what they wrote", answer: "their answer", meeting: "the time they chose", executive: "your teammate" };
/** The words of a step as they are shown in the list: "{{first_name}}" reads "‹their first name›" */
export const prettyFields = (text: string): string => text.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, k: string) => `‹${FIELD_WORDS[k.toLowerCase()] || k}›`);
