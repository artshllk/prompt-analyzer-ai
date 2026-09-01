import { ImageResponse } from 'next/og'

/**
 * The share card.
 *
 * THIS IS THE FIRST AND OFTEN THE ONLY THING A STRANGER SEES. When someone
 * drops deepclario.com into a Reddit thread or a DM, most people who see it
 * never click, so the card has to carry the whole idea on its own.
 *
 * It shows the real mistake the product was built to find, marked the way the
 * product marks it: two swapped words in a published sentence, and what the
 * cited page actually says underneath. Nobody else's card looks like this,
 * because nobody else's card is a proof.
 *
 * LEGIBLE AS A THUMBNAIL is the constraint that decides the layout. A Slack
 * unfurl renders this around 360px wide, roughly a third of full size, so
 * body text sits at 30px and up, the marked words carry both a background AND
 * an underline so they survive being shrunk, and there are exactly two blocks
 * to compare rather than a paragraph to read.
 *
 * Runs on the default Node runtime rather than edge, so it is generated once
 * and cached instead of on every request.
 */
export const alt =
  'Deepclario: a published sentence with two swapped words marked, above the sentence its own source actually contains'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const PAPER = '#F1F0EA'
const CARD = '#FFFFFF'
const INK = '#15130F'
const INK_SOFT = '#6B6559'
const RULE = '#DFDCD2'
const BRAND = '#C9452F'
/* Text colour on the tint. Plain --brand is only 3.99:1 there, so the deeper
   red is used for anything a person has to read. Same rule as globals.css. */
const BRAND_TEXT = '#A93520'
const CONTRADICTED_BG = '#F6E7E3'
const CONFIRM = '#2E6F4E'

function Marked({ children }: { children: string }) {
  return (
    <span
      style={{
        display: 'flex',
        background: CONTRADICTED_BG,
        color: BRAND_TEXT,
        borderRadius: '8px',
        padding: '2px 12px',
        // Satori supports only solid and dashed, never dotted. Dashed reads
        // as the same "check this" gesture at thumbnail size, which is the
        // only size that matters here.
        borderBottom: `3px dashed ${BRAND_TEXT}`,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  )
}

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
          padding: '56px 68px',
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div
            style={{
              fontSize: '58px',
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: '-0.03em',
              maxWidth: '1010px',
              display: 'flex',
            }}
          >
            Does your link say what you think it says?
          </div>

          {/* The published sentence, with the mistake marked. */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '9px',
              background: CARD,
              border: `1px solid ${RULE}`,
              borderRadius: '18px',
              padding: '22px 28px',
              fontSize: '31px',
              lineHeight: 1.45,
              maxWidth: '1030px',
            }}
          >
            <span style={{ display: 'flex' }}>61.5% of</span>
            <Marked>desktop</Marked>
            <span style={{ display: 'flex' }}>searches and 34.4% of</span>
            <Marked>mobile</Marked>
            <span style={{ display: 'flex' }}>searches end without a click.</span>
          </div>

          {/* What the cited page actually contains. */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '7px',
              borderLeft: `4px solid ${CONFIRM}`,
              paddingLeft: '20px',
              maxWidth: '1030px',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: '19px',
                letterSpacing: '0.1em',
                color: CONFIRM,
                fontWeight: 600,
              }}
            >
              THE PAGE THEY LINK TO SAYS
            </div>
            <div style={{ display: 'flex', fontSize: '30px', lineHeight: 1.35 }}>
              61.5% of mobile and 34.3% of desktop.
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '21px',
            color: INK_SOFT,
            borderTop: `1px solid ${RULE}`,
            paddingTop: '20px',
          }}
        >
          <div style={{ display: 'flex' }}>Real, and still published</div>
          <div style={{ display: 'flex' }}>deepclario.com</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
