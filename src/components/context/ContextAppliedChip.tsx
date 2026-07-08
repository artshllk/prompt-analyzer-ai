"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { ContextApplied } from "@/types";

/**
 * The payoff moment of the Context Graph: a quiet chip on a finished
 * rewrite that opens to show exactly which context lines were woven in.
 * Each memory line carries an instant correction affordance ("×" archives
 * it), so a wrong memory dies at the moment it misfires - not three
 * settings screens later.
 */
export function ContextAppliedChip({ applied }: { applied: ContextApplied }) {
  const [open, setOpen] = useState(false);
  // Local view of the memories so an archive removes the line immediately.
  const [memories, setMemories] = useState(applied.memories);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const lineCount =
    applied.identity.length + memories.length + applied.styleHints.length;
  if (lineCount === 0) return null;

  function archive(id: string) {
    setMemories((ms) => ms.filter((m) => m.id !== id));
    fetch(`/api/context/memories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    }).catch(() => {});
  }

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full chip-hover transition-colors"
        style={{
          border: "1px solid var(--color-rule-strong)",
          color: "var(--color-paper-mute)",
        }}
      >
        <span
          aria-hidden
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--color-accent-bright)" }}
        />
        Context applied
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path
            d="M2 4L5 7L8 4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-72 rounded-xl p-3.5 z-30"
            style={{
              background: "var(--color-ink-card-elevated, var(--color-ink-card))",
              border: "1px solid var(--color-rule-strong)",
              boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
            }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.12em] mb-2.5"
              style={{ color: "var(--color-paper-mute)" }}
            >
              Woven into this rewrite
            </p>
            <ul className="space-y-1.5 max-h-56 overflow-y-auto">
              {applied.identity.map((line) => (
                <li
                  key={line}
                  className="text-[13px] leading-snug"
                  style={{ color: "var(--color-paper)" }}
                >
                  {line}
                </li>
              ))}
              {memories.map((m) => (
                <li key={m.id} className="flex items-start gap-2 group">
                  <span
                    className="flex-1 text-[13px] leading-snug"
                    style={{ color: "var(--color-paper)" }}
                  >
                    {m.content}
                  </span>
                  <button
                    onClick={() => archive(m.id)}
                    aria-label={`Stop using "${m.content}"`}
                    title="Stop using this memory"
                    className="shrink-0 text-xs opacity-40 hover:opacity-100 transition-opacity px-1"
                    style={{ color: "var(--color-paper-mute)" }}
                  >
                    ×
                  </button>
                </li>
              ))}
              {applied.styleHints.map((line) => (
                <li
                  key={line}
                  className="text-[13px] leading-snug"
                  style={{ color: "var(--color-paper-mute)" }}
                >
                  {line}
                </li>
              ))}
            </ul>
            <Link
              href="/context"
              className="inline-block mt-3 text-xs hover:opacity-80 transition-opacity"
              style={{ color: "var(--color-accent-bright)" }}
            >
              Manage context →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
