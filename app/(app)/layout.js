'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

let _client = null
const getClient = () => {
  if (_client) return _client
  _client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  return _client
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  :root{
    --ink:#1A1612;--ink2:#2C2420;--parchment:#F8F3EC;
    --clay:#B8874A;--clay-l:#D4A46A;--ember:#C05C30;
    --sage:#6B7E67;--sage-l:#8FA889;--mid:#7A6C5E;
    --sidebar:220px;
  }

  html,body{height:100%;background:var(--ink)}
  body{font-family:'Outfit',sans-serif;font-weight:300;color:var(--parchment);overflow-x:hidden}

  /* ── LAYOUT ── */
  .shell{display:flex;min-height:100vh}

  /* ── SIDEBAR ── */
  .sidebar{
    width:var(--sidebar);flex-shrink:0;
    background:var(--ink2);
    border-right:1px solid rgba(255,255,255,.06);
    display:flex;flex-direction:column;
    position:fixed;top:0;left:0;bottom:0;
    z-index:100;
    transition:transform .3s cubic-bezier(.16,1,.3,1);
  }

  .sidebar-logo{
    padding:1.5rem 1.25rem 1rem;
    border-bottom:1px solid rgba(255,255,255,.06);
  }
  .sidebar-logo-text{
    font-family:'Cormorant Garamond',serif;
    font-size:1.3rem;font-weight:600;color:var(--parchment);
    text-decoration:none;display:block;
  }
  .sidebar-logo-text span{color:var(--clay);font-style:italic}
  .sidebar-tagline{
    font-size:.62rem;color:rgba(248,243,236,.25);
    letter-spacing:.1em;text-transform:uppercase;margin-top:.15rem;
  }

  /* Nav links */
  .sidebar-nav{
    flex:1;padding:.75rem 0;overflow-y:auto;
  }
  .nav-section-label{
    font-size:.58rem;font-weight:500;letter-spacing:.18em;
    text-transform:uppercase;color:rgba(248,243,236,.2);
    padding:.75rem 1.25rem .35rem;
  }
  .nav-link{
    display:flex;align-items:center;gap:.75rem;
    padding:.7rem 1.25rem;font-size:.88rem;
    color:rgba(248,243,236,.45);text-decoration:none;
    cursor:pointer;transition:all .2s;border:none;
    background:none;width:100%;text-align:left;
    font-family:'Outfit',sans-serif;font-weight:300;
    border-radius:0;position:relative;
  }
  .nav-link:hover{color:var(--parchment);background:rgba(255,255,255,.04)}
  .nav-link.active{
    color:var(--parchment);background:rgba(184,135,74,.1);
  }
  .nav-link.active::before{
    content:'';position:absolute;left:0;top:0;bottom:0;
    width:2px;background:var(--clay);border-radius:0 1px 1px 0;
  }
  .nav-ico{font-size:1rem;width:1.25rem;text-align:center;flex-shrink:0}
  .nav-label{font-size:.88rem}

  /* User section */
  .sidebar-user{
    padding:1rem 1.25rem;
    border-top:1px solid rgba(255,255,255,.06);
  }
  .user-row{display:flex;align-items:center;gap:.75rem}
  .user-avatar{
    width:2rem;height:2rem;border-radius:50%;
    background:linear-gradient(135deg,var(--clay),var(--sage));
    display:flex;align-items:center;justify-content:center;
    font-size:.8rem;font-weight:500;color:var(--ink);flex-shrink:0;
  }
  .user-name{font-size:.82rem;color:rgba(248,243,236,.6);
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1}
  .signout-btn{
    background:none;border:none;color:rgba(248,243,236,.25);
    font-size:.75rem;cursor:pointer;padding:0;
    font-family:'Outfit',sans-serif;transition:color .2s;white-space:nowrap;
  }
  .signout-btn:hover{color:rgba(248,243,236,.6)}

  /* ── MAIN CONTENT ── */
  .shell-main{
    margin-left:var(--sidebar);
    flex:1;min-width:0;
    min-height:100vh;
  }

  /* ── MOBILE TOP BAR ── */
  .mob-topbar{
    display:none;
    position:fixed;top:0;left:0;right:0;z-index:100;
    background:rgba(26,22,18,.95);backdrop-filter:blur(16px);
    border-bottom:1px solid rgba(255,255,255,.06);
    padding:.9rem 1.25rem;
    align-items:center;justify-content:space-between;
    height:56px;
  }
  .mob-logo{
    font-family:'Cormorant Garamond',serif;
    font-size:1.2rem;font-weight:600;color:var(--parchment);
  }
  .mob-logo span{color:var(--clay);font-style:italic}

  /* ── MOBILE BOTTOM TAB BAR ── */
  .mob-tabs{
    display:none;
    position:fixed;bottom:0;left:0;right:0;z-index:100;
    background:rgba(26,22,18,.97);backdrop-filter:blur(20px);
    border-top:1px solid rgba(255,255,255,.06);
    padding:.5rem 0 calc(.5rem + env(safe-area-inset-bottom));
    justify-content:space-around;
  }
  .mob-tab{
    display:flex;flex-direction:column;align-items:center;gap:.2rem;
    background:none;border:none;cursor:pointer;padding:.4rem .5rem;
    color:rgba(248,243,236,.35);font-family:'Outfit',sans-serif;
    transition:color .2s;flex:1;
  }
  .mob-tab.active{color:var(--clay)}
  .mob-tab:hover{color:rgba(248,243,236,.7)}
  .mob-tab-ico{font-size:1.2rem;line-height:1}
  .mob-tab-label{font-size:.58rem;font-weight:400;letter-spacing:.04em}

  /* ── RESPONSIVE ── */
  @media(max-width:768px){
    .sidebar{display:none}
    .shell-main{margin-left:0;padding-top:56px;padding-bottom:72px}
    .mob-topbar{display:flex}
    .mob-tabs{display:flex}
  }
`

const NAV_ITEMS = [
  { path: '/today',    ico: '☀️',  label: 'Today',    section: 'main' },
  { path: '/vault',    ico: '📚',  label: 'Vault',    section: 'main' },
  { path: '/plan',     ico: '📅',  label: 'Plan',     section: 'main' },
  { path: '/grocery',  ico: '🛒',  label: 'Grocery',  section: 'main' },
  { path: '/chat',     ico: '✨',  label: 'Dot',      section: 'main' },
  { path: '/settings', ico: '⚙️',  label: 'Settings', section: 'account' },
]

const MOB_TABS = [
  { path: '/today',   ico: '☀️',  label: 'Today'   },
  { path: '/vault',   ico: '📚',  label: 'Vault'   },
  { path: '/plan',    ico: '📅',  label: 'Plan'    },
  { path: '/grocery', ico: '🛒',  label: 'Grocery' },
  { path: '/chat',    ico: '✨',  label: 'Dot'     },
]

export default function AppLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    setMounted(true)
    const sb = getClient()
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      const { data } = await sb
        .from('profiles')
        .select('full_name, family_name, onboarding_complete')
        .eq('id', session.user.id)
        .maybeSingle()
      if (data && !data.onboarding_complete) {
        router.replace('/onboarding'); return
      }
      setProfile({ ...data, email: session.user.email })
    })
  }, [router])

  const signOut = async () => {
    await getClient().auth.signOut()
    router.replace('/login')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const displayName = profile?.full_name?.split(' ')[0] || profile?.email || '...'

  if (!mounted) return null

  return (
    <>
      <style>{css}</style>
      <div className="shell">

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <a className="sidebar-logo-text" onClick={() => router.push('/today')}>
              Simply <span>Sous</span>
            </a>
            <div className="sidebar-tagline">Dinner, decided.</div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section-label">Menu</div>
            {NAV_ITEMS.filter(n => n.section === 'main').map(item => (
              <button key={item.path}
                className={`nav-link${pathname === item.path ? ' active' : ''}`}
                onClick={() => router.push(item.path)}>
                <span className="nav-ico">{item.ico}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}

            <div className="nav-section-label" style={{marginTop:'.5rem'}}>Account</div>
            {NAV_ITEMS.filter(n => n.section === 'account').map(item => (
              <button key={item.path}
                className={`nav-link${pathname === item.path ? ' active' : ''}`}
                onClick={() => router.push(item.path)}>
                <span className="nav-ico">{item.ico}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-user">
            <div className="user-row">
              <div className="user-avatar">{initials}</div>
              <div className="user-name">{displayName}</div>
              <button className="signout-btn" onClick={signOut}>Sign out</button>
            </div>
          </div>
        </aside>

        {/* ── MOBILE TOP BAR ── */}
        <div className="mob-topbar">
          <div className="mob-logo">Simply <span>Sous</span></div>
          <button className="signout-btn" onClick={signOut}
            style={{color:'rgba(248,243,236,.35)',fontSize:'.78rem'}}>
            Sign out
          </button>
        </div>

        {/* ── MAIN CONTENT ── */}
        <main className="shell-main">
          {children}
        </main>

        {/* ── MOBILE BOTTOM TABS ── */}
        <nav className="mob-tabs">
          {MOB_TABS.map(tab => (
            <button key={tab.path}
              className={`mob-tab${pathname === tab.path ? ' active' : ''}`}
              onClick={() => router.push(tab.path)}>
              <span className="mob-tab-ico">{tab.ico}</span>
              <span className="mob-tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>

      </div>
    </>
  )
}
