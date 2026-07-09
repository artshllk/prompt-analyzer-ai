"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ANON_DETECT_LIMIT,
  DETECT_FREE_LIMIT,
  DETECT_WINDOW_HOURS,
} from "@/lib/limits";

/** localStorage key mirroring the homepage rewrite demo's run counter. */
const DETECTOR_RUNS_KEY = "pc_detector_runs";

type Plan = "anon" | "free" | "pro";

type Band = "likely-human" | "mixed" | "likely-ai";
type ConfidenceLabel = "low" | "moderate" | "high";

interface Signals {
  wordCount: number;
  sentenceCount: number;
  meanSentenceLength: number;
  sentenceLengthStdDev: number;
  burstiness: number;
  typeTokenRatio: number;
  emDashDensity: number;
  transitionDensity: number;
  clicheScore: number;
  clicheHits: { phrase: string; weight: number; index: number }[];
  llmLeadInCount: number;
}

interface Result {
  band: Band;
  confidenceLabel: ConfidenceLabel;
  reasoning: string;
  disclaimer: string;
  signals: Signals;
  signalNotes: Record<string, string>;
}

const BAND_LABEL: Record<Band, string> = {
  "likely-human": "Likely human",
  mixed: "Mixed signals",
  "likely-ai": "Likely AI",
};

const BAND_COLOR: Record<Band, string> = {
  "likely-human": "#5ECF7B",
  mixed: "var(--color-paper)",
  "likely-ai": "#E89A6B",
};

const CONFIDENCE_LABEL: Record<ConfidenceLabel, string> = {
  low: "Low confidence",
  moderate: "Moderate confidence",
  high: "Higher confidence",
};

