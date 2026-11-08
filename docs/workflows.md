# Workflows: describe it in your own words

A workflow is an automation that **asks, understands the answer and goes the way of it**. The owner writes what should happen, in
any language; Riwo builds the steps, shows them back in plain words with the safety it added, lets the owner try it as a customer,
and saves it paused or in test mode. Nothing here is free-form AI: a workflow is data made of a few whitelisted steps, run by a small
engine that decides everything except two things the model may do (read an answer, and talk in an agent step).

## What the owner does

1. **Describe** it (or start from a ready-made one: work or family and friends, after-hours enquiries, welcome people back).
2. Riwo asks at most three questions, only if it cannot decide, with answers to tap.
3. **Check**: what Riwo understood, when it starts, the steps in the order a customer meets them (words can be changed in place),
   the safety that was added, and anything still needed (words for Riwo to talk from, home countries, opening hours).
4. **Change something** in words ("also ask which city"): Riwo answers with a short list of edits (add a step, change a step, take one
   out, point one at another), the app applies them to the flow as it is, so whatever was not mentioned stays exactly as it was, and
   the lines that changed are shown; nothing is replaced until the owner says so. When Riwo cannot read the request, or is not
   available, an **Add a question** form opens: the question, where to ask it (after the last question, at the very start, or before
   any step) and whether the answer goes in the note the owners get. It makes the same kind of change without Riwo.
5. **Try it as a customer**: the same engine, with nothing sent to WhatsApp and nothing saved. It shows how Riwo read each answer and
   what would happen (labels, notes to the owner, follow-ups, the hand-over).
6. **Save** paused, or **turn on in test mode** (it runs only for the numbers the owner lists). "For everyone" is a separate tap on
   the rule's card.

## The steps

| Step | What it does |
|---|---|
| say | sends fixed words |
| ask | asks with 2 to 6 answers, understands the reply, goes the way of the answer |
| collect | asks one open question and keeps the answer |
| meeting | asks when suits, makes a follow-up, tells the owners, thanks the customer |
| branch | looks at a label, an earlier answer, or the opening hours |
| agent | Riwo talks from the knowledge base toward a goal (prices go to a person), then a person takes over |
| label, notify, assign, lead, task | puts a label, tells people (app and e-mail), gives the chat to a teammate, opens a lead, makes a follow-up |
| handoff, end | the company's formal message and a person takes over; finish |

Starts when: someone writes for the first time, **returns after a quiet spell** (a number of days, and whether a first message counts),
writes from another country, sends a keyword, or writes after hours.

## How an answer is understood

In order, stopping at the first that is sure: the number ("2"), the answer's own words or the words the owner listed for it (whole
words; two matches means not sure), then Riwo, which may only pick one of the listed answers or say it cannot tell. Without Riwo the
number and the words still work. An answer that is not understood is asked once more, then a person is told. Customer words can never
change the flow: they reach only the reader (a listed answer comes out) and the agent (which has its own checks).

## The safety every workflow carries

- Never answers groups, or the company's own numbers (a note to yourself, or two of its numbers).
- Stops the moment a teammate (or the phone's owner) has answered, also if that happens while Riwo is still writing.
- The first message says a machine is writing; "human" brings a person. A runaway loop is cut off at 20 automatic messages an hour.
- A question nobody answers within a day is let go. A chat that has finished does not restart for seven days.
- Every path ends; every answer goes somewhere; a flow that goes in a circle is refused.
- A flow that ends without anyone having been told sends the owners a short note (unless it was told to stay quiet).
- Riwo never invents a price, a link or a figure; every message a workflow sends is in the audit record (the words, the rule, and for fixed steps which step wrote them).
- A turn that fails part-way carries on from the next step when tried again; a follow-up is never made twice.

## What it does not do (yet)

- **Meetings** are requests: Riwo collects a preferred time, the team gets a follow-up and a note, and the customer is told it is
  requested. There is no calendar connection (no free/busy).
- Steps cannot branch on language, and a step can only add a label (not remove one).
- Questions use numbered answers and free text; WhatsApp buttons are not used.
- Trying it uses the company's Riwo allowance like any other use.

## Where it lives

Backend: `src/services/workflow/` (`schema.js` checks and completes, `core.js` decides, `executor.js` does, `classify.js` reads answers,
`compile.js` and `recipes.js` build from words, `simulate.js` tries), `personGuard.js` (the safety rules), `autoChat.js` (chat state),
migration `049_workflow.js`. Routes: `/api/automations/workflow/{draft,revise,check,simulate,recipes}`, `/:id/insights`,
`/:id/versions`. App: `src/components/user/workflow/`.

`/workflow/revise` takes `{rule, instruction}` (words) or `{rule, addQuestion: {question, before?, tell?}}` (no model). The edits are
applied by `workflow/edits.js` (`applyEdits`, `questionEdits`); the reader in `aiService.js` accepts the shapes a model gives back (the
edits, the whole `{name, trigger, workflow}`, a bare `{start, nodes}`, JSON in a code fence or with a trailing comma). A change the
model got wrong is sent back once with the exact problem and the list of steps that exist.
