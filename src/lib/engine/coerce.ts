/**
 * Reading a Structured Output without trusting it.
 *
 * WHY THIS IS A MODULE AND NOT A LOCAL CHECK
 *
 * Both provider clients use Structured Outputs with `strict:false` (see the
 * header of openai-client.ts for why: our schemas have optional branches that
 * strict mode forbids). strict:false means the schema is a strong hint, not a
 * contract. A field declared `string` can come back as an array, an object,
 * null, or absent, and the SDK hands it straight over with a TypeScript type
 * that confidently says `string`.
 *
 * The type system is actively unhelpful here. Every one of these values is
 * typed as exactly the thing it is not, so nothing warns you and the failure
 * surfaces as `text.includes is not a function` three stages downstream.
 *
 * This lived as per-site checks before. diagnose.ts had the most careful
 * hardening in the engine - a schema-fragment detector, validated
 * already_good_notes, filtered forks - and its own audit mapper still shipped
 * an unguarded `f.evidence.trim()` that throws on a malformed finding. Careful
 * per-site checks did not hold, which is the argument for one accessor that
 * every read goes through.
 *
 * RULE: anything read off an LLM response goes through this file.
 */

/**
 * A string, or the fallback. Never throws, never returns a non-string.
 *
 * Numbers and booleans are coerced because a model returning 150 where the
 * schema said "150" is answering correctly in the wrong shape, and throwing
 * away a right answer over its type helps nobody. Objects and arrays are not
 * coerced: "[object Object]" in front of a user is worse than an empty string.
 */
export function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return String(value)
  return fallback
}

/** Trimmed, or the fallback if it trims to nothing. */
export function asText(value: unknown, fallback = ''): string {
  const s = asString(value).trim()
  return s || fallback
}

/** True only for a string with something in it. */
export function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * An array of non-empty strings. Anything that is not an array becomes empty,
 * and entries that are not usable strings are dropped rather than coerced,
 * because a list is usually rendered and a stray "undefined" is visible.
 */
export function asStringArray(value: unknown, max = Infinity): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const item of value) {
    const s = asString(item).trim()
    if (s) out.push(s)
    if (out.length >= max) break
  }
  return out
}

/**
 * An array of objects, with anything that is not an object dropped.
 *
 * The caller still has to read each field through asString. This only
 * guarantees that `item.field` cannot throw, which is the failure that took
 * down toRubricAudit.
 */
export function asObjectArray(value: unknown, max = Infinity): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  const out: Record<string, unknown>[] = []
  for (const item of value) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      out.push(item as Record<string, unknown>)
    }
    if (out.length >= max) break
  }
  return out
}

/**
 * One of a fixed set, or the fallback.
 *
 * For fields whose schema is an enum. A model that invents a tenth severity
 * level should not be able to put it in front of a user or into a lookup that
 * assumes one of three.
 */
export function asEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  const s = asString(value)
  return (allowed as readonly string[]).includes(s) ? (s as T) : fallback
}
