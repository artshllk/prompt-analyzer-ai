import { test } from 'node:test'
import assert from 'node:assert/strict'
import { htmlToMarkdown, visibleLength, stripLinkSyntax } from './paste'

test('a pasted link survives as markdown', () => {
  // The whole point. A textarea gets text/plain and drops every href, so the
  // checker reported "no source given" for a page full of sources.
  const html = '<p>Search is big. <a href="https://ahrefs.com/blog/x">Ahrefs found</a> 96%.</p>'
  assert.equal(htmlToMarkdown(html), 'Search is big. [Ahrefs found](https://ahrefs.com/blog/x) 96%.')
})

test('the URL sits beside the sentence it belongs to', () => {
  // The extractor binds a URL to a claim by proximity, so a link must not be
  // relocated to the end of the document.
  const md = htmlToMarkdown('<p>A claim. <a href="https://x.test/a">source</a></p><p>Another.</p>')
  assert.ok(md.indexOf('https://x.test/a') < md.indexOf('Another'))
})

test('anchors that are not sources are dropped, keeping their words', () => {
  for (const href of ['#top', 'javascript:void(0)', 'mailto:a@b.com', '/relative']) {
    const md = htmlToMarkdown(`<p>see <a href="${href}">this</a></p>`)
    assert.equal(md, 'see this', `${href} must not become a link`)
  }
})

test('a bare URL as its own anchor text is not doubled', () => {
  const md = htmlToMarkdown('<p><a href="https://x.test/a">https://x.test/a</a></p>')
  assert.equal(md, 'https://x.test/a')
})

test('script and style content never reaches the box', () => {
  const html = '<p>Real.</p><script>var x = "not real";</script><style>.a{color:red}</style>'
  assert.equal(htmlToMarkdown(html), 'Real.')
})

test('block elements become line breaks, not run-on text', () => {
  // A heading closing and a paragraph opening both break the line, so the gap
  // is a blank line. That is a paragraph break and it is correct; what matters
  // is that the words never run together.
  const md = htmlToMarkdown('<h1>Title</h1><p>One.</p><p>Two.</p>')
  assert.ok(!md.includes('TitleOne'), 'headings must not merge into the paragraph')
  assert.ok(/Title\n+One\./.test(md), md)
})

test('entities are decoded so the box is readable', () => {
  assert.equal(htmlToMarkdown('<p>a &amp; b &nbsp;&mdash; c&#8217;s</p>'), 'a & b — c’s')
})

test('malformed html degrades to text and never throws', () => {
  // Same rule as the marker parser: bad input becomes clean output, never junk
  // and never an exception.
  for (const bad of ['<p>unclosed', '<a href="https://x.test">no close', '<<>>', 'plain', '']) {
    assert.doesNotThrow(() => htmlToMarkdown(bad))
  }
  assert.equal(htmlToMarkdown('<a href="https://x.test/a">dangling'), 'dangling')
})

test('an image-only link contributes nothing', () => {
  // "ab" rather than "a b": there is no space in the source either, and
  // inventing one would put a character in somebody's document that they did
  // not write.
  assert.equal(htmlToMarkdown('<p>a<a href="https://x.test"><img src="i.png"></a>b</p>'), 'ab')
})

/* ------------------------------------------------- what counts as length */

test('link syntax does not count against the limit', () => {
  // Markdown is OUR formatting, not the user's writing. A 12,000 character
  // article stays 12,000 characters however many links it carries.
  const plain = 'Ahrefs found 96%.'
  const linked = '[Ahrefs found](https://ahrefs.com/blog/seo-statistics/) 96%.'
  assert.equal(visibleLength(linked), plain.length)
})

test('the visible length is what the reader sees', () => {
  assert.equal(stripLinkSyntax('see [the study](https://x.test/a) now'), 'see the study now')
  assert.equal(visibleLength('see [the study](https://x.test/a) now'), 'see the study now'.length)
})

test('text with no links counts as itself', () => {
  const t = 'No links here at all.'
  assert.equal(visibleLength(t), t.length)
})

test('a bracket that is not a link is left alone', () => {
  const t = 'an aside [like this] and (a note)'
  assert.equal(stripLinkSyntax(t), t)
})
