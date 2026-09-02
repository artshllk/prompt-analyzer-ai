/**
 * Keeping the links when someone pastes an article.
 *
 * THE BUG THIS EXISTS FOR. A textarea receives only `text/plain`, so pasting a
 * page out of a browser or a CMS drops every href at the moment of paste. The
 * checker then reported "no source given" for everything, which is the tool
 * describing its own blindness as a finding about somebody's writing, on their
 * very first use. Measured on one real docs page: 6 links in the HTML, 0
 * surviving the paste.
 *
 * The clipboard carries `text/html` alongside the plain text. This converts
 * that to text that keeps the links, written as markdown.
 *
 * WHY MARKDOWN AND NOT A FOOTNOTE LIST. The extractor binds a URL to a claim by
 * proximity: its prompt says the link must sit on or beside the sentence. A
 * list at the bottom separates them and makes that binding much harder.
 * Markdown also happens to be exactly what Tavily returns when it fetches a
 * page, so if the URL-input path is ever built both routes produce identically
 * shaped text and the extractor needs no change.
 *
 * WHY NOT A HIDDEN LINK MAP. Keeping the box clean and holding the hrefs in
 * separate state looks better for exactly as long as nobody edits the text.
 * After one edit the offsets drift and URLs get attributed to the wrong
 * sentences, which is a confident wrong finding, which is the failure this
 * product is built to avoid.
 *
 * Hand-rolled rather than DOMParser so it can be tested in the normal suite
 * with no browser and no DOM. Same reasoning as segments.ts and locate.ts.
 */

/** Tags whose content is never text. */
const DROP_CONTENT = /^(script|style|noscript|svg|head|iframe|template)$/i

/** Tags that end a line. */
const BLOCK = /^(p|div|section|article|header|footer|li|tr|h[1-6]|blockquote|pre|ul|ol|table|br|hr)$/i

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#x27;/gi, "'")
    .replace(/&#8217;|&rsquo;/gi, '’')
    .replace(/&#8216;|&lsquo;/gi, '‘')
    .replace(/&#8220;|&ldquo;/gi, '“')
    .replace(/&#8221;|&rdquo;/gi, '”')
    .replace(/&#8211;|&ndash;/gi, '–')
    .replace(/&#8212;|&mdash;/gi, '—')
    .replace(/&[a-z]+;/gi, ' ')
}

/**
 * Is this a link worth carrying through?
 *
 * An anchor with no usable scheme is not a source, and neither is an in-page
 * jump. Carrying those through would put junk in the box and give the
 * extractor URLs it cannot fetch.
 */
function usableHref(href: string): boolean {
  const h = href.trim()
  if (!h || h.startsWith('#')) return false
  return /^https?:\/\//i.test(h)
}

/**
 * Convert clipboard HTML to text that keeps its links as markdown.
 *
 * Degrades rather than throws: anything it cannot make sense of becomes plain
 * text, which is exactly what the user had before this existed.
 */
export function htmlToMarkdown(html: string): string {
  const out: string[] = []
  let i = 0
  let skipUntil: string | null = null
  let anchorHref: string | null = null
  let anchorText = ''

  const push = (t: string) => {
    if (anchorHref !== null) anchorText += t
    else out.push(t)
  }

  while (i < html.length) {
    const lt = html.indexOf('<', i)
    if (lt === -1) {
      if (!skipUntil) push(decodeEntities(html.slice(i)))
      break
    }
    // The skip check has to happen BEFORE the text is taken, or a script body
    // reaches the box: it is the text that precedes the CLOSING tag, and the
    // closing tag is what clears the flag.
    if (lt > i && !skipUntil) push(decodeEntities(html.slice(i, lt)))

    const gt = html.indexOf('>', lt)
    if (gt === -1) {
      push(decodeEntities(html.slice(lt)))
      break
    }
    const raw = html.slice(lt + 1, gt)
    i = gt + 1

    const closing = raw.startsWith('/')
    const name = (closing ? raw.slice(1) : raw).split(/[\s/>]/)[0].toLowerCase()

    if (skipUntil) {
      if (closing && name === skipUntil) skipUntil = null
      continue
    }
    if (!closing && DROP_CONTENT.test(name)) {
      skipUntil = name
      continue
    }

    if (name === 'a') {
      if (!closing) {
        const m = raw.match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i)
        const href = (m?.[2] ?? m?.[3] ?? m?.[4] ?? '').trim()
        // A nested anchor cannot be represented, so the outer one wins and the
        // inner opens nothing.
        if (anchorHref === null) {
          anchorHref = usableHref(href) ? href : ''
          anchorText = ''
        }
      } else if (anchorHref !== null) {
        const text = anchorText.replace(/\s+/g, ' ').trim()
        if (!text) {
          // An image-only or empty link. Nothing to attach a URL to.
        } else if (!anchorHref) {
          out.push(text)
        } else if (text === anchorHref) {
          // Already a bare URL on the page. `[url](url)` is noise.
          out.push(text)
        } else {
          out.push(`[${text}](${anchorHref})`)
        }
        anchorHref = null
        anchorText = ''
      }
      continue
    }

    if (BLOCK.test(name)) push('\n')
  }

  // A trailing unclosed anchor still owes its text to the document.
  if (anchorHref !== null && anchorText.trim()) out.push(anchorText.trim())

  return out
    .join('')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * The length that counts against MAX_DOC_CHARS.
 *
 * MARKDOWN SYNTAX IS OUR FORMATTING, NOT THE USER'S WRITING. A 12,000
 * character article stays 12,000 characters however many links it carries, so
 * the brackets, parentheses and the URL itself are all excluded and only the
 * anchor text counts, which is what the person actually sees.
 *
 * The counter under the box shows this same number, so the limit a reader is
 * watching is the limit that applies.
 */
export function visibleLength(text: string): number {
  return stripLinkSyntax(text).length
}

/** `[anchor](url)` becomes `anchor`. Everything else is untouched. */
export function stripLinkSyntax(text: string): string {
  return text.replace(/\[([^\]]*)\]\((https?:\/\/[^)\s]*)\)/g, '$1')
}
