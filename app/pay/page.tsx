'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    Bachs: any
  }
}

type Status = 'idle' | 'creating' | 'redirecting' | 'error'

export default function PayPage() {
  const [amount, setAmount] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const sdkReady = useRef(false)

  useEffect(() => {
    if (document.getElementById('bachs-js')) {
      sdkReady.current = true
      return
    }
    const script = document.createElement('script')
    script.id = 'bachs-js'
    script.src = 'https://checkout.bachs.io/bachs.js'
    script.onload = () => {
      window.Bachs.Initialize({
        onEvent: (event: { type: string; data: any }) => {
          if (event.type === 'checkout.completed') {
            setStatus('idle')
          }
          if (event.type === 'checkout.failed' || event.type === 'checkout.error') {
            setStatus('error')
            setError('Payment did not complete. Please try again.')
          }
          if (event.type === 'checkout.closed') {
            setStatus((s) => (s === 'redirecting' ? 'idle' : s))
          }
        },
      })
      sdkReady.current = true
    }
    document.body.appendChild(script)
  }, [])

  async function handlePay() {
    setError(null)
    const value = Number(amount)
    if (!amount || Number.isNaN(value) || value <= 0) {
      setError('Enter an amount to continue.')
      return
    }

    setStatus('creating')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: value.toFixed(2), email: email || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not start checkout')

      setStatus('redirecting')
      window.Bachs.Checkout.open({ checkoutUrl: data.checkout_url })
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <main className="wrap">
      <div className="void" aria-hidden="true" />

      <div className="card">
        <div className="mark">AETHERIS</div>

        <label className="fieldLabel" htmlFor="amount">
          Amount
        </label>
        <div className="amountRow">
          <span className="currency">$</span>
          <input
            id="amount"
            className="amountInput"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, '')
              setAmount(v)
            }}
          />
        </div>

        <label className="fieldLabel" htmlFor="email">
          Email <span className="optional">(for your receipt)</span>
        </label>
        <input
          id="email"
          className="emailInput"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          className="payButton"
          onClick={handlePay}
          disabled={status === 'creating' || status === 'redirecting'}
        >
          {status === 'creating'
            ? 'Preparing…'
            : status === 'redirecting'
              ? 'Opening payment…'
              : 'Pay'}
        </button>

        {error && <p className="errorText">{error}</p>}

        <p className="footNote">Secured by Bachs · card, bank transfer, mobile money, stablecoin</p>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,400&family=Inter:wght@400;500;600&display=swap');

        html,
        body {
          margin: 0;
          padding: 0;
          background: #0a0b14;
        }
      `}</style>

      <style jsx>{`
        .wrap {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', system-ui, sans-serif;
          padding: 24px;
          overflow: hidden;
        }

        .void {
          position: absolute;
          inset: 0;
          background: radial-gradient(
              60% 50% at 50% 35%,
              rgba(157, 178, 255, 0.14) 0%,
              rgba(10, 11, 20, 0) 70%
            ),
            #0a0b14;
        }

        .card {
          position: relative;
          width: 100%;
          max-width: 380px;
          background: #12131f;
          border: 1px solid rgba(201, 169, 106, 0.22);
          border-radius: 4px;
          padding: 40px 32px 32px;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5);
        }

        .mark {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          letter-spacing: 0.28em;
          font-size: 13px;
          color: #8d8fa6;
          text-align: center;
          margin-bottom: 32px;
        }

        .fieldLabel {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #8d8fa6;
          margin-bottom: 8px;
        }

        .optional {
          text-transform: none;
          letter-spacing: normal;
          color: #5d5f74;
        }

        .amountRow {
          display: flex;
          align-items: baseline;
          gap: 6px;
          border-bottom: 1px solid rgba(201, 169, 106, 0.35);
          padding-bottom: 10px;
          margin-bottom: 24px;
          transition: border-color 0.3s ease;
        }

        .amountRow:focus-within {
          border-color: #c9a96a;
        }

        .currency {
          font-family: 'Fraunces', serif;
          font-size: 28px;
          color: #8d8fa6;
        }

        .amountInput {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'Fraunces', serif;
          font-weight: 500;
          font-size: 40px;
          color: #ecebf5;
          text-shadow: 0 0 24px rgba(157, 178, 255, 0.35);
          width: 100%;
        }

        .amountInput::placeholder {
          color: #3f4155;
          text-shadow: none;
        }

        .emailInput {
          width: 100%;
          box-sizing: border-box;
          background: #0e0f18;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          padding: 12px 14px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: #ecebf5;
          margin-bottom: 28px;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .emailInput:focus {
          border-color: rgba(157, 178, 255, 0.5);
        }

        .payButton {
          width: 100%;
          background: #9db2ff;
          color: #0a0b14;
          border: none;
          border-radius: 3px;
          padding: 14px;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: filter 0.2s ease;
        }

        .payButton:hover:not(:disabled) {
          filter: brightness(1.08);
        }

        .payButton:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .errorText {
          color: #ff8a8a;
          font-size: 13px;
          margin-top: 12px;
          text-align: center;
        }

        .footNote {
          text-align: center;
          font-size: 11px;
          color: #5d5f74;
          margin-top: 24px;
          margin-bottom: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .payButton,
          .amountRow,
          .emailInput {
            transition: none;
          }
        }
      `}</style>
    </main>
  )
}

