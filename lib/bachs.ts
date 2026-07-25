const BACHS_BASE_URL =
  process.env.BACHS_ENV === 'live'
    ? 'https://api.bachs.io'
    : 'https://sandbox-api.bachs.io'

/**
 * Thin wrapper around the Bachs REST API. Server-side only — BACHS_API_KEY
 * must never reach the browser.
 */
export async function bachsFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BACHS_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.BACHS_API_KEY}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  const body = await res.json()

  if (!res.ok) {
    // Bachs error shape: { detail, error_code, errors? }
    throw new Error(body.detail ?? `Bachs request failed (${res.status})`)
  }

  return body
}

