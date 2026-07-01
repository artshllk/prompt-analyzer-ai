"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SCENARIOS, roughText, type Scenario } from "./scenarios";

/**
 * Timeline orchestrator for the hero refinement loop.
 *
 * One phase machine drives every component; nothing else owns timing,
 * so the scene can never fall out of sync. Phases:
 *
 *   typing   - rough prompt types in
 *   question - Deepclario's follow-up card slides in
 *   answer   - ghost cursor picks an option
 *   rewrite  - swap segments dissolve into refined phrasing
 *   score    - clarity/token counters animate
 *   settle   - refined state holds, model chips light up
 *   dissolve - scene fades, next scenario begins
 */

export const PHASES = [
  "typing",
  "question",
  "answer",
  "rewrite",
  "score",
  "settle",
  "dissolve",
] as const;

export type Phase = (typeof PHASES)[number];

/** Order lookup so components can ask "are we at or past phase X". */
const ORDER: Record<Phase, number> = Object.fromEntries(
  PHASES.map((p, i) => [p, i]),
) as Record<Phase, number>;

export function atOrPast(phase: Phase, target: Phase): boolean {
  return ORDER[phase] >= ORDER[target];
}

const TYPING_MS_PER_CHAR = 26;

function phaseDuration(phase: Phase, scenario: Scenario): number {
  switch (phase) {
    case "typing":
      return roughText(scenario).length * TYPING_MS_PER_CHAR + 500;
    case "question":
      return 1700;
    case "answer":
      return 1100;
    case "rewrite":
      return 320 * scenario.segments.filter((s) => s.type === "swap").length + 600;
    case "score":
      return 1500;
    case "settle":
      return 2400;
    case "dissolve":
      return 650;
  }
}

export function useLoopPhase(enabled: boolean, slow: boolean) {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const scenario = SCENARIOS[scenarioIndex];

  // Track how much of the current phase has elapsed so pausing
  // (tab hidden, scrolled away) and the hover slow-down resume
  // mid-phase instead of restarting it.
  const elapsedRef = useRef(0);
  const startedAtRef = useRef(0);
  const speed = slow ? 0.3 : 1;

  useEffect(() => {
    elapsedRef.current = 0;
  }, [phase, scenarioIndex]);

  useEffect(() => {
    if (!enabled) return;
    const remaining = Math.max(phaseDuration(phase, scenario) - elapsedRef.current, 60);
    startedAtRef.current = performance.now();
    const timer = window.setTimeout(() => {
      elapsedRef.current = 0;
      if (phase === "dissolve") {
        setScenarioIndex((i) => (i + 1) % SCENARIOS.length);
        setPhase("typing");
      } else {
        setPhase(PHASES[ORDER[phase] + 1]);
      }
    }, remaining / speed);
    return () => {
      window.clearTimeout(timer);
      elapsedRef.current += (performance.now() - startedAtRef.current) * speed;
    };
  }, [enabled, speed, phase, scenario, scenarioIndex]);

  const advance = useCallback(() => {
    elapsedRef.current = 0;
    setScenarioIndex((i) => (i + 1) % SCENARIOS.length);
    setPhase("typing");
  }, []);

  return { phase, scenario, scenarioIndex, advance };
}
