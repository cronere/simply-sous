'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  .r{--ink:#1A1612;--clay:#B8874A;--cl:#D4A46A;--p:#F8F3EC;--sl:#8FA889;
    min-height:100vh;background:var(--ink);display:flex;align-items:center;
    justify-content:center;padding:24px;font-family:'Outfit',sans-serif;
    background-image:radial-gradient(ellipse 80% 50% at 50% -10%,rgba(184,135,74,.15) 0%,transparent 60%)}
  .c{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
    border-radius:24px;padding:52px 44px;width:100%;max-width:420px;text-align:center}
  .logo{font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:600;color:var(--p);margin-bottom:4px}
  .logo span{color:var(--clay);font-style:italic}
  .tag{font-size:.75rem;color:rgba(248,243,236,.3);letter-spacing:.12em;text-transform:uppercase;margin-bottom:32px}
  .title{font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:400;color:var(--p);margin-bottom:8px}
  .sub{font-size:.88rem;color:rgba(248,243,236,.4);margin-bottom:28px;line-height:1.6}
  .lbl{display:block;text-align:left;font-size:.72rem;font-weight:500;letter-spacing:.08em;
    text-transform:uppercase;color:rgba(248,243,236,.4);margin-bottom:6px}
  .fld{margin-bottom:14px}
  .inp{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
    border-radius:10px;padding:13px 16px;color:var(--p);font-family:'Outfit',sans-serif;
    font-size:.95rem;outline:none;transition:border-color .2s}
  .inp:focus{border-color:var(--clay);background:rgba(184,135,74,.05)}
  .inp::placeholder{color:rgba(248,243,236,.15)}
  .inp:disabled{opacity:.4}
  .btn{width:100%;background:var(--clay);color:var(--ink);border:none;padding:14px;
    border-radius:10px;font-size:.95rem;font-weight:600;cursor:pointer;
    transition:all .2s;font-family:'Outfit',sans-serif;margin-top:8px}
  .btn:hover:not(:disabled){background:var(--cl);transform:translateY(-1px)}
  .btn:disabled{opacity:.6;cursor:not-allowed}
  .err{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;
    color:#EF4444;font-size:.82rem;padding:10px 14px;margin-top:12px;text-align:left}
  .ok{background:rgba(143,168,137,.1);border:1px solid rgba(143,168,137,.25);border-radius:8px;
    color:var(--sl);font-size:.88rem;padding:16px;margin-top:12px;text-align:left;line-height:1.7}
  .sp{width:18px;height:18px;border:2px solid rgba(26,22,18,.2);border-top-color:var(--ink);
    border-radius:50%;animation:spin .7s linear infinite;display:inline-block;vertical-align:middle;margin-right:6px}
  @keyframes spin{to{transform:rotate(360deg)}}
`

export default function ResetPasswordPage() {
  const router = useRouter()
  const [sb, setSb]           = useState(null)
  const [ready, setReady]     = useState(false)
  const [pass, setPass]       = useState('')
  const [conf, setConf]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)

  useEffect(() => {
    import('@supabase/supabase-js').then(({ createClient }) => {
      const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      setSb(client)
      client.auth.getSession().then(({ data: { session } }) => {
        if (session) setReady(true)
        else setError('Invalid or expired reset link. Please request a new one.')
      })
    })
  }, [])

  const update = async () => {
    if (!pass || !conf) { setError('Please fill in both fields.'); return }
    if (pass.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (pass !== conf) { setError('Passwords do not match.'); return }
    if (!sb) return
    setLoading(true); setError('')
    try {
      const { error } = await sb.auth.updateUser({ password: pass })
      if (error) throw error
      setDone(true)
      setTimeout(() => router.push('/today'), 2500)
    } catch (e) { setError(e.message || 'Could not reset password.') }
    setLoading(false)
  }

  return (
    <div className="r">
      <style>{css}</style>
      <div className="c">
        <div className="logo">Simply <span>Sous</span></div>
        <div className="tag">Dinner, decided.</div>
        <h1 className="title">Set new password</h1>
        <p className="sub">Choose a strong password for your Simply Sous account.</p>
        {done ? (
          <div className="ok">✓ Password updated! Taking you to your dashboard...</div>
        ) : (
          <>
            <div className="fld">
              <label className="lbl">New password</label>
              <input className="inp" type="password" placeholder="••••••••"
                value={pass} onChange={e => setPass(e.target.value)} disabled={!ready} />
            </div>
            <div className="fld">
              <label className="lbl">Confirm new password</label>
              <input className="inp" type="password" placeholder="••••••••"
                value={conf} onChange={e => setConf(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && update()} disabled={!ready} />
            </div>
            <button className="btn" onClick={update} disabled={loading || !ready || !sb}>
              {loading ? <><span className="sp"/>Updating...</> : 'Update Password →'}
            </button>
          </>
        )}
        {error && <div className="err">{error}</div>}
      </div>
    </div>
  )
}
