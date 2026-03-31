'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

export default function RootPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hostname = window.location.hostname;
    const isApp = hostname.startsWith('app.');

    if (!isApp) {
      router.replace('/landing');
      return;
    }

    const checkSession = async () => {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles').select('onboarding_complete').eq('id', session.user.id).single();
        router.replace(profile?.onboarding_complete ? '/today' : '/onboarding');
      } else {
        router.replace('/login');
      }
    };
    checkSession();
  }, [router]);

  return (
    <div style={{ minHeight:'100vh', background:'#1A1612', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:20, height:20, border:'2px solid rgba(184,135,74,0.2)', borderTopColor:'#B8874A', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
