import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// POST /api/webhooks/bachs
// Point this at your Bachs Developer Portal → Webhooks → Add destination.
// This is the ONLY place that should mark a payment as fulfilled — never the
// browser overlay event, never the return_url redirect. See:
// https://docs.bachs.io/guides/webhooks/overview

const TOLERANCE_SECONDS = 300

function verifySignature(
  rawBody: string,
  secret: string,
  timestampHeader: string | null,
  signatureHeader: string | null,
): boolean {
  if (!timestampHeader || !signatureHeader) return false

  const timestamp = parseInt(timestampHeader, 10)
  if (Number.isNaN(timestamp)) return false

  // Reject stale/replayed deliveries
  if (Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) return false

  const message = `${timestamp}.${rawBody}`
  const expected = crypto.createHmac('sha256', secret).update(message, 'utf8').digest('hex')

  const expectedBuf = Buffer.from(expected)
  const actualBuf = Buffer.from(signatureHeader)
  if (expectedBuf.length !== actualBuf.length) return false

  return crypto.timingSafeEqual(expectedBuf, actualBuf)
}

export async function POST(req: NextRequest) {
  // Read the raw body BEFORE any JSON parsing — re-serializing breaks the signature.
  const rawBody = await req.text()

  const isValid = verifySignature(
    rawBody,
    process.env.BACHS_WEBHOOK_SECRET!,
    req.headers.get('X-Bachs-Timestamp'),
    req.headers.get('X-Bachs-Signature'),
  )

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(rawBody)

  // TODO: dedupe on event.id — Bachs guarantees at-least-once delivery,
  // so the same event may arrive more than once.

  switch (event.type) {
    case 'collection.succeeded': {
      const { charge_id, checkout_id, amount, currency } = event.data
      // TODO: mark the order paid in your DB, send a receipt, grant access, etc.
      console.log('Payment succeeded', { charge_id, checkout_id, amount, currency })
      break
    }

    case 'collection.failed':
    case 'collection.abandoned':
    case 'collection.underpaid':
      // TODO: handle as appropriate — e.g. notify the customer
      console.log('Payment did not complete', event.type, event.data)
      break

    default:
      console.log('Unhandled Bachs event', event.type)
  }

  return NextResponse.json({ received: true })
  }
