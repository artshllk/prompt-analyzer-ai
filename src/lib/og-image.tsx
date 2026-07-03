// Reusable OG image renderer. Each blog post and prompt page imports
// this and passes its title + eyebrow text. Keeps the 12 blog post
// opengraph-image.tsx files tiny.

import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 } as const

/**
 * Default og:image metadata entry. Any page that sets its own
 * `openGraph` object replaces the root layout's openGraph entirely
 * (Next does not deep-merge it), so pages without a sibling
 * opengraph-image.tsx file must spread this into their `images` field
 * or they silently ship with no image (confirmed via LinkedIn Post
 * Inspector reporting "No image found" on the homepage and pricing).
 */
export function defaultOGImage(alt: string) {
  return [{ url: '/opengraph-image', ...OG_SIZE, alt }]
}

export function renderOGImage({
  eyebrow,
  title,
}: {
  eyebrow: string
  title: string
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: 'linear-gradient(135deg, #0a0e1a 0%, #131826 100%)',
          color: '#f5f1e8',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '11px',
              background: '#f5f1e8',
              color: '#0a0e1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              fontWeight: 700,
            }}
          >
            D
          </div>
          <div style={{ fontSize: '26px', fontWeight: 500, letterSpacing: '-0.02em' }}>
            Deepclario
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              fontSize: '22px',
              color: '#7c8398',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 600,
              display: 'flex',
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontSize: '68px',
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              maxWidth: '1000px',
              display: 'flex',
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '20px',
            color: '#7c8398',
            borderTop: '1px solid #2a3045',
            paddingTop: '24px',
          }}
        >
          <div style={{ display: 'flex' }}>Prompt analyzer for ChatGPT, Claude, Gemini</div>
          <div style={{ display: 'flex' }}>deepclario.com</div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  )
}
