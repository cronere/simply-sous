'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .auth-root { --ink: #1A1612; --clay: #B8874A; --clay-l: #D4A46A; --parchment: #F8F3EC; --sage-l: #8FA889; min-height: 100vh; background: var(--ink); display: flex; align-items: center; justify-content: center; padding: 24px; font-family: 'Outfit', sans-serif; background-image: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(184,135,74,0.15) 0%, transparent 60%); }
  .auth-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 52px 44px; width: 100%; max-width: 420px; text-align: center; }
  .auth-logo { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 600; color: var(--parchment); margin-bottom: 4px; }
  .auth-logo span { color: var(--clay); font-style: italic; }
  .auth-tagline { font-size: 0.78rem; color: rgba(248,243,236,0.3); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 32px; }
  .auth-title { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 400; color: var(--parchment); margin-bottom: 8px; }
  .auth-sub { font-size: 0.88rem; color: rgba(248,243,236,0.4); margin-bottom: 28px; line-height: 1.6; }
  .auth-label { display: block; text-align: left; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(248,243,236,0.4); margin-bottom: 6px; }
  .auth-field { margin-bottom: 14px; }
  .auth-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 13px 16px; color: var(--parchment); font-family: 'Outfit', sans-serif; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
  .auth-input:focus { border-color: var(--clay); background: rgba(184,135,74,0.05); }
  .auth-input::placeholder { color: rgba(248,243,236,0.15); }
  .auth-btn { width: 100%; background: var(--clay); color: var(--ink); border: none; padding: 14px; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Outfit', sans-serif; margin-top: 8px; }
  .auth-btn:hover:not(:disabled) { background: var(--clay-l); transform: translateY(-1px); }
  .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .auth-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; color: #EF4444; font-size: 0.82rem; padding: 10px 14px; margin-top: 12px; text-align: left; }
  .auth-success { background: rgba(143,168,137,0.1); border: 1px solid rgba(143,168,137,0.25); border-radius: 8px; color: var(--sage-l); font-size: 0.88rem; padding: 16px; margin-top: 12px; text-align: left; line-height: 1.7; }
  .spinner { width: 18px; height: 18px; border: 2px solid rgba(26,22,18,0.2); border-top-color: var(--ink); border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; vertical-align: middle; margin-right: 6px; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else setError('Invalid or expired reset link. Please request a new one.');
    });
  }, []);

  const handleReset = async () => {
    if (!password || !confirm) { setError('Please fill in both fields.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => router.push('/today'), 2500);
    } catch (err) {
      setError(err.message || 'Could not reset password. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-root">
      <style>{styles}</style>
      <div className="auth-card">
        <div className="auth-logo">Simply <span>Sous</span></div>
        <div className="auth-tagline">Dinner, decided.</div>
        <h1 className="auth-title">Set new password</h1>
        <p className="auth-sub">Choose a strong password for your Simply Sous account.</p>
        {success ? (
          <div className="auth-success">✓ Password updated! Taking you to your dashboard...</div>
        ) : (
          <>
            <div className="auth-field">
              <label className="auth-label">New password</label>
              <input className="auth-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={!ready} />
            </div>
            <div className="auth-field">
              <label className="auth-label">Confirm new password</label>
              <input className="auth-input" type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReset()} disabled={!ready} />
            </div>
            <button className="auth-btn" onClick={handleReset} disabled={loading || !ready}>
              {loading ? <><span className="spinner" />Updating...</> : 'Update Password →'}
            </button>
          </>
        )}
        {error && <div className="auth-error">{error}</div>}
      </div>
    </div>
  );
}
