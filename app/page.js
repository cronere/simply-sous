'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    async function go() {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )

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
      } catch (err) {
        console.error('Root redirect error:', err)
        router.replace('/login')
      }
    }

    go()
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1A1612',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '24px',
        height: '24px',
        border: '2px solid rgba(184,135,74,0.2)',
        borderTopColor: '#B8874A',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
