import { NextRequest, NextResponse } from 'next/server'
import { bachsFetch } from '@/lib/bachs'

// POST /api/checkout
// Body: { amount: string, email?: string }
//
// The product behind BACHS_PRODUCT_ID must be a custom-priced product
// (`custom_amount_enabled: true` / `price_type: "custom"`) — see
// https://docs.bachs.io/guides/products/overview. If it's fixed-priced,
// Bachs will reject the `amount` override.
export async function POST(req: NextRequest) {
  const { amount, email } = await req.json()

  // Basic server-side sanity check before it ever reaches Bachs.
  // Amounts are decimal strings at currency precision, e.g. "29.00" — never minor units.
  const parsed = Number(amount)
  if (!amount || Number.isNaN(parsed) || parsed <= 0) {
    return NextResponse.json({ error: 'Enter a valid amount' }, { status: 400 })
  }

  try {
    const session = await bachsFetch('/v1/checkout-sessions', {
      method: 'POST',
      body: JSON.stringify({
        product_cart: [
          {
            product_id: process.env.BACHS_PRODUCT_ID,
            quantity: 1,
            amount: parsed.toFixed(2), // locked in server-side; the browser can't change it after this
          },
        ],
        customer: email ? { email } : undefined,
        return_url: `${process.env.APP_URL}/pay/success`,
        cancel_url: `${process.env.APP_URL}/pay`,
      }),
    })

    // Only the checkout_url goes back to the client — nothing else.
    return NextResponse.json({ checkout_url: session.checkout_url })
  } catch (err) {
    console.error('Bachs checkout session creation failed', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unable to start checkout' },
      { status: 500 },
    )
  }
}
