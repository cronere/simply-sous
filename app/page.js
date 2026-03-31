'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    // Only runs in browser — safe to use window and Supabase here
    async function redirect() {
      const hostname = window.location.hostname
      const isApp = hostname.startsWith('app.')

      if (!isApp) {
        // Marketing site — show landing page
        router.replace('/landing')
        return
      }

      // App subdomain — check auth state
      const { getSupabase } = await import('../lib/supabase')
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', session.user.id)
        .single()

      router.replace(profile?.onboarding_complete ? '/today' : '/onboarding')
    }

    redirect()
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1A1612',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="spinner" />
    </div>
  )
}
