import { ImageResponse } from 'next/og'

/**
 * The share card.
 *
 * This is the first and often the only thing a stranger sees. The old one was
 * a dark gradient with a headline on it, which said nothing a hundred other
 * AI tools' cards do not also say, and it was still on the retired palette.
 *
 * So it shows the product's actual idea instead: a prompt with the tool's own
 * additions marked on it. Amber is a guess you can take back, blue came from
 * your answer. Those two chips are legible at thumbnail size in a Slack
 * unfurl, which is the real test, and nobody else's card looks like it.
 *
 * Runs on the default Node runtime rather than edge, so the image can be
 * generated once and cached instead of on every request.
 */
export const alt =
  'Deepclario: a rewritten prompt with every added constraint marked, and the guesses removable'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const PAPER = '#F1F0EA'
const CARD = '#FFFFFF'
const INK = '#15130F'
const INK_SOFT = '#6B6559'
const RULE = '#DFDCD2'
const BRAND = '#C9452F'
const MACHINE = '#2C5FD4'
const MACHINE_BG = '#E8EEFC'
const GUESS = '#B8791A'
const GUESS_BG = '#FBF1DE'

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
          padding: '64px 72px',
          background: PAPER,
          color: INK,
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: BRAND,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 700,
            }}
          >
            D
          </div>
          <div style={{ fontSize: '25px', fontWeight: 600, letterSpacing: '-0.02em' }}>
            Deepclario
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div
            style={{
              fontSize: '62px',
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: '-0.03em',
              maxWidth: '1000px',
              display: 'flex',
            }}
          >
            It shows you every word it added.
          </div>

          {/* The product, not a description of it. */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '10px',
              background: CARD,
              border: `1px solid ${RULE}`,
              borderRadius: '18px',
              padding: '26px 30px',
              fontSize: '27px',
              lineHeight: 1.5,
              maxWidth: '1010px',
            }}
          >
            <span style={{ display: 'flex' }}>Write a launch email for</span>
            <span
              style={{
                display: 'flex',
                background: MACHINE_BG,
                color: MACHINE,
                borderRadius: '8px',
                padding: '2px 10px',
              }}
            >
              existing free users
            </span>
            <span style={{ display: 'flex' }}>in</span>
            <span
              style={{
                display: 'flex',
                background: GUESS_BG,
                color: GUESS,
                borderRadius: '8px',
                padding: '2px 10px',
              }}
            >
              under 150 words
            </span>
            <span style={{ display: 'flex' }}>, warm but direct.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '26px', fontSize: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', color: INK_SOFT }}>
              <div style={{ display: 'flex', width: '13px', height: '13px', borderRadius: '4px', background: MACHINE }} />
              you answered this
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', color: INK_SOFT }}>
              <div style={{ display: 'flex', width: '13px', height: '13px', borderRadius: '4px', background: GUESS }} />
              we guessed this, remove it
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '20px',
            color: INK_SOFT,
            borderTop: `1px solid ${RULE}`,
            paddingTop: '22px',
          }}
        >
          <div style={{ display: 'flex' }}>For ChatGPT, Claude and Gemini</div>
          <div style={{ display: 'flex' }}>deepclario.com</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
