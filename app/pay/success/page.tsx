export default function Success() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0b14',
        color: '#ecebf5',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <div>
        <h1 style={{ fontWeight: 500, fontSize: 22, marginBottom: 8 }}>Payment received</h1>
        <p style={{ color: '#8d8fa6', fontSize: 14 }}>
          Thank you — a confirmation is on its way.
        </p>
      </div>
    </main>
  )
}

