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
    border-radius:24px;padding:52px 44px;width:100%;max-width:420px;text-align:center}
  .logo{font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:600;color:var(--p);margin-bottom:4px}
  .logo span{color:var(--clay);font-style:italic}
  .tag{font-size:.75rem;color:rgba(248,243,236,.3);letter-spacing:.12em;text-transform:uppercase;margin-bottom:36px}
  .title{font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:400;color:var(--p);margin-bottom:8px}
  .sub{font-size:.88rem;color:rgba(248,243,236,.4);margin-bottom:32px;line-height:1.6}
  .lbl{display:block;text-align:left;font-size:.72rem;font-weight:500;letter-spacing:.08em;
    text-transform:uppercase;color:rgba(248,243,236,.4);margin-bottom:6px}
  .fld{margin-bottom:16px}
  .inp{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
    border-radius:10px;padding:13px 16px;color:var(--p);font-family:'Outfit',sans-serif;
    font-size:.95rem;font-weight:300;outline:none;transition:border-color .2s,background .2s}
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
    color:var(--sl);font-size:.82rem;padding:10px 14px;margin-top:12px;text-align:left}
  .ghost{background:none;border:none;color:var(--clay);font-size:.85rem;cursor:pointer;
    font-family:'Outfit',sans-serif;padding:0}
  .ghost:hover{color:var(--cl)}
  .foot{margin-top:28px;font-size:.8rem;color:rgba(248,243,236,.25)}
  .foot a{color:var(--clay)}
  .sw{margin-top:20px;font-size:.85rem;color:rgba(248,243,236,.35)}
  .sw a{color:var(--clay);cursor:pointer;font-weight:500}
  .sp{width:18px;height:18px;border:2px solid rgba(26,22,18,.2);border-top-color:var(--ink);
    border-radius:50%;animation:spin .7s linear infinite;display:inline-block;vertical-align:middle;margin-right:6px}
  @keyframes spin{to{transform:rotate(360deg)}}
  @media(max-width:480px){.c{padding:36px 20px}}
`

export default function LoginPage() {
  const router = useRouter()
  const [sb, setSb]                 = useState(null)
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [showReset, setShowReset]   = useState(false)
  const [resetSent, setResetSent]   = useState(false)

  useEffect(() => {
    import('../../lib/supabase').then(m => setSb(m.getSupabase()))
  }, [])

  const login = async () => {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    if (!sb) return
    setLoading(true); setError('')
    try {
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (error) throw error
      const { data: { session } } = await sb.auth.getSession()
      const { data: profile } = await sb
        .from('profiles').select('onboarding_complete').eq('id', session.user.id).single()
      router.push(profile?.onboarding_complete ? '/today' : '/onboarding')
    } catch (e) {
      setError(e.message === 'Invalid login credentials'
        ? 'Incorrect email or password.' : e.message || 'Something went wrong.')
    }
    setLoading(false)
  }

  const reset = async () => {
    if (!email) { setError('Enter your email above first.'); return }
    if (!sb) return
    setLoading(true); setError('')
    try {
      await sb.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://app.simplysous.com/reset-password',
      })
      setResetSent(true)
    } catch { setError('Could not send reset email.') }
    setLoading(false)
  }

  return (
    <div className="r">
      <style>{css}</style>
      <div className="c">
        <div className="logo">Simply <span>Sous</span></div>
        <div className="tag">Dinner, decided.</div>

        {!showReset ? (
          <>
            <h1 className="title">Welcome back</h1>
            <p className="sub">Sign in to your kitchen dashboard.</p>
            <div className="fld">
              <label className="lbl">Email</label>
              <input className="inp" type="email" placeholder="you@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && login()} autoComplete="email" />
            </div>
            <div className="fld">
              <label className="lbl">Password</label>
              <input className="inp" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && login()} autoComplete="current-password" />
            </div>
            <button className="btn" onClick={login} disabled={loading || !sb}>
              {loading ? <><span className="sp"/>Signing in...</> : 'Sign In →'}
            </button>
            {error && <div className="err">{error}</div>}
            <div style={{marginTop:'14px',textAlign:'right'}}>
              <button className="ghost" onClick={() => { setShowReset(true); setError('') }}>
                Forgot password?
              </button>
            </div>
            <div className="sw">
              Don&apos;t have an account?{' '}
              <a onClick={() => router.push('/signup')}>Sign up free →</a>
            </div>
          </>
        ) : (
          <>
            <h1 className="title">Reset password</h1>
            <p className="sub">Enter your email and we&apos;ll send a reset link.</p>
            <div className="fld">
              <label className="lbl">Email</label>
              <input className="inp" type="email" placeholder="you@email.com"
                value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </div>
            {!resetSent
              ? <button className="btn" onClick={reset} disabled={loading || !sb}>
                  {loading ? <><span className="sp"/>Sending...</> : 'Send Reset Link →'}
                </button>
              : <div className="ok">✓ Reset link sent to {email}. Check your inbox.</div>
            }
            {error && <div className="err">{error}</div>}
            <div style={{marginTop:'14px'}}>
              <button className="ghost" onClick={() => { setShowReset(false); setResetSent(false); setError('') }}>
                ← Back to sign in
              </button>
            </div>
          </>
        )}
        <div className="foot">
          Need help? <a href="mailto:hello@simplysous.com">hello@simplysous.com</a>
        </div>
      </div>
    </div>
  )
}
