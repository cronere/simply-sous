'use client'

export default function DebugPage() {
  return (
    <div style={{
      background: '#1A1612',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'monospace',
      color: '#F8F3EC'
    }}>
      <h1 style={{marginBottom: '2rem', color: '#B8874A'}}>Environment Debug</h1>
      <div style={{background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem'}}>
        <p style={{marginBottom: '1rem'}}>
          <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>{' '}
          <span style={{color: process.env.NEXT_PUBLIC_SUPABASE_URL ? '#8FA889' : '#EF4444'}}>
            {process.env.NEXT_PUBLIC_SUPABASE_URL
              ? '✓ ' + process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 40) + '...'
              : '✗ UNDEFINED — variable not found'}
          </span>
        </p>
        <p>
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>{' '}
          <span style={{color: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '#8FA889' : '#EF4444'}}>
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
              ? '✓ ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...'
              : '✗ UNDEFINED — variable not found'}
          </span>
        </p>
      </div>
      <p style={{color: 'rgba(248,243,236,0.4)', fontSize: '0.85rem'}}>
        Delete app/debug/page.js after debugging.
      </p>
    </div>
  )
}
