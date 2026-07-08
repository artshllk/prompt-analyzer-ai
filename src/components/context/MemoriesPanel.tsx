"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { MEMORY_FREE_LIMIT } from "@/lib/limits";
import type { Memory, MemoryKind } from "@/lib/context/types";

// Search and kind filters only earn their pixels once the list is long
// enough to lose things in - progressive disclosure, not a toolbar tax.
const SEARCH_THRESHOLD = 15;

const KIND_LABELS: Record<MemoryKind, string> = {
  preference: "Preferences",
  style_rule: "Style rules",
  fact: "Notes & facts",
};
const KIND_ORDER: MemoryKind[] = ["preference", "style_rule", "fact"];

const GHOST_EXAMPLES = [
  "Prefers concise, plain language",
  "Writes for a developer audience",
  "British English spelling",
];

function relativeUse(iso: string | null): string | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "used today";
  if (days === 1) return "used yesterday";
  return `used ${days}d ago`;
}

/**
 * The accumulating half of the Context Graph: standing preferences, facts,
 * and graduated style rules. Suggested items float to the top of their
 * group awaiting Confirm/Dismiss; everything active is injected into
 * rewrites under the compile budget.
 */
export function MemoriesPanel({
  initial,
  isPro,
}: {
  initial: Memory[];
  isPro: boolean;
}) {
  const [memories, setMemories] = useState<Memory[]>(initial);
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newKind, setNewKind] = useState<MemoryKind>("preference");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<MemoryKind | null>(null);
  const [atLimit, setAtLimit] = useState(false);

  const activeCount = memories.filter((m) => m.status === "active").length;
  const suggested = memories.filter((m) => m.status === "suggested");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return memories.filter(
      (m) =>
        m.status === "active" &&
        (!kindFilter || m.kind === kindFilter) &&
        (!q || m.content.toLowerCase().includes(q)),
    );
  }, [memories, query, kindFilter]);

  async function add() {
    const content = newContent.trim();
    if (!content || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/context/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: newKind, content }),
      });
      const data = await res.json();
      if (res.ok && data.memory) {
        setMemories((ms) => [data.memory as Memory, ...ms]);
        setNewContent("");
        setAdding(false);
        setAtLimit(false);
      } else if (data.error === "memory_limit") {
        setAtLimit(true);
      }
    } catch {
    } finally {
      setSaving(false);
    }
  }

  async function patch(id: string, fields: Partial<Pick<Memory, "content" | "status">>) {
    // Optimistic: the row updates instantly; a failed request just reloads truth.
    setMemories((ms) =>
      ms
        .map((m) => (m.id === id ? { ...m, ...fields } : m))
        .filter((m) => m.status !== "archived"),
    );
    try {
      await fetch(`/api/context/memories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
    } catch {}
  }

  async function remove(id: string) {
    setMemories((ms) => ms.filter((m) => m.id !== id));
    try {
      await fetch(`/api/context/memories/${id}`, { method: "DELETE" });
    } catch {}
  }

  function startEdit(m: Memory) {
    setEditingId(m.id);
    setEditContent(m.content);
  }

  function commitEdit() {
    if (!editingId) return;
    const content = editContent.trim();
    if (content) patch(editingId, { content });
    setEditingId(null);
  }

  const showSearch = activeCount + suggested.length > SEARCH_THRESHOLD;
  const isEmpty = memories.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Memories</p>
          <p
            className="text-sm max-w-md"
            style={{ color: "var(--color-paper-mute)" }}
          >
            Standing preferences and facts Deepclario carries into every
            rewrite.
            {!isPro && (
              <span> Free accounts hold {MEMORY_FREE_LIMIT} — Pro remembers everything.</span>
            )}
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full chip-hover transition-colors"
            style={{
              border: "1px solid var(--color-rule-strong)",
              color: "var(--color-paper-mute)",
            }}
          >
            + Add
          </button>
        )}
      </div>

      {showSearch && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memories…"
            className="flex-1 min-w-40 rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: "var(--color-ink)",
              border: "1px solid var(--color-rule-strong)",
              color: "var(--color-paper)",
            }}
          />
          {KIND_ORDER.map((k) => (
            <button
              key={k}
              onClick={() => setKindFilter(kindFilter === k ? null : k)}
              className="text-xs px-3 py-1.5 rounded-full chip-hover transition-colors"
              style={{
                border: `1px solid ${kindFilter === k ? "var(--color-accent-bright)" : "var(--color-rule-strong)"}`,
                color:
                  kindFilter === k
                    ? "var(--color-accent-bright)"
                    : "var(--color-paper-mute)",
              }}
            >
              {KIND_LABELS[k]}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl p-4 space-y-3"
            style={{
              background: "var(--color-ink-card)",
              border: "1px solid var(--color-rule-strong)",
            }}
          >
            <input
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              maxLength={200}
              autoFocus
              placeholder='One sentence, e.g. "Audience: non-technical executives"'
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{
                background: "var(--color-ink)",
                border: "1px solid var(--color-rule-strong)",
                color: "var(--color-paper)",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
                if (e.key === "Escape") setAdding(false);
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              {(["preference", "fact"] as MemoryKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setNewKind(k)}
                  className="text-xs px-3 py-1.5 rounded-full chip-hover transition-colors capitalize"
                  style={{
                    border: `1px solid ${newKind === k ? "var(--color-accent-bright)" : "var(--color-rule-strong)"}`,
                    color:
                      newKind === k
                        ? "var(--color-accent-bright)"
                        : "var(--color-paper-mute)",
                  }}
                >
                  {k === "fact" ? "Note / fact" : "Preference"}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setAdding(false)}
                  className="text-xs px-3 py-1.5 opacity-70 hover:opacity-100 transition-opacity"
                  style={{ color: "var(--color-paper-mute)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={add}
                  disabled={!newContent.trim() || saving}
                  className="text-xs px-3.5 py-1.5 rounded-full transition-all btn-paper disabled:opacity-40"
                  style={{
                    background: "var(--color-paper)",
                    color: "var(--color-ink)",
                    fontWeight: 500,
                  }}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {atLimit && !isPro && (
        <p className="text-sm" style={{ color: "var(--color-paper-mute)" }}>
          Your context is full ({MEMORY_FREE_LIMIT} memories). Pro remembers
          everything — and learns your style from your edits.{" "}
          <Link
            href="/pricing"
            className="underline underline-offset-4 hover:opacity-80 transition-opacity"
            style={{ color: "var(--color-accent-bright)" }}
          >
            Upgrade →
          </Link>
        </p>
      )}

      {/* Suggested items float above the list awaiting review. */}
      {suggested.map((m) => (
        <div
          key={m.id}
          className="rounded-xl p-4 flex flex-wrap items-center gap-3"
          style={{
            border: "1px dashed var(--color-accent)",
            background: "var(--color-accent-soft)",
          }}
        >
          <div className="flex-1 min-w-48">
            <p
              className="text-[11px] uppercase tracking-[0.12em] mb-1"
              style={{ color: "var(--color-accent-bright)" }}
            >
              Suggested
            </p>
            <p className="text-sm" style={{ color: "var(--color-paper)" }}>
              {m.content}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => patch(m.id, { status: "active" })}
              className="text-xs px-3 py-1.5 rounded-full transition-all btn-paper"
              style={{
                background: "var(--color-paper)",
                color: "var(--color-ink)",
                fontWeight: 500,
              }}
            >
              Confirm
            </button>
            <button
              onClick={() => remove(m.id)}
              className="text-xs opacity-70 hover:opacity-100 transition-opacity"
              style={{ color: "var(--color-paper-mute)" }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}

      {isEmpty && !adding ? (
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--color-ink-card)",
            border: "1px solid var(--color-rule-strong)",
          }}
        >
          <p className="text-sm mb-4" style={{ color: "var(--color-paper)" }}>
            Rewrites get better when Deepclario knows how you like to write.
          </p>
          <ul className="space-y-2 mb-5">
            {GHOST_EXAMPLES.map((g) => (
              <li
                key={g}
                className="text-sm opacity-40"
                style={{ color: "var(--color-paper-mute)" }}
              >
                · {g}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setAdding(true)}
            className="text-sm px-4 py-2 rounded-full transition-all btn-paper"
            style={{
              background: "var(--color-paper)",
              color: "var(--color-ink)",
              fontWeight: 500,
            }}
          >
            Add a preference
          </button>
        </div>
      ) : (
        KIND_ORDER.map((kind) => {
          const group = visible.filter((m) => m.kind === kind);
          if (group.length === 0) return null;
          return (
            <section key={kind}>
              <p
                className="text-[11px] uppercase tracking-[0.12em] mb-2"
                style={{ color: "var(--color-paper-mute)" }}
              >
                {KIND_LABELS[kind]} ({group.length})
              </p>
              <ul
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--color-rule-strong)" }}
              >
                {group.map((m, i) => (
                  <li
                    key={m.id}
                    className="group flex items-start gap-3 px-4 py-3"
                    style={{
                      background: "var(--color-ink-card)",
                      ...(i > 0 && { borderTop: "1px solid var(--color-rule)" }),
                    }}
                  >
                    {editingId === m.id ? (
                      <input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        maxLength={200}
                        autoFocus
                        className="flex-1 bg-transparent text-sm outline-none py-0.5"
                        style={{ color: "var(--color-paper)" }}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => startEdit(m)}
                        className="flex-1 text-left text-sm py-0.5"
                        style={{ color: "var(--color-paper)" }}
                        title="Click to edit"
                      >
                        {m.content}
                      </button>
                    )}
                    <div className="flex items-center gap-3 shrink-0 pt-0.5">
                      {relativeUse(m.lastUsedAt) && (
                        <span
                          className="text-[11px] tabular-nums"
                          style={{ color: "var(--color-paper-mute)" }}
                        >
                          {relativeUse(m.lastUsedAt)}
                        </span>
                      )}
                      <span className="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                          onClick={() => patch(m.id, { status: "archived" })}
                          className="text-[11px] hover:opacity-80"
                          style={{ color: "var(--color-paper-mute)" }}
                        >
                          Archive
                        </button>
                        <button
                          onClick={() => remove(m.id)}
                          className="text-[11px] hover:opacity-80"
                          style={{ color: "#C25E5E" }}
                        >
                          Delete
                        </button>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
