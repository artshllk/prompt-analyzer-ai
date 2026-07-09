import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Deepclario - Turn a rough prompt into a great one'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
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
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#f5f1e8',
              color: '#0a0e1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 700,
            }}
          >
            D
          </div>
          <div style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em' }}>
            Deepclario
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              fontSize: '74px',
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              maxWidth: '1000px',
              display: 'flex',
            }}
          >
            Turn a rough prompt into a great one.
          </div>
          <div
            style={{
              fontSize: '30px',
              color: '#a3aabc',
              lineHeight: 1.3,
              maxWidth: '950px',
              display: 'flex',
            }}
          >
            Paste your prompt. Deepclario spots what is missing and rewrites it. First try.
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
          <div style={{ display: 'flex' }}>ChatGPT · Claude · Gemini</div>
          <div style={{ display: 'flex' }}>deepclario.com</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
