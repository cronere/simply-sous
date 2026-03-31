'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  .r{--ink:#1A1612;--clay:#B8874A;--cl:#D4A46A;--p:#F8F3EC;--sl:#8FA889;
    min-height:100vh;background:var(--ink);display:flex;align-items:center;
    justify-content:center;padding:24px;font-family:'Outfit',sans-serif;
    background-image:radial-gradient(ellipse 80% 50% at 50% -10%,rgba(184,135,74,.15) 0%,transparent 60%),
    radial-gradient(ellipse 50% 40% at 85% 85%,rgba(192,92,48,.08) 0%,transparent 50%)}
  .c{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
    border-radius:24px;padding:48px 44px;width:100%;max-width:440px;text-align:center}
  .logo{font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:600;color:var(--p);margin-bottom:4px}
  .logo span{color:var(--clay);font-style:italic}
  .tag{font-size:.75rem;color:rgba(248,243,236,.3);letter-spacing:.12em;text-transform:uppercase;margin-bottom:28px}
  .badge{display:inline-flex;align-items:center;gap:6px;background:rgba(143,168,137,.1);
    border:1px solid rgba(143,168,137,.2);color:var(--sl);font-size:.72rem;font-weight:500;
    letter-spacing:.1em;text-transform:uppercase;padding:5px 12px;border-radius:2rem;margin-bottom:20px}
  .title{font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:400;color:var(--p);margin-bottom:8px}
  .sub{font-size:.88rem;color:rgba(248,243,236,.4);margin-bottom:24px;line-height:1.6}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .lbl{display:block;text-align:left;font-size:.72rem;font-weight:500;letter-spacing:.08em;
    text-transform:uppercase;color:rgba(248,243,236,.4);margin-bottom:6px}
  .fld{margin-bottom:14px}
  .inp{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
    border-radius:10px;padding:13px 16px;color:var(--p);font-family:'Outfit',sans-serif;
    font-size:.95rem;font-weight:300;outline:none;transition:border-color .2s}
  .inp:focus{border-color:var(--clay);background:rgba(184,135,74,.05)}
  .inp::placeholder{color:rgba(248,243,236,.15)}
  .btn{width:100%;background:var(--clay);color:var(--ink);border:none;padding:14px;
    border-radius:10px;font-size:.95rem;font-weight:600;cursor:pointer;
    transition:all .2s;font-family:'Outfit',sans-serif;margin-top:8px}
  .btn:hover:not(:disabled){background:var(--cl);transform:translateY(-1px);box-shadow:0 8px 24px rgba(184,135,74,.3)}
  .btn:disabled{opacity:.6;cursor:not-allowed}
  .err{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;
    color:#EF4444;font-size:.82rem;padding:10px 14px;margin-top:12px;text-align:left}
  .ok{background:rgba(143,168,137,.1);border:1px solid rgba(143,168,137,.25);border-radius:8px;
    color:var(--sl);font-size:.88rem;padding:16px;margin-top:12px;text-align:left;line-height:1.7}
  .terms{font-size:.75rem;color:rgba(248,243,236,.25);margin-top:14px;line-height:1.6}
  .terms a{color:var(--clay)}
  .sw{margin-top:20px;font-size:.85rem;color:rgba(248,243,236,.35)}
  .sw a{color:var(--clay);cursor:pointer;font-weight:500}
  .sp{width:18px;height:18px;border:2px solid rgba(26,22,18,.2);border-top-color:var(--ink);
    border-radius:50%;animation:spin .7s linear infinite;display:inline-block;vertical-align:middle;margin-right:6px}
  @keyframes spin{to{transform:rotate(360deg)}}
  @media(max-width:480px){.c{padding:36px 20px}.row{grid-template-columns:1fr}}
`

export default function SignupPage() {
  const router = useRouter()
  const [sb, setSb]             = useState(null)
  const [first, setFirst]       = useState('')
  const [last, setLast]         = useState('')
  const [email, setEmail]       = useState('')
  const [pass, setPass]         = useState('')
  const [conf, setConf]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [done, setDone]         = useState(false)

  useEffect(() => {
    import('../../lib/supabase').then(m => setSb(m.getSupabase()))
  }, [])

  const signup = async () => {
    if (!first || !email || !pass || !conf) { setError('Please fill in all required fields.'); return }
    if (pass.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (pass !== conf) { setError('Passwords do not match.'); return }
    if (!sb) return
    setLoading(true); setError('')
    try {
      const { error } = await sb.auth.signUp({
        email, password: pass,
        options: {
          data: { full_name: `${first} ${last}`.trim() },
          emailRedirectTo: 'https://app.simplysous.com/onboarding',
        },
      })
      if (error) throw error
      setDone(true)
    } catch (e) {
      setError(e.message?.includes('already registered')
        ? 'An account with this email exists. Try signing in.'
        : e.message || 'Something went wrong.')
    }
    setLoading(false)
  }

  if (done) return (
    <div className="r">
      <style>{css}</style>
      <div className="c">
        <div className="logo">Simply <span>Sous</span></div>
        <div className="tag">Dinner, decided.</div>
        <div style={{fontSize:'3rem',margin:'20px 0'}}>📬</div>
        <h1 className="title">Check your inbox</h1>
        <p className="sub">We sent a confirmation to <strong style={{color:'var(--p)'}}>{email}</strong>. Click the link to start your free trial.</p>
        <div className="ok">✓ Once confirmed, a quick 5-minute setup will personalize Simply Sous for your family.</div>
        <div className="sw" style={{marginTop:'24px'}}>Already confirmed? <a onClick={() => router.push('/login')}>Sign in →</a></div>
      </div>
    </div>
  )

  return (
    <div className="r">
      <style>{css}</style>
      <div className="c">
        <div className="logo">Simply <span>Sous</span></div>
        <div className="tag">Dinner, decided.</div>
        <div className="badge">✓ 14-day free trial · No credit card</div>
        <h1 className="title">Create your account</h1>
        <p className="sub">End the dinner question forever.</p>
        <div className="row">
          <div className="fld">
            <label className="lbl">First name *</label>
            <input className="inp" type="text" placeholder="Jane" value={first}
              onChange={e => setFirst(e.target.value)} autoComplete="given-name" />
          </div>
          <div className="fld">
            <label className="lbl">Last name</label>
            <input className="inp" type="text" placeholder="Smith" value={last}
              onChange={e => setLast(e.target.value)} autoComplete="family-name" />
          </div>
        </div>
        <div className="fld">
          <label className="lbl">Email *</label>
          <input className="inp" type="email" placeholder="you@email.com" value={email}
            onChange={e => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="fld">
          <label className="lbl">Password * (8+ characters)</label>
          <input className="inp" type="password" placeholder="••••••••" value={pass}
            onChange={e => setPass(e.target.value)} autoComplete="new-password" />
        </div>
        <div className="fld">
          <label className="lbl">Confirm password *</label>
          <input className="inp" type="password" placeholder="••••••••" value={conf}
            onChange={e => setConf(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && signup()} autoComplete="new-password" />
        </div>
        <button className="btn" onClick={signup} disabled={loading || !sb}>
          {loading ? <><span className="sp"/>Creating account...</> : 'Start Free Trial →'}
        </button>
        {error && <div className="err">{error}</div>}
        <p className="terms">By signing up you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</p>
        <div className="sw">Already have an account? <a onClick={() => router.push('/login')}>Sign in →</a></div>
      </div>
    </div>
  )
}
