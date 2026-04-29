export const PADDLE_PLANS = {
  pro_monthly: {
    priceId: process.env.PADDLE_PRO_MONTHLY_PRICE_ID!,
    amount: 500,
    interval: 'month' as const,
    label: 'Pro Monthly',
  },
  pro_annual: {
    priceId: process.env.PADDLE_PRO_ANNUAL_PRICE_ID!,
    amount: 4800,
    interval: 'year' as const,
    label: 'Pro Annual',
  },
} as const

export async function paddleRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`https://api.paddle.com${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Paddle API error ${res.status}: ${text}`)
  }
  return res.json()
}
