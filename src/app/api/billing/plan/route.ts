import { NextResponse } from 'next/server'
import { viewerPlan } from '@/lib/db/viewer-plan'

/**
 * Which of the four pricing states the viewer is in, and when they renew.
 *
 * WHY THIS EXISTS AS A ROUTE. /pricing used to call viewerPlan() during the
 * server render. It reads cookies, so it opted the whole page out of static
 * rendering, which also meant the Paddle call next to it ran on every single
 * request. The rest of that page is identical for everyone.
 *
 * EditorialPricing renders `anon` until this answers. That is the same
 * fallback viewerPlan() already uses on any error, and it is the safe
 * direction for the same reason: showing a sign-up button to someone signed
 * in is a wrong link, while guessing `pro` would hide the way to buy from a
 * paying customer.
 *
 * The price itself is NOT here. It comes from foundingSeatsLeft() on the
 * server, so the number never changes under the reader after paint.
 */
export async function GET() {
  return NextResponse.json(await viewerPlan())
}
