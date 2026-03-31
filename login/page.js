'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .auth-root {
    --ink: #1A1612;
    --clay: #B8874A;
    --clay-l: #D4A46A;
    --ember: #C05C30;
    --parchment: #F8F3EC;
    --warm: #F2EBE0;
    --sand: #E2D5C3;
    --mid: #7A6C5E;
    --light: #B5A898;
    min-height: 100vh;
    background: var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font-family: 'Outfit', sans-serif;
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(184,135,74,0.15) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 85% 85%, rgba(192,92,48,0.08) 0%, transparent 50%);
  }

  .auth-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px;
    padding: 52px 44px;
    width: 100%;
    max-width: 420px;
    text-align: center;
  }

  .auth-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--parchment);
    margin-bottom: 4px;
    letter-spacing: 0.01em;
  }

  .auth-logo span {
    color: var(--clay);
    font-style: italic;
  }

  .auth-tagline {
    font-size: 0.78rem;
    color: rgba(248,243,236,0.3);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 36px;
    font-family: 'Outfit', sans-serif;
    font-weight: 400;
  }

  .auth-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem;
    font-weight: 400;
    color: var(--parchment);
    margin-bottom: 8px;
    line-height: 1.2;
  }

  .auth-sub {
    font-size: 0.88rem;
    color: rgba(248,243,236,0.4);
    margin-bottom: 32px;
    line-height: 1.6;
  }

  .auth-label {
    display: block;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(248,243,236,0.4);
    margin-bottom: 6px;
  }

  .auth-field {
    margin-bottom: 16px;
  }

  .auth-input {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 13px 16px;
    color: var(--parchment);
    font-family: 'Outfit', sans-serif;
    font-size: 0.95rem;
    font-weight: 300;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
  }

  .auth-input:focus {
    border-color: var(--clay);
    background: rgba(184,135,74,0.05);
  }

  .auth-input::placeholder {
    color: rgba(248,243,236,0.15);
  }

  .auth-btn {
    width: 100%;
    background: var(--clay);
    color: var(--ink);
    border: none;
    padding: 14px;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Outfit', sans-serif;
    margin-top: 8px;
    letter-spacing: 0.03em;
  }

  .auth-btn:hover:not(:disabled) {
    background: var(--clay-l);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(184,135,74,0.3);
  }

  .auth-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .auth-error {
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: 8px;
    color: #EF4444;
    font-size: 0.82rem;
    padding: 10px 14px;
    margin-top: 12px;
    text-align: left;
    line-height: 1.5;
  }

  .auth-success {
    background: rgba(143,168,137,0.1);
    border: 1px solid rgba(143,168,137,0.25);
    border-radius: 8px;
    color: var(--sage-l, #8FA889);
    font-size: 0.82rem;
    padding: 10px 14px;
    margin-top: 12px;
    text-align: left;
    line-height: 1.6;
  }

  .auth-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 24px 0;
  }

  .auth-divider::before,
  .auth-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.07);
  }

  .auth-divider span {
    font-size: 0.72rem;
    color: rgba(248,243,236,0.25);
    letter-spacing: 0.08em;
  }

  .auth-link-btn {
    background: none;
    border: none;
    color: var(--clay);
    font-size: 0.85rem;
    cursor: pointer;
    font-family: 'Outfit', sans-serif;
    transition: color 0.2s;
    padding: 0;
  }

  .auth-link-btn:hover { color: var(--clay-l); }

  .auth-footer {
    margin-top: 28px;
    font-size: 0.8rem;
    color: rgba(248,243,236,0.25);
    line-height: 1.6;
  }

  .auth-footer a {
    color: var(--clay);
    text-decoration: none;
  }

  .auth-footer a:hover { color: var(--clay-l); }

  .auth-switch {
    margin-top: 20px;
    font-size: 0.85rem;
    color: rgba(248,243,236,0.35);
  }

  .auth-switch a {
    color: var(--clay);
    cursor: pointer;
    text-decoration: none;
    font-weight: 500;
  }

  .auth-switch a:hover { color: var(--clay-l); }

  .spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(26,22,18,0.2);
    border-top-color: var(--ink);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
    vertical-align: middle;
    margin-right: 6px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 480px) {
    .auth-card { padding: 36px 24px; }
  }
`;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showReset, setShowReset]   = useState(false);
  const [resetSent, setResetSent]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Check onboarding status
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', session.user.id)
        .single();

      if (profile?.onboarding_complete) {
        router.push('/today');
      } else {
        router.push('/onboarding');
      }
      router.refresh();
    } catch (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : err.message || 'Something went wrong. Please try again.'
      );
    }
    setLoading(false);
  };

  const handleReset = async () => {
    if (!email) {
      setError('Enter your email address above first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://app.simplysous.com/reset-password',
      });
      setResetSent(true);
    } catch (err) {
      setError('Could not send reset email. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-root">
      <style>{styles}</style>
      <div className="auth-card">

        <div className="auth-logo">Simply <span>Sous</span></div>
        <div className="auth-tagline">Dinner, decided.</div>

        {!showReset ? (
          <>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-sub">Sign in to your kitchen dashboard.</p>

            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                className="auth-input"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="current-password"
              />
            </div>

            <button className="auth-btn" onClick={handleLogin} disabled={loading}>
              {loading ? <><span className="spinner" />Signing in...</> : 'Sign In →'}
            </button>

            {error && <div className="auth-error">{error}</div>}

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button className="auth-link-btn" onClick={() => { setShowReset(true); setError(''); }}>
                Forgot password?
              </button>
            </div>

            <div className="auth-switch">
              Don&apos;t have an account?{' '}
              <a onClick={() => router.push('/signup')}>Sign up free →</a>
            </div>
          </>
        ) : (
          <>
            <h1 className="auth-title">Reset your password</h1>
            <p className="auth-sub">Enter your email and we&apos;ll send you a reset link.</p>

            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                className="auth-input"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {!resetSent ? (
              <button className="auth-btn" onClick={handleReset} disabled={loading}>
                {loading ? <><span className="spinner" />Sending...</> : 'Send Reset Link →'}
              </button>
            ) : (
              <div className="auth-success">
                ✓ Reset link sent to <strong>{email}</strong>. Check your inbox and follow the link to set a new password.
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <div style={{ marginTop: '16px' }}>
              <button className="auth-link-btn" onClick={() => { setShowReset(false); setResetSent(false); setError(''); }}>
                ← Back to sign in
              </button>
            </div>
          </>
        )}

        <div className="auth-footer">
          Need help?{' '}
          <a href="mailto:hello@simplysous.com">hello@simplysous.com</a>
        </div>
      </div>
    </div>
  );
}
