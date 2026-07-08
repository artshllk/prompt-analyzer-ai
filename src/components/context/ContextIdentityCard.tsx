"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  Identity,
  IdentitySuggestion,
  ExpertiseLevel,
} from "@/lib/context/types";

const LEVELS: ExpertiseLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

/**
 * Identity layer of the Context Graph - the pinned "About you" card on the
 * Context page. Auto-extract ("Scan my prompts") produces a suggestion the
 * user confirms or edits - never a blank form. Confirmed identity is
 * injected into every rewrite. Style learning is noted as Pro.
 */
export function ContextIdentityCard({
  initial,
  isPro,
}: {
  initial: Identity;
  isPro: boolean;
}) {
  const [role, setRole] = useState(initial.role ?? "");
  const [company, setCompany] = useState(initial.company ?? "");
  const [industry, setIndustry] = useState(initial.industry ?? "");
  const [expertise, setExpertise] = useState<ExpertiseLevel | "">(
    initial.expertiseLevel ?? "",
  );
  const [languages, setLanguages] = useState(initial.languages.join(", "));
  const [toneNote, setToneNote] = useState(initial.toneNote ?? "");

  const [suggestion, setSuggestion] = useState<IdentitySuggestion | null>(
    initial.suggestion,
  );
  const [confirmed, setConfirmed] = useState(initial.confirmed);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [saved, setSaved] = useState(false);
  const [scanNote, setScanNote] = useState<string | null>(null);

  function fieldsPayload() {
    return {
      role: role.trim() || null,
      company: company.trim() || null,
      industry: industry.trim() || null,
      expertiseLevel: expertise || null,
      languages: languages
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      toneNote: toneNote.trim() || null,
    };
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/context/identity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fieldsPayload()),
      });
      if (res.ok) {
        setConfirmed(true);
        setSuggestion(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function scan() {
    setScanning(true);
    setScanNote(null);
    try {
      const res = await fetch("/api/context/identity/suggest", {
        method: "POST",
      });
      const data = await res.json();
      if (data.suggestion) {
        setSuggestion(data.suggestion as IdentitySuggestion);
      } else {
        setScanNote(
          data.reason === "not_enough_history"
            ? "Run at least 3 rewrites while signed in, then scan again."
            : "Nothing clear to suggest from your prompts yet.",
        );
      }
    } catch {
      setScanNote("Could not scan right now. Try again.");
    } finally {
      setScanning(false);
    }
  }

  function applySuggestion(s: IdentitySuggestion) {
    if (s.role) setRole(s.role);
    if (s.company) setCompany(s.company);
    if (s.industry) setIndustry(s.industry);
    if (s.expertiseLevel) setExpertise(s.expertiseLevel);
    if (s.languages?.length) setLanguages(s.languages.join(", "));
    if (s.toneNote) setToneNote(s.toneNote);
    setSuggestion(null);
  }

  function dismissSuggestion() {
    // Persist the dismissal - clearing local state alone lets the stored
    // suggestion reappear on the next page load.
    setSuggestion(null);
    fetch("/api/context/identity/suggest", { method: "DELETE" }).catch(
      () => {},
    );
  }

  return (
    <div
      className="rounded-2xl p-6 space-y-5"
      style={{
        background: "var(--color-ink-card)",
        border: "1px solid var(--color-rule-strong)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">About you</p>
          <h2
            className="text-lg"
            style={{ color: "var(--color-paper)", fontWeight: 500 }}
          >
            Who you&apos;re writing as
          </h2>
          <p
            className="text-sm mt-1 max-w-md"
            style={{ color: "var(--color-paper-mute)" }}
          >
            Woven into every rewrite, so you stop re-explaining who you are.
            {confirmed
              ? " Active on your rewrites."
              : " Confirm the basics to switch it on."}
          </p>
        </div>
        <button
          onClick={scan}
          disabled={scanning}
          className="shrink-0 text-xs px-3 py-1.5 rounded-full chip-hover transition-colors disabled:opacity-50"
          style={{
            border: "1px solid var(--color-rule-strong)",
            color: "var(--color-paper-mute)",
          }}
        >
          {scanning ? "Scanning…" : "Scan my prompts"}
        </button>
      </div>

      {scanNote && (
        <p className="text-xs" style={{ color: "var(--color-paper-mute)" }}>
          {scanNote}
        </p>
      )}

      {/* Auto-extracted suggestion awaiting confirmation */}
      {suggestion && (
        <div
          className="rounded-xl p-4"
          style={{
            border: "1px dashed var(--color-accent)",
            background: "var(--color-accent-soft)",
          }}
        >
          <p
            className="text-sm font-medium mb-2"
            style={{ color: "var(--color-paper)" }}
          >
            From your recent prompts, you might be:
          </p>
          <ul
            className="text-sm space-y-0.5 mb-3"
            style={{ color: "var(--color-paper-mute)" }}
          >
            {suggestion.role && <li>· {suggestion.role}</li>}
            {suggestion.industry && <li>· in {suggestion.industry}</li>}
            {suggestion.company && <li>· at {suggestion.company}</li>}
            {suggestion.expertiseLevel && (
              <li>· {suggestion.expertiseLevel} level</li>
            )}
            {suggestion.languages?.length ? (
              <li>· {suggestion.languages.join(", ")}</li>
            ) : null}
            {suggestion.toneNote && <li>· {suggestion.toneNote}</li>}
          </ul>
          <div className="flex items-center gap-3">
            <button
              onClick={() => applySuggestion(suggestion)}
              className="text-xs px-3 py-1.5 rounded-full transition-all btn-paper"
              style={{
                background: "var(--color-paper)",
                color: "var(--color-ink)",
                fontWeight: 500,
              }}
            >
              Use these
            </button>
            <button
              onClick={dismissSuggestion}
              className="text-xs transition-opacity opacity-70 hover:opacity-100"
              style={{ color: "var(--color-paper-mute)" }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Editable fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="Role"
          value={role}
          onChange={setRole}
          placeholder="e.g. product manager"
        />
        <Field
          label="Company"
          value={company}
          onChange={setCompany}
          placeholder="e.g. Acme (optional)"
        />
        <Field
          label="Industry"
          value={industry}
          onChange={setIndustry}
          placeholder="e.g. fintech"
        />
        <div>
          <label
            className="block text-[11px] uppercase tracking-[0.12em] mb-1.5"
            style={{ color: "var(--color-paper-mute)" }}
          >
            Expertise
          </label>
          <select
            value={expertise}
            onChange={(e) =>
              setExpertise(e.target.value as ExpertiseLevel | "")
            }
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
            style={{
              background: "var(--color-ink)",
              border: "1px solid var(--color-rule-strong)",
              color: "var(--color-paper)",
            }}
          >
            <option value="">Not set</option>
            {LEVELS.map((l) => (
              <option key={l} value={l} className="capitalize">
                {l}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Languages"
          value={languages}
          onChange={setLanguages}
          placeholder="English, Spanish"
        />
        <Field
          label="Tone & style preferences"
          value={toneNote}
          onChange={setToneNote}
          placeholder="e.g. plain language, no hype"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="text-sm px-4 py-2 rounded-full transition-all btn-paper disabled:opacity-50"
          style={{
            background: "var(--color-paper)",
            color: "var(--color-ink)",
            fontWeight: 500,
          }}
        >
          {saving
            ? "Saving…"
            : confirmed
              ? "Save changes"
              : "Confirm & activate"}
        </button>
        {saved && (
          <span
            className="text-xs"
            style={{ color: "var(--color-accent-bright)" }}
          >
            Saved
          </span>
        )}
      </div>

      {/* Style layer note - Pro */}
      <div className="pt-4" style={{ borderTop: "1px solid var(--color-rule)" }}>
        <p
          className="text-sm font-medium"
          style={{ color: "var(--color-paper)" }}
        >
          Style learning {isPro ? "· on" : "· Pro"}
        </p>
        <p
          className="text-xs mt-1 max-w-md"
          style={{ color: "var(--color-paper-mute)" }}
        >
          {isPro
            ? "Deepclario watches which edits you make to its drafts and adapts: shorter output, no em-dashes, your rhythm."
            : "On Pro, Deepclario learns from the edits you make to its drafts and adapts to your real style automatically."}
          {!isPro && (
            <>
              {" "}
              <Link
                href="/pricing"
                className="underline underline-offset-4 hover:opacity-80 transition-opacity"
                style={{ color: "var(--color-accent-bright)" }}
              >
                See Pro
              </Link>
              .
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        className="block text-[11px] uppercase tracking-[0.12em] mb-1.5"
        style={{ color: "var(--color-paper-mute)" }}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
        style={{
          background: "var(--color-ink)",
          border: "1px solid var(--color-rule-strong)",
          color: "var(--color-paper)",
        }}
      />
    </div>
  );
}
