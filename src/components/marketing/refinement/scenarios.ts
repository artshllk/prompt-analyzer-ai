/**
 * Scripted refinement scenarios for the hero visual.
 *
 * The whole animation is data-driven: each scenario declares the rough
 * prompt as segments, which spans get rewritten and to what, the smart
 * question Deepclario asks, and the metric deltas. Deterministic and
 * art-directable; adding a scenario is editing one object.
 */

export type Segment =
  | { type: "keep"; text: string }
  | { type: "swap"; rough: string; refined: string };

export type Scenario = {
  id: string;
  segments: Segment[];
  question: string;
  options: [string, string];
  /** Index into `options` that the ghost cursor picks. */
  answerIndex: 0 | 1;
  tokens: { from: number; to: number };
};

export const SCENARIOS: Scenario[] = [
  {
    id: "email",
    segments: [
      { type: "swap", rough: "write me an email", refined: "Write a concise, matter-of-fact email" },
      { type: "keep", text: " to my " },
      { type: "swap", rough: "team", refined: "engineering team" },
      { type: "keep", text: " about " },
      {
        type: "swap",
        rough: "the launch delay",
        refined: "the two-week launch delay, with the revised timeline up front",
      },
    ],
    question: "Should the tone be apologetic or matter-of-fact?",
    options: ["Apologetic", "Matter-of-fact"],
    answerIndex: 1,
    tokens: { from: 412, to: 268 },
  },
  {
    id: "code-review",
    segments: [
      { type: "swap", rough: "look at my code", refined: "Review this Python function" },
      { type: "keep", text: " and " },
      {
        type: "swap",
        rough: "tell me if its good",
        refined: "flag correctness bugs and unhandled edge cases, most severe first",
      },
    ],
    question: "Review for correctness, or style and readability?",
    options: ["Correctness", "Style"],
    answerIndex: 0,
    tokens: { from: 356, to: 214 },
  },
  {
    id: "landing-copy",
    segments: [
      { type: "swap", rough: "make some copy", refined: "Write three headline options" },
      { type: "keep", text: " for " },
      { type: "swap", rough: "our new app", refined: "a budgeting app for freelancers" },
      {
        type: "swap",
        rough: " that sounds cool",
        refined: ", plain language, each under eight words",
      },
    ],
    question: "Who is the audience: freelancers or finance teams?",
    options: ["Freelancers", "Finance teams"],
    answerIndex: 0,
    tokens: { from: 388, to: 241 },
  },
];

export function roughText(s: Scenario): string {
  return s.segments.map((seg) => (seg.type === "keep" ? seg.text : seg.rough)).join("");
}

export function refinedText(s: Scenario): string {
  return s.segments.map((seg) => (seg.type === "keep" ? seg.text : seg.refined)).join("");
}
