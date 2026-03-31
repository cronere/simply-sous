'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .auth-root {
    --ink: #1A1612; --clay: #B8874A; --clay-l: #D4A46A;
    --parchment: #F8F3EC; --sage-l: #8FA889;
    min-height: 100vh; background: var(--ink);
    display: flex; align-items: center; justify-content: center;
    padding: 24px; font-family: 'Outfit', sans-serif;
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(184,135,74,0.15) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 85% 85%, rgba(192,92,48,0.08) 0%, transparent 50%);
  }
  .auth-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 48px 44px; width: 100%; max-width: 440px; text-align: center; }
  .auth-logo { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 600; color: var(--parchment); margin-bottom: 4px; }
  .auth-logo span { color: var(--clay); font-style: italic; }
  .auth-tagline { font-size: 0.78rem; color: rgba(248,243,236,0.3); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 28px; }
  .auth-title { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 400; color: var(--parchment); margin-bottom: 8px; }
  .auth-sub { font-size: 0.88rem; color: rgba(248,243,236,0.4); margin-bottom: 24px; line-height: 1.6; }
  .auth-label { display: block; text-align: left; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(248,243,236,0.4); margin-bottom: 6px; }
  .auth-field { margin-bottom: 14px; }
  .auth-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 13px 16px; color: var(--parchment); font-family: 'Outfit', sans-serif; font-size: 0.95rem; font-weight: 300; outline: none; transition: border-color 0.2s; }
  .auth-input:focus { border-color: var(--clay); background: rgba(184,135,74,0.05); }
  .auth-input::placeholder { color: rgba(248,243,236,0.15); }
  .auth-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .auth-btn { width: 100%; background: var(--clay); color: var(--ink); border: none; padding: 14px; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Outfit', sans-serif; margin-top: 8px; }
  .auth-btn:hover:not(:disabled) { background: var(--clay-l); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(184,135,74,0.3); }
  .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .auth-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; color: #EF4444; font-size: 0.82rem; padding: 10px 14px; margin-top: 12px; text-align: left; }
  .auth-success { background: rgba(143,168,137,0.1); border: 1px solid rgba(143,168,137,0.25); border-radius: 8px; color: var(--sage-l); font-size: 0.88rem; padding: 16px; margin-top: 12px; text-align: left; line-height: 1.7; }
  .trial-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(143,168,137,0.1); border: 1px solid rgba(143,168,137,0.2); color: var(--sage-l); font-size: 0.72rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 12px; border-radius: 2rem; margin-bottom: 20px; }
  .auth-terms { font-size: 0.75rem; color: rgba(248,243,236,0.25); margin-top: 14px; line-height: 1.6; }
  .auth-terms a { color: var(--clay); text-decoration: none; }
  .auth-switch { margin-top: 20px; font-size: 0.85rem; color: rgba(248,243,236,0.35); }
  .auth-switch a { color: var(--clay); cursor: pointer; font-weight: 500; }
  .spinner { width: 18px; height: 18px; border: 2px solid rgba(26,22,18,0.2); border-top-color: var(--ink); border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; vertical-align: middle; margin-right: 6px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 480px) { .auth-card { padding: 36px 20px; } .auth-row { grid-template-columns: 1fr; } }
`;

let supabaseClient = null;
function getSupabase() {
  if (typeof window === 'undefined') return null;
  if (supabaseClient) return supabaseClient;
  const { createClient } = require('@supabase/supabase-js');
  supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return supabaseClient;
}

export default function SignupPage() {
  const router = useRouter();
  const [mounted, setMounted]     = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSignup = async () => {
    if (!firstName || !email || !password || !confirm) { setError('Please fill in all required fields.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const { error } = await getSupabase().auth.signUp({
        email, password,
        options: {
          data: { full_name: `${firstName} ${lastName}`.trim() },
          emailRedirectTo: 'https://app.simplysous.com/onboarding',
        },
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setError(err.message?.includes('already registered')
        ? 'An account with this email already exists. Try signing in instead.'
        : err.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  if (!mounted) return (
    <div style={{ minHeight:'100vh', background:'#1A1612', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:20, height:20, border:'2px solid rgba(184,135,74,0.2)', borderTopColor:'#B8874A', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (success) return (
    <div className="auth-root">
      <style>{styles}</style>
      <div className="auth-card">
        <div className="auth-logo">Simply <span>Sous</span></div>
        <div className="auth-tagline">Dinner, decided.</div>
        <div style={{ fontSize:'3rem', margin:'20px 0' }}>📬</div>
        <h1 className="auth-title">Check your inbox</h1>
        <p className="auth-sub">We&apos;ve sent a confirmation to <strong style={{ color:'var(--parchment)' }}>{email}</strong>. Click the link to start your free trial.</p>
        <div className="auth-success">✓ Once confirmed, you&apos;ll be taken through a quick 5-minute setup to personalize Simply Sous for your family.</div>
        <div className="auth-switch" style={{ marginTop:'24px' }}>Already confirmed? <a onClick={() => router.push('/login')}>Sign in →</a></div>
      </div>
    </div>
  );

  return (
    <div className="auth-root">
      <style>{styles}</style>
      <div className="auth-card">
        <div className="auth-logo">Simply <span>Sous</span></div>
        <div className="auth-tagline">Dinner, decided.</div>
        <div className="trial-badge">✓ 14-day free trial · No credit card</div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">Join and end the dinner question forever.</p>
        <div className="auth-row">
          <div className="auth-field">
            <label className="auth-label">First name *</label>
            <input className="auth-input" type="text" placeholder="Jane" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
          </div>
          <div className="auth-field">
            <label className="auth-label">Last name</label>
            <input className="auth-input" type="text" placeholder="Smith" value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" />
          </div>
        </div>
        <div className="auth-field">
          <label className="auth-label">Email *</label>
          <input className="auth-input" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="auth-field">
          <label className="auth-label">Password * (8+ characters)</label>
          <input className="auth-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
        </div>
        <div className="auth-field">
          <label className="auth-label">Confirm password *</label>
          <input className="auth-input" type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignup()} autoComplete="new-password" />
        </div>
        <button className="auth-btn" onClick={handleSignup} disabled={loading}>
          {loading ? <><span className="spinner" />Creating account...</> : 'Start Free Trial →'}
        </button>
        {error && <div className="auth-error">{error}</div>}
        <p className="auth-terms">By signing up you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</p>
        <div className="auth-switch">Already have an account? <a onClick={() => router.push('/login')}>Sign in →</a></div>
      </div>
    </div>
  );
}
