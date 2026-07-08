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
 * Identity layer of the Context Graph, surfaced in settings. Auto-extract
 * ("Scan my recent prompts") produces a suggestion the user confirms or
 * edits - never a blank form. Confirmed identity is injected into every
 * rewrite. Style learning is noted as Pro.
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

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#6f7fa8] mb-1.5">
            Context Graph
          </p>
          <h2 className="text-lg font-semibold text-[#f0f4ff]">
            Your identity
          </h2>
          <p className="text-sm text-[#8b9cc8] mt-1 max-w-md">
            A profile DeepClario weaves into every rewrite, so you stop
            re-explaining who you are.
            {confirmed
              ? " Active on your rewrites."
              : " Confirm the basics to switch it on."}
          </p>
        </div>
        <button
          onClick={scan}
          disabled={scanning}
          className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/15 text-[#c9d4f0] hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          {scanning ? "Scanning…" : "Scan my prompts"}
        </button>
      </div>

      {scanNote && <p className="text-xs text-[#8b9cc8]">{scanNote}</p>}

      {/* Auto-extracted suggestion awaiting confirmation */}
      {suggestion && (
        <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.06] p-4">
          <p className="text-sm text-[#f0f4ff] font-medium mb-2">
            From your recent prompts, you might be:
          </p>
          <ul className="text-sm text-[#c9d4f0] space-y-0.5 mb-3">
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
              className="text-xs px-3 py-1.5 rounded-full bg-violet-600 text-white hover:bg-violet-500 transition-colors"
            >
              Use these
            </button>
            <button
              onClick={() => setSuggestion(null)}
              className="text-xs text-[#8b9cc8] hover:text-[#c9d4f0] transition-colors"
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
          <label className="block text-[11px] uppercase tracking-[0.12em] text-[#6f7fa8] mb-1.5">
            Expertise
          </label>
          <select
            value={expertise}
            onChange={(e) =>
              setExpertise(e.target.value as ExpertiseLevel | "")
            }
            className="w-full rounded-lg bg-[#0a0e1a] border border-white/10 px-3 py-2.5 text-sm text-[#f0f4ff] outline-none focus:border-violet-500/50"
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
          label="Voice note"
          value={toneNote}
          onChange={setToneNote}
          placeholder="e.g. plain, no hype"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="text-sm px-4 py-2 rounded-lg bg-white text-[#0a0e1a] font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {saving
            ? "Saving…"
            : confirmed
              ? "Save changes"
              : "Confirm & activate"}
        </button>
        {saved && <span className="text-xs text-emerald-400">Saved</span>}
      </div>

      {/* Style layer note - Pro */}
      <div className="pt-4 border-t border-white/10">
        <p className="text-sm text-[#c9d4f0] font-medium">
          Style learning {isPro ? "· on" : "· Pro"}
        </p>
        <p className="text-xs text-[#8b9cc8] mt-1 max-w-md">
          {isPro
            ? "DeepClario watches which edits you make to its drafts and adapts: shorter output, no em-dashes, your rhythm."
            : "On Pro, DeepClario learns from the edits you make to its drafts and adapts to your real style automatically."}
          {!isPro && (
            <>
              {" "}
              <Link
                href="/pricing"
                className="text-violet-300 underline underline-offset-4"
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
      <label className="block text-[11px] uppercase tracking-[0.12em] text-[#6f7fa8] mb-1.5">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg bg-[#0a0e1a] border border-white/10 px-3 py-2.5 text-sm text-[#f0f4ff] outline-none focus:border-violet-500/50 placeholder:text-[#4a5a80]"
      />
    </div>
  );
}