export function DetectorClient({ plan }: { plan: Plan }) {
  const isAnon = plan === "anon";

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Anonymous visitors get ANON_DETECT_LIMIT free detections (tracked in
  // localStorage), then a sign-in gate - same pattern as the homepage
  // rewrite demo.
  const [anonRuns, setAnonRuns] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [showGate, setShowGate] = useState(false);
  // Signed-in free users who exhaust the server-side quota (402).
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (!isAnon || typeof window === "undefined") return;
    const r = parseInt(
      window.localStorage.getItem(DETECTOR_RUNS_KEY) ?? "0",
      10,
    );
    setAnonRuns(Number.isFinite(r) ? r : 0);
    setHydrated(true);
  }, [isAnon]);

  const anonGated = isAnon && hydrated && anonRuns >= ANON_DETECT_LIMIT;

  async function handleAnalyze() {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Anon who already spent their free taste → gate, don't call the API.
    if (anonGated) {
      setShowGate(true);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setLimitReached(false);
    try {
      const res = await fetch("/api/detector/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "detect_limit") {
          // Signed-in free user is out of detections for the window.
          setLimitReached(true);
        } else if (data.error === "rate_limited") {
          setError("Slow down a moment - too many requests in a short window.");
        } else if (data.error === "too_long") {
          setError(data.message || "Text is too long.");
        } else if (data.error === "empty_text") {
          setError("Paste some text first.");
        } else {
          setError("Something went wrong. Try again.");
        }
        return;
      }
      setResult(data as Result);
      // Count the anon taste only on a successful detection.
      if (isAnon) {
        setAnonRuns((prev) => {
          const next = prev + 1;
          try {
            window.localStorage.setItem(DETECTOR_RUNS_KEY, String(next));
          } catch {}
          return next;
        });
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setLimitReached(false);
  }

  const wordCount = text.trim()
    ? text.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const tooShort = wordCount > 0 && wordCount < 30;

  return (
    <div>
      {/* Input */}
      {!result && (
        <>
          <div
            className="rounded-2xl p-1"
            style={{
              background: "var(--color-ink-card-elevated)",
              border: "1px solid var(--color-rule-strong)",
            }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
              placeholder="Paste text - an article, an email, a paragraph from anywhere. At least 30 words for a useful read."
              rows={9}
              maxLength={20000}
              className="w-full resize-none px-5 py-4 text-base focus:outline-none rounded-2xl"
              style={{
                background: "transparent",
                color: "var(--color-paper)",
                fontFamily: "var(--font-inter)",
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* Trust note - claims must match /privacy. */}
          <p
            className="mt-3 text-xs leading-relaxed"
            style={{ color: "var(--color-paper-mute)" }}
          >
            Pasted text is only used to run this check and never used to train
            AI models.{" "}
            <a
              href="/privacy"
              className="underline underline-offset-2 transition-opacity hover:opacity-80"
            >
              Privacy
            </a>
          </p>

          {/* Meta + action on one row */}
          <div className="flex items-center justify-between gap-4 mt-3">
            <span
              className="text-xs tabular-nums"
              style={{ color: "var(--color-paper-mute)" }}
            >
              {tooShort ? (
                "Aim for at least 30 words."
              ) : (
                <>
                  <span style={{ color: "var(--color-paper)" }}>
                    {wordCount}
                  </span>{" "}
                  words
                </>
              )}
            </span>
            <button
              onClick={handleAnalyze}
              disabled={loading || !text.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] btn-paper disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{
                background: "var(--color-paper)",
                color: "var(--color-ink)",
                fontWeight: 500,
              }}
            >
              {loading ? "Analyzing…" : "Analyze text"}
              {!loading && (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2 7H12M12 7L7 2M12 7L7 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <p className="mt-4 text-sm" style={{ color: "#E89A6B" }}>
              {error}
            </p>
          )}

          {limitReached && <FreeLimitNote />}
        </>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <VerdictPanel
              result={result}
              submittedText={text.trim()}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Anonymous sign-in gate after the free detection. */}
      <DetectorGateModal open={showGate} onClose={() => setShowGate(false)} />
    </div>
  );
}

/** Inline note shown to signed-in free users who spent the 24h quota. */
function FreeLimitNote() {
  return (
    <div
      className="mt-4 rounded-xl px-4 py-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5"
      style={{
        background: "var(--color-ink-card)",
        border: "1px solid var(--color-rule-strong)",
      }}
    >
      <p className="text-sm" style={{ color: "var(--color-paper)" }}>
        You&apos;ve used all {DETECT_FREE_LIMIT} free detections in the last{" "}
        {DETECT_WINDOW_HOURS}h.
      </p>
      <Link
        href="/pricing"
        className="text-sm underline underline-offset-4 transition-opacity hover:opacity-80"
        style={{ color: "var(--color-accent-bright)" }}
      >
        Upgrade to Pro for unlimited →
      </Link>
    </div>
  );
}

/** Sign-in gate modal - the "like what you see?" prompt shown to
 *  anonymous visitors once they've spent their free detection. Mirrors
 *  the homepage rewrite demo's account gate, as an overlay. */
function DetectorGateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Sign in to keep detecting"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{
            background: "rgba(10,10,12,0.72)",
            backdropFilter: "blur(8px)",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl p-8 sm:p-10 text-center"
            style={{
              background: "var(--color-ink)",
              border: "1px solid var(--color-rule-strong)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
            }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 inline-flex items-center justify-center w-9 h-9 rounded-full transition-all opacity-60 hover:opacity-100"
              style={{
                border: "1px solid var(--color-rule-strong)",
                color: "var(--color-paper)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 2L12 12M12 2L2 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <h3
              className="font-serif text-[1.7rem] sm:text-4xl leading-tight mb-3"
              style={{ color: "var(--color-paper)", fontWeight: 400 }}
            >
              Like what you see?
            </h3>
            <p
              className="text-[15px] sm:text-lg leading-relaxed mb-8"
              style={{ color: "var(--color-paper-mute)" }}
            >
              You&apos;ve used your free detection. Sign in to continue, free
              accounts get {DETECT_FREE_LIMIT} every {DETECT_WINDOW_HOURS}{" "}
              hours.
            </p>
            <Link
              href="/login?signup=1&redirectTo=/detector"
              className="inline-flex items-center justify-center px-7 py-3 rounded-full text-[15px] btn-paper transition-all"
              style={{
                background: "var(--color-paper)",
                color: "var(--color-ink)",
                fontWeight: 500,
              }}
            >
              Create free account
            </Link>
            <div className="mt-5">
              <Link
                href="/login?redirectTo=/detector"
                className="text-xs underline underline-offset-4 transition-opacity hover:opacity-100 opacity-60"
                style={{ color: "var(--color-paper-mute)" }}
              >
                Sign in instead
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function VerdictPanel({
  result,
  submittedText,
  onReset,
}: {
  result: Result;
  submittedText: string;
  onReset: () => void;
}) {
  const s = result.signals;
  const [showSignals, setShowSignals] = useState(false);

  return (
    <div>
      {/* Verdict + analyzed text, side by side on desktop */}
      <div className="grid md:grid-cols-5 gap-3 md:gap-4">
        {/* Verdict */}
        <div
          className="md:col-span-3 rounded-2xl p-6 md:p-7 flex flex-col"
          style={{
            background: "var(--color-ink-card-elevated)",
            border: "1px solid var(--color-rule-strong)",
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="eyebrow">Verdict</p>
            <span
              className="text-[11px] font-medium tracking-[0.12em] uppercase px-2.5 py-1 rounded-full whitespace-nowrap"
              style={{
                color: "var(--color-paper-mute)",
                border: "1px solid var(--color-rule-strong)",
              }}
            >
              {CONFIDENCE_LABEL[result.confidenceLabel]}
            </span>
          </div>
          <span
            className="font-serif text-4xl md:text-[3rem] leading-none tracking-tight"
            style={{ color: BAND_COLOR[result.band], fontWeight: 400 }}
          >
            {BAND_LABEL[result.band]}
          </span>
          <p
            className="mt-4 text-base leading-[1.7]"
            style={{ color: "var(--color-paper)" }}
          >
            {result.reasoning}
          </p>
        </div>

        {/* Analyzed text */}
        <div
          className="md:col-span-2 rounded-2xl p-5 flex flex-col min-h-0"
          style={{
            background: "var(--color-ink-card)",
            border: "1px solid var(--color-rule)",
          }}
        >
          <p
            className="text-[11px] font-medium tracking-[0.14em] uppercase mb-3 shrink-0"
            style={{ color: "var(--color-paper-mute)" }}
          >
            Your text · {s.wordCount} words
          </p>
          <div
            className="flex-1 max-h-40 md:max-h-56 overflow-y-auto overscroll-contain text-sm leading-[1.65] whitespace-pre-wrap pr-1"
            style={{ color: "var(--color-paper-mute)" }}
          >
            {submittedText}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all btn-outline"
          style={{
            border: "1px solid var(--color-rule-strong)",
            color: "var(--color-paper)",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path
              d="M12 7H2M2 7L7 2M2 7L7 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Analyze another
        </button>

        <button
          onClick={() => setShowSignals((v) => !v)}
          className="inline-flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: "var(--color-paper-mute)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--color-paper)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--color-paper-mute)")
          }
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 10 10"
            fill="none"
            style={{
              transform: showSignals ? "rotate(90deg)" : "none",
              transition: "transform 0.2s",
            }}
            aria-hidden
          >
            <path
              d="M3 2L7 5L3 8"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {showSignals ? "Hide the signals" : "Show the signals we measured"}
        </button>
      </div>

      {/* Signals - optional, grid */}
      <AnimatePresence initial={false}>
        {showSignals && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <StatCard
                label="Burstiness"
                value={s.burstiness.toFixed(3)}
                hint="Sentence-length variation. Higher leans human."
              />
              <StatCard
                label="Vocabulary diversity"
                value={s.typeTokenRatio.toFixed(3)}
                hint="Unique words ÷ total. Higher leans human."
              />
              <StatCard
                label="Em-dash density"
                value={`${s.emDashDensity.toFixed(2)} / 100w`}
                hint="Real em/en-dashes. Heavy use leans AI."
              />
              <StatCard
                label="Transition words"
                value={`${s.transitionDensity.toFixed(2)} / 100w`}
                hint="however, moreover, furthermore… Heavy use leans AI."
              />
              <StatCard
                label="AI-cliché matches"
                value={`${s.clicheHits.length}`}
                hint={
                  s.clicheHits.length > 0
                    ? s.clicheHits
                        .slice(0, 4)
                        .map((h) => `"${h.phrase}"`)
                        .join(" · ")
                    : "No common LLM clichés found."
                }
                className="sm:col-span-2"
              />
            </div>

            <p
              className="mt-4 text-xs leading-relaxed"
              style={{ color: "var(--color-paper-mute)" }}
            >
              {result.disclaimer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** A single measured signal, shown as a compact stat card. */
function StatCard({
  label,
  value,
  hint,
  className = "",
}: {
  label: string;
  value: string;
  hint: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl px-4 py-3.5 ${className}`}
      style={{
        background: "var(--color-ink-card)",
        border: "1px solid var(--color-rule)",
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p
          className="text-[11px] font-medium tracking-[0.12em] uppercase"
          style={{ color: "var(--color-paper-mute)" }}
        >
          {label}
        </p>
        <p
          className="font-serif text-xl tabular-nums shrink-0"
          style={{ color: "var(--color-paper)", fontWeight: 400 }}
        >
          {value}
        </p>
      </div>
      <p
        className="text-xs mt-1.5 leading-snug"
        style={{ color: "var(--color-paper-mute)" }}
      >
        {hint}
      </p>
    </div>
  );
}
