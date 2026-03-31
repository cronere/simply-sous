'use client';
export const dynamic = 'force-dynamic';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
// Domain-aware root: simplysous.com → landing, app.simplysous.com → auth check

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const hostname = window.location.hostname;
    const isApp = hostname.startsWith('app.');

    if (isApp) {
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('id', session.user.id)
            .single();
          router.replace(profile?.onboarding_complete ? '/today' : '/onboarding');
        } else {
          router.replace('/login');
        }
      };
      checkSession();
    } else {
      // Marketing site — redirect to landing page
      router.replace('/landing');
    }
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--ink)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="spinner" />
    </div>
  );
}
