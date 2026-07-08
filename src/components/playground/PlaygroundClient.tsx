"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ToneDropdown } from "@/components/playground/ToneDropdown";
import { SignupGate } from "@/components/playground/SignupGate";
import { FreeCreditsMeter } from "@/components/playground/FreeCreditsMeter";
import { PaywallModal } from "@/components/ui/PaywallModal";
import { StreamOut } from "@/components/shared/StreamOut";
import { usePromptSession } from "@/hooks/usePromptSession";
import { useTokenCount } from "@/hooks/useTokenCount";
import type { Tone } from "@/types/database";
import type { UsageInfo } from "@/types";

const ANON_LIMIT = 2;
const ANON_KEY = "pc_anon_count";

interface PlaygroundClientProps {
  isSignedIn: boolean;
  usage?: UsageInfo;
}

const SAMPLES = [
  "Write me a cover letter",
  "Summarize this article",
  "Help me debug this function",
];

export function PlaygroundClient({ isSignedIn, usage }: PlaygroundClientProps) {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [answer, setAnswer] = useState("");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [anonCount, setAnonCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  // Live free-rewrite count, seeded from the server and decremented
  // optimistically as the user spends credits this session.
  const [rewritesUsed, setRewritesUsed] = useState(usage?.used ?? 0);
  const [deepMode, setDeepMode] = useState(false);

  const session = usePromptSession({ anonymous: !isSignedIn });
  const isAnon = !isSignedIn;

  const isFree = !isAnon && usage?.tier === "free" && usage.limit != null;
  const rewriteLimit = usage?.limit ?? 0;
  const rewritesLeft = Math.max(0, rewriteLimit - rewritesUsed);
  const isPro = usage?.tier === "pro";

  // Style-capture: Pro users can edit the rewrite before copying; the
  // accepted (edited or verbatim) text feeds the Context Graph's Style layer.
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState(false);
  const [draft, setDraft] = useState("");

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSignedIn) {
      const raw = window.localStorage.getItem(ANON_KEY);
      const parsed = raw ? parseInt(raw, 10) : 0;
      setAnonCount(Number.isFinite(parsed) ? parsed : 0);
    }
    setHydrated(true);
  }, [isSignedIn]);

  // Auto-grow inputs.
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    const MAX = 320;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, MAX)}px`;
    ta.style.overflowY = ta.scrollHeight > MAX ? "auto" : "hidden";
  }, [prompt]);

  useEffect(() => {
    if (session.stage !== "clarifying") return;
    answerRef.current?.focus();
  }, [session.stage]);

  useEffect(() => {
    const ta = answerRef.current;
    if (!ta) return;
    const MAX = 200;
    ta.style.height = "auto";
    // Grow to fit, capped at MAX. Past the cap, let it scroll instead of
    // clipping - pasting a long answer must stay readable.
    ta.style.height = `${Math.min(ta.scrollHeight, MAX)}px`;
    ta.style.overflowY = ta.scrollHeight > MAX ? "auto" : "hidden";
  }, [answer]);

  // On mobile, bring the response into view when work begins.
  useEffect(() => {
    if (
      session.stage === "analyzing" ||
      session.stage === "clarifying" ||
      session.stage === "done"
    ) {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        responseRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [session.stage]);

  const anonGated =
    isAnon && hydrated && anonCount >= ANON_LIMIT && session.stage === "idle";
  const started = session.stage !== "idle";
  const thinking =
    session.stage === "analyzing" || session.stage === "improving";

  async function handleAnalyze() {
    if (!prompt.trim() || thinking) return;
    const result = await session.analyze(prompt, tone, deepMode && isPro);
    if (isAnon) {
      const next = anonCount + 1;
      setAnonCount(next);
      window.localStorage.setItem(ANON_KEY, String(next));
    } else if (usage?.tier === "free" && result && !result.usageLimitReached) {
      // A fresh analysis spends one credit (clarify turns don't recount).
      setRewritesUsed((u) => u + 1);
    }
    if (result?.usageLimitReached) setPaywallOpen(true);
  }

  function handleAnswer() {
    if (!answer.trim() || thinking) return;
    session.submitAnswer(answer.trim());
    setAnswer("");
  }

  function handleReset() {
    session.reset();
    setPrompt("");
    setAnswer("");
    setEditing(false);
    setEdited(false);
    setDraft("");
    setCopied(false);
  }

  // The rewrite the user currently sees/copies: their edit if they've made
  // one, otherwise the AI's draft.
  function currentRewrite() {
    const aiDraft = session.improved?.improvedPrompt ?? "";
    return edited || editing ? draft : aiDraft;
  }

  async function handleCopyRewrite() {
    const aiDraft = session.improved?.improvedPrompt ?? "";
    if (!aiDraft) return;
    const finalText = currentRewrite() || aiDraft;
    try {
      await navigator.clipboard.writeText(finalText);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    // Style layer (Pro): record what the user actually accepted so the
    // graph learns their edits. The server re-checks Pro; fire-and-forget.
    if (isPro) {
      fetch("/api/context/style-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiDraft, userFinal: finalText }),
      }).catch(() => {});
    }
  }

  function toggleEdit() {
    if (!editing) {
      // Enter edit mode - seed from whatever is currently shown.
      setDraft(edited ? draft : session.improved?.improvedPrompt ?? "");
      setEditing(true);
      return;
    }
    // Leave edit mode - commit the edit if it actually changed the text so
    // the card keeps showing the user's version.
    const original = session.improved?.improvedPrompt ?? "";
    setEdited(draft.trim().length > 0 && draft.trim() !== original.trim());
    setEditing(false);
  }

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-10 py-10 md:py-16">
      {/* Hero - H1 + one sentence. No paragraph. */}
      <header className="mb-8 md:mb-12">
        <h1
          className="display text-3xl md:text-5xl tracking-tight"
          style={{ color: "var(--color-paper)" }}
        >
          Sharpen your prompt.
        </h1>
        <p
          className="mt-3 text-base md:text-lg"
          style={{ color: "var(--color-paper-mute)" }}
        >
          Paste anything. We rewrite it for ChatGPT, Claude, and Gemini.
        </p>
      </header>

      {/* Always-on free-credits meter with the Pro value beside it. */}
      {isFree && (
        <FreeCreditsMeter
          used={rewritesUsed}
          limit={rewriteLimit}
          onUpgrade={() => setPaywallOpen(true)}
        />
      )}

      {anonGated ? (
        <SignupGate used={anonCount} limit={ANON_LIMIT} />
      ) : (
        <div className="grid md:grid-cols-2 gap-5 md:gap-6 items-start">
          {/* LEFT - the prompt. */}
          <div>
            <p className="eyebrow mb-3">Your prompt</p>
            <div
              className="rounded-2xl p-2.5"
              style={{
                background: "var(--color-ink-card)",
                border: "1px solid var(--color-rule-strong)",
              }}
            >
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={started}
                placeholder="A rough idea, a one-liner, or a request you haven't finished writing…"
                rows={5}
                maxLength={4000}
                className="w-full bg-transparent resize-none p-3 text-[15px] sm:text-base outline-none disabled:opacity-60"
                style={{
                  color: "var(--color-paper)",
                  caretColor: "var(--color-paper)",
                  fontFamily: "var(--font-inter)",
                  lineHeight: 1.6,
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !started) {
                    e.preventDefault();
                    handleAnalyze();
                  }
                }}
              />
              <div className="flex items-center justify-between gap-3 p-1.5 pt-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ToneDropdown
                    value={tone}
                    onChange={setTone}
                    disabled={started}
                  />
                  {/* Deep Rewrite - Pro toggles it; free users see it locked
                      so the upgrade is felt inside the product. Hidden for
                      anonymous visitors (they get the sign-in gate first). */}
                  {isSignedIn && (
                    <DeepRewriteToggle
                      isPro={isPro}
                      active={deepMode}
                      disabled={started}
                      onToggle={() => setDeepMode((d) => !d)}
                      onUpgrade={() => setPaywallOpen(true)}
                    />
                  )}
                </div>
                {!started ? (
                  <button
                    onClick={handleAnalyze}
                    disabled={!prompt.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all btn-paper disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: "var(--color-paper)",
                      color: "var(--color-ink)",
                      fontWeight: 500,
                    }}
                  >
                    Improve
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2 7H12M12 7L7 2M12 7L7 12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleReset}
                    className="text-sm transition-opacity hover:opacity-100 opacity-70 focus:opacity-100 px-2"
                    style={{ color: "var(--color-paper-mute)" }}
                  >
                    New prompt
                  </button>
                )}
              </div>
            </div>

            {!started && (
              <div className="mt-4 flex flex-wrap gap-2">
                {SAMPLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setPrompt(s)}
                    className="text-[13px] px-3 py-1.5 rounded-full chip-hover transition-colors"
                    style={{
                      color: "var(--color-paper-mute)",
                      border: "1px solid var(--color-rule-strong)",
                    }}
                  >
                    &ldquo;{s}&rdquo;
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT - Deepclario's response (progressive disclosure). */}
          <div ref={responseRef}>
            <div className="flex items-baseline justify-between mb-3">
              <p
                className="eyebrow"
                style={{ color: "var(--color-accent-bright)" }}
              >
                Deepclario
              </p>
              {session.stage === "done" && session.improved && (
                <span
                  className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-xs tabular-nums"
                  style={{ color: "var(--color-paper-mute)" }}
                >
                  <span>
                    clarity{" "}
                    <span style={{ color: "var(--color-paper)" }}>
                      {session.improved.scoreBeforeImprovement}
                    </span>
                    <span className="mx-1">→</span>
                    <span style={{ color: "var(--color-accent-bright)" }}>
                      {session.improved.clarityScoreAfter}
                    </span>
                  </span>
                  <TokenDelta
                    original={prompt}
                    improved={session.improved.improvedPrompt}
                  />
                </span>
              )}
            </div>

            <div
              className="rounded-2xl p-4 sm:p-5 min-h-48 md:min-h-64"
              style={{
                background: "rgba(91,143,237,0.07)",
                border: "1px solid var(--color-rule-strong)",
              }}
            >
              <AnimatePresence mode="wait">
                {session.stage === "idle" && (
                  <motion.ol
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3.5 text-sm"
                    style={{ color: "var(--color-paper-mute)" }}
                  >
                    {[
                      "We read your prompt.",
                      "If something is missing, we ask one question.",
                      "You get a rewrite ready for ChatGPT, Claude, or Gemini.",
                    ].map((step, i) => (
                      <li key={step} className="flex items-baseline gap-3">
                        <span
                          className="shrink-0 tabular-nums text-xs"
                          style={{ color: "var(--color-accent)" }}
                        >
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </motion.ol>
                )}

                {thinking && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Writing
                      label={
                        session.stage === "improving"
                          ? deepMode && isPro
                            ? "Deep rewriting: draft, critique, refine…"
                            : "Rewriting…"
                          : "Reading your prompt…"
                      }
                    />
                  </motion.div>
                )}

                {session.stage === "clarifying" && session.clarifying && (
                  <motion.div
                    key={`q-${session.clarifying.turn}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <p
                      className="text-lg sm:text-xl leading-[1.45]"
                      style={{
                        color: "var(--color-paper)",
                        fontFamily: "var(--font-inter)",
                        fontWeight: 500,
                      }}
                    >
                      {session.clarifying.question}
                    </p>
                    {session.clarifying.targetsGap && (
                      <p
                        className="mt-2 text-xs"
                        style={{ color: "var(--color-paper-mute)" }}
                      >
                        Filling the gap:{" "}
                        <span style={{ color: "var(--color-paper)" }}>
                          {session.clarifying.targetsGap}
                        </span>
                      </p>
                    )}
                  </motion.div>
                )}

                {session.stage === "done" && session.improved && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {/* What it asked and what you said - the proof the
                        rewrite is grounded in your answers, not guessed. */}
                    {session.priorAnswers.length > 0 && (
                      <ul className="mb-5 space-y-4">
                        {session.priorAnswers.map((qa) => (
                          <li
                            key={qa.turn}
                            className="pl-4"
                            style={{
                              borderLeft: "1px solid var(--color-rule-strong)",
                            }}
                          >
                            <p
                              className="text-sm"
                              style={{ color: "var(--color-paper-mute)" }}
                            >
                              {qa.question}
                            </p>
                            <p
                              className="text-sm mt-1"
                              style={{ color: "var(--color-paper)" }}
                            >
                              {qa.answer}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}

                    {isPro && editing ? (
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        autoFocus
                        rows={8}
                        className="w-full bg-transparent resize-y outline-none text-[15px] sm:text-base leading-[1.7] whitespace-pre-wrap"
                        style={{
                          color: "var(--color-paper)",
                          caretColor: "var(--color-paper)",
                          fontFamily: "var(--font-inter)",
                        }}
                      />
                    ) : edited ? (
                      <p
                        className="text-[15px] sm:text-base leading-[1.7] whitespace-pre-wrap wrap-break-word"
                        style={{
                          color: "var(--color-paper)",
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        {draft}
                      </p>
                    ) : (
                      <StreamOut
                        text={session.improved.improvedPrompt}
                        className="text-[15px] sm:text-base leading-[1.7] whitespace-pre-wrap wrap-break-word"
                        style={{
                          color: "var(--color-paper)",
                          fontFamily: "var(--font-inter)",
                        }}
                      />
                    )}
                    {edited && !editing && (
                      <span
                        className="inline-block mt-2 text-[11px] tracking-[0.12em] uppercase"
                        style={{ color: "var(--color-paper-mute)" }}
                      >
                        Your edited version
                      </span>
                    )}

                    {/* Why the rewrite is better - the reasoning, not
                        just the result. */}
                    {(session.improved.explanation ||
                      session.improved.improvementTags.length > 0) && (
                      <div
                        className="mt-5 pt-4"
                        style={{ borderTop: "1px solid var(--color-rule)" }}
                      >
                        {session.improved.explanation && (
                          <p
                            className="text-sm leading-[1.6]"
                            style={{ color: "var(--color-paper-mute)" }}
                          >
                            {session.improved.explanation}
                          </p>
                        )}
                        {session.improved.improvementTags.length > 0 && (
                          <p
                            className="mt-2.5 text-xs"
                            style={{ color: "var(--color-paper-mute)" }}
                          >
                            <span className="eyebrow mr-2">Added</span>
                            {session.improved.improvementTags.map((t, i) => (
                              <span key={t}>
                                {i > 0 && ", "}
                                <span
                                  className="capitalize"
                                  style={{ color: "var(--color-paper)" }}
                                >
                                  {t.replace(/_/g, " ")}
                                </span>
                              </span>
                            ))}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {session.stage === "error" && (
                  <motion.p
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[15px] sm:text-base leading-[1.6]"
                    style={{ color: "#E89A6B" }}
                  >
                    {errorCopy(session.error)}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Answer field - ONLY while a clarifying question waits. */}
            <AnimatePresence>
              {session.stage === "clarifying" && (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-4"
                >
                  <div
                    className="flex items-end gap-2.5 p-2.5 rounded-2xl"
                    style={{
                      background: "var(--color-ink-card)",
                      border: "1px solid var(--color-rule-strong)",
                    }}
                  >
                    <textarea
                      ref={answerRef}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your answer…"
                      rows={1}
                      maxLength={1000}
                      className="flex-1 bg-transparent resize-none py-2 px-2 text-[15px] sm:text-base outline-none"
                      style={{
                        color: "var(--color-paper)",
                        caretColor: "var(--color-paper)",
                        fontFamily: "var(--font-inter)",
                        lineHeight: 1.55,
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAnswer();
                        }
                      }}
                    />
                    <button
                      onClick={handleAnswer}
                      disabled={!answer.trim()}
                      aria-label="Send answer"
                      className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full transition-all btn-paper disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        background: "var(--color-paper)",
                        color: "var(--color-ink)",
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M7 12V2M7 2L2 7M7 2L12 7"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {session.stage === "done" && session.improved && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleCopyRewrite}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all btn-paper"
                    style={{ background: "var(--color-paper)", color: "var(--color-ink)", fontWeight: 500 }}
                  >
                    {copied ? "Copied" : "Copy rewrite"}
                  </button>
                  {isPro && (
                    <button
                      onClick={toggleEdit}
                      className="text-sm transition-opacity hover:opacity-100 opacity-70"
                      style={{ color: "var(--color-paper-mute)" }}
                    >
                      {editing ? "Done editing" : "Edit before copying"}
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="text-sm transition-opacity hover:opacity-100 opacity-70"
                    style={{ color: "var(--color-paper-mute)" }}
                  >
                    Try another
                  </button>
                </div>
                {isPro && editing && (
                  <p className="text-xs" style={{ color: "var(--color-paper-mute)" }}>
                    Your edits teach DeepClario your style. Copy when it reads the way you&apos;d send it.
                  </p>
                )}
              </div>
            )}

            {/* Value-moment nudge: fires only for free users running low, right
                after they've felt the payoff of a rewrite. */}
            {session.stage === "done" && isFree && rewritesLeft <= 2 && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-3 text-xs"
                style={{ color: "var(--color-paper-mute)" }}
              >
                {rewritesLeft > 0
                  ? `${rewritesLeft} free rewrite${rewritesLeft === 1 ? "" : "s"} left. `
                  : "That was your last free rewrite. "}
                <button
                  onClick={() => setPaywallOpen(true)}
                  className="underline underline-offset-4 transition-opacity hover:opacity-80"
                  style={{ color: "var(--color-accent-bright)" }}
                >
                  Keep the momentum with Pro →
                </button>
              </motion.p>
            )}

            {session.stage === "error" && (
              <button
                onClick={handleReset}
                className="mt-4 text-sm underline underline-offset-4 hover:opacity-80"
                style={{ color: "var(--color-paper)" }}
              >
                Start over
              </button>
            )}
          </div>
        </div>
      )}

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
}

/**
 * Deep Rewrite chip with a real tooltip (the native `title` attr is
 * invisible on touch and can't hold a link). The tooltip explains the
 * value differently per tier:
 *  - Pro: what the mode actually does, so the toggle feels meaningful.
 *  - Free: what they're missing + the price, and the click opens checkout.
 * It opens on hover and keyboard focus, and stays open while the pointer
 * is over the tooltip itself so the "How it works" link is clickable.
 */
function DeepRewriteToggle({
  isPro,
  active,
  disabled,
  onToggle,
  onUpgrade,
}: {
  isPro: boolean;
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
  onUpgrade: () => void;
}) {
  const [tipOpen, setTipOpen] = useState(false);
  const on = isPro && active;

  return (
    <div
      className="relative"
      onMouseEnter={() => setTipOpen(true)}
      onMouseLeave={() => setTipOpen(false)}
    >
      <button
        type="button"
        disabled={disabled}
        aria-pressed={isPro ? active : false}
        aria-describedby="deep-rewrite-tip"
        onFocus={() => setTipOpen(true)}
        onBlur={() => setTipOpen(false)}
        onClick={() => (isPro ? onToggle() : onUpgrade())}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] transition-colors chip-hover disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          border: `1px solid ${on ? "var(--color-accent-bright)" : "var(--color-rule-strong)"}`,
          color: on ? "var(--color-accent-bright)" : "var(--color-paper-mute)",
          background: on ? "var(--color-accent-soft)" : "transparent",
        }}
      >
        {!isPro && (
          <svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden
          >
            <rect
              x="2.5"
              y="5"
              width="7"
              height="5"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M4 5V3.5a2 2 0 0 1 4 0V5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        )}
        Deep Rewrite
        {isPro ? (
          <span
            className="text-[10px] tracking-wider uppercase font-semibold"
            style={{
              color: on
                ? "var(--color-accent-bright)"
                : "var(--color-paper-mute)",
            }}
          >
            {on ? "On" : "Off"}
          </span>
        ) : (
          <span
            className="text-[10px] tracking-wider uppercase font-semibold"
            style={{ color: "var(--color-accent-bright)" }}
          >
            Pro
          </span>
        )}
      </button>

      <AnimatePresence>
        {tipOpen && (
          <motion.div
            id="deep-rewrite-tip"
            role="tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 bottom-full mb-2 w-64 rounded-xl p-3.5 z-30"
            style={{
              background:
                "var(--color-ink-card-elevated, var(--color-ink-card))",
              border: "1px solid var(--color-rule-strong)",
              boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
            }}
          >
            <p
              className="text-[13px] leading-normal"
              style={{ color: "var(--color-paper)" }}
            >
              Your prompt gets drafted, critiqued, and refined on our strongest
              model.
            </p>
            <a
              href="/blog/what-is-deep-rewrite"
              className="inline-block mt-2 text-xs hover:opacity-80 transition-opacity"
              style={{ color: "var(--color-accent-bright)" }}
            >
              How it works →
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Honest token before/after: shown in both directions. A vague
 *  one-liner usually gains tokens (specificity costs words); a rambling
 *  prompt loses them. Only a genuine reduction gets the accent color. */
function TokenDelta({
  original,
  improved,
}: {
  original: string;
  improved: string;
}) {
  const before = useTokenCount(original);
  const after = useTokenCount(improved);
  if (!before || !after) return null;
  return (
    <span>
      tokens <span style={{ color: "var(--color-paper)" }}>{before}</span>
      <span className="mx-1">→</span>
      <span
        style={{
          color:
            after < before
              ? "var(--color-accent-bright)"
              : "var(--color-paper)",
        }}
      >
        {after}
      </span>
    </span>
  );
}

function Writing({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      <span className="inline-flex items-center gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--color-accent-bright)" }}
            animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: i * 0.16,
              ease: "easeInOut",
            }}
          />
        ))}
      </span>
      <span className="text-sm" style={{ color: "var(--color-paper-mute)" }}>
        {label}
      </span>
    </div>
  );
}

function errorCopy(error: string | null): string {
  switch (error) {
    case "rate_limited":
      return "Slow down a moment - try again in a few seconds.";
    case "network":
      return "Network hiccup. Check your connection and try again.";
    case "ai_unavailable":
      return "The AI service is briefly unreachable. Try again in a moment.";
    case "session_lost":
    case "session_not_found":
      return "Your session expired. Start a new analysis.";
    default:
      return "Something went sideways on our end. Try again.";
  }
}
