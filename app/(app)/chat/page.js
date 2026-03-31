'use client'
import { useRouter } from 'next/navigation'

const PAGES = {
  today:    { ico: '☀️',  title: 'Today',        sub: "Tonight's dinner will live here. Coming in Sprint 4." },
  plan:     { ico: '📅',  title: 'Weekly Plan',   sub: 'Your AI-generated meal schedule. Coming in Sprint 3.' },
  grocery:  { ico: '🛒',  title: 'Grocery List',  sub: 'Your weekly shopping list. Coming in Sprint 3.' },
  chat:     { ico: '✨',  title: 'Dot',           sub: 'Your AI kitchen assistant. Coming in Sprint 5.' },
  settings: { ico: '⚙️',  title: 'Settings',      sub: 'Profile, preferences, and reminders. Coming soon.' },
}

export default function Page() {
  const router = useRouter()
  const key = 'chat'
  const { ico, title, sub } = PAGES[key]

  return (
    <div style={{
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      minHeight:'80vh',padding:'2rem',textAlign:'center',
    }}>
      <div style={{fontSize:'3.5rem',marginBottom:'1.5rem'}}>{ico}</div>
      <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'2rem',fontWeight:300,
        color:'#F8F3EC',marginBottom:'.75rem'}}>{title}</h1>
      <p style={{fontSize:'.92rem',color:'rgba(248,243,236,.35)',lineHeight:1.8,
        maxWidth:'360px',marginBottom:'2rem'}}>{sub}</p>
      <button onClick={() => router.push('/vault')}
        style={{background:'rgba(184,135,74,.12)',border:'1px solid rgba(184,135,74,.25)',
          color:'#B8874A',padding:'.7rem 1.75rem',borderRadius:'2rem',
          fontFamily:"'Outfit',sans-serif",fontSize:'.88rem',cursor:'pointer'}}>
        Go to Vault →
      </button>
    </div>
  )
}
