'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const getClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ── APP SUBDOMAIN: auth check + redirect ─────────────────
function AppRedirect() {
  const router = useRouter()

  useEffect(() => {
    async function go() {
      try {
        const supabase = getClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.replace('/login'); return }
        const { data: profile } = await supabase
          .from('profiles').select('onboarding_complete').eq('id', session.user.id).single()
        router.replace(profile?.onboarding_complete ? '/today' : '/onboarding')
      } catch {
        router.replace('/login')
      }
    }
    go()
  }, [router])

  return (
    <div style={{minHeight:'100vh',background:'#1A1612',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:24,height:24,border:'2px solid rgba(184,135,74,0.2)',borderTopColor:'#B8874A',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── MARKETING SITE: landing page ─────────────────────────
function LandingPage() {
  useEffect(() => {
    // FAQ accordion
    document.querySelectorAll('.faq-item').forEach(item => {
      item.querySelector('.faq-q')?.addEventListener('click', () => {
        const was = item.classList.contains('open')
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'))
        if (!was) item.classList.add('open')
      })
    })
    // Scroll reveal
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target) }
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' })
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    // Nav scroll
    const nav = document.getElementById('nav')
    const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const t = document.querySelector(a.getAttribute('href'))
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
      })
    })
    // Mobile nav
    window.openMob = () => {
      document.getElementById('mobNav')?.classList.add('open')
      document.getElementById('overlay')?.classList.add('open')
    }
    window.closeMob = () => {
      document.getElementById('mobNav')?.classList.remove('open')
      document.getElementById('overlay')?.classList.remove('open')
    }
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <style>{LANDING_CSS}</style>
      <div dangerouslySetInnerHTML={{ __html: LANDING_HTML }} />
    </>
  )
}

// ── ROOT: detect hostname ─────────────────────────────────
export default function RootPage() {
  const [isApp, setIsApp] = useState(null)

  useEffect(() => {
    setIsApp(window.location.hostname.startsWith('app.'))
  }, [])

  if (isApp === null) return (
    <div style={{minHeight:'100vh',background:'#1A1612',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:24,height:24,border:'2px solid rgba(184,135,74,0.2)',borderTopColor:'#B8874A',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return isApp ? <AppRedirect /> : <LandingPage />
}

// ── LANDING PAGE CONTENT ────────────────────────────────
const LANDING_CSS = `
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ink:#1A1612;--ink2:#2C2420;
  --parchment:#F8F3EC;--warm:#F2EBE0;--sand:#E2D5C3;
  --clay:#B8874A;--clay-l:#D4A46A;
  --ember:#C05C30;--ember-d:#8B3A1A;
  --sage:#6B7E67;--sage-l:#8FA889;
  --cream:#FBF8F3;--mid:#7A6C5E;--light:#B5A898;
}
html{scroll-behavior:smooth}
body{background:var(--ink);color:var(--parchment);font-family:'Outfit',sans-serif;font-weight:300;line-height:1.6;overflow-x:hidden}

/* NAV */
nav{position:fixed;top:0;left:0;right:0;z-index:200;display:flex;align-items:center;justify-content:space-between;padding:1.5rem 5%;transition:all .4s ease}
nav.scrolled{background:rgba(26,22,18,.94);backdrop-filter:blur(20px);padding:1rem 5%;border-bottom:1px solid rgba(255,255,255,.05)}
.logo{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:600;color:var(--parchment);text-decoration:none}
.logo span{color:var(--clay);font-style:italic}
.nav-r{display:flex;align-items:center;gap:2rem}
.nav-r a{font-size:.97rem;color:rgba(248,243,236,.80);text-decoration:none;transition:color .2s}
.nav-r a:hover{color:var(--parchment)}
.nav-btn{background:var(--clay);color:var(--ink)!important;padding:.55rem 1.4rem;border-radius:2rem;font-weight:500;font-size:.85rem;transition:background .2s,transform .2s!important}
.nav-btn:hover{background:var(--clay-l)!important;transform:translateY(-1px)}
.nav-menu{display:none;flex-direction:column;gap:.3rem;cursor:pointer;padding:.5rem}
.nav-menu span{width:22px;height:1.5px;background:var(--parchment);display:block;transition:all .3s}

/* HERO */
.hero{display:grid;place-items:center;text-align:center;padding:6.5rem 5% 4rem;position:relative;overflow:hidden}
.hero-bg{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(184,135,74,.15) 0%,transparent 60%),radial-gradient(ellipse 50% 40% at 85% 85%,rgba(192,92,48,.1) 0%,transparent 55%)}
.hero-grain{position:absolute;inset:0;opacity:.35;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E");pointer-events:none}
.hero-inner{position:relative;z-index:1;max-width:680px;margin:0 auto}
.eyebrow{display:inline-flex;align-items:center;gap:.6rem;font-size:.78rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--clay);margin-bottom:1.25rem;opacity:0;animation:up .9s cubic-bezier(.16,1,.3,1) .2s forwards}
.eyebrow::before,.eyebrow::after{content:'';width:1.5rem;height:1px;background:var(--clay);opacity:.6}
h1{font-family:'Cormorant Garamond',serif;font-size:clamp(3rem,7vw,5.5rem);font-weight:300;line-height:.95;letter-spacing:-.02em;color:var(--parchment);opacity:0;animation:up 1s cubic-bezier(.16,1,.3,1) .4s forwards}
h1 em{font-style:italic;color:var(--clay)}
.hero-sub{font-family:'Cormorant Garamond',serif;font-size:clamp(1rem,2vw,1.4rem);font-weight:300;font-style:italic;color:rgba(248,243,236,.75);margin-top:.9rem;opacity:0;animation:up .9s cubic-bezier(.16,1,.3,1) .6s forwards}
.hero-p{font-size:1.05rem;color:rgba(248,243,236,.82);max-width:420px;margin:.9rem auto 0;line-height:1.8;opacity:0;animation:up .9s cubic-bezier(.16,1,.3,1) .75s forwards}
.hero-btns{display:flex;align-items:center;justify-content:center;gap:1.25rem;margin-top:2rem;flex-wrap:wrap;opacity:0;animation:up .9s cubic-bezier(.16,1,.3,1) .9s forwards}
.btn-p{font-size:.95rem;font-weight:500;color:var(--ink);background:var(--clay);padding:.9rem 2.25rem;border-radius:3rem;text-decoration:none;transition:background .2s,transform .2s,box-shadow .2s;box-shadow:0 8px 28px rgba(184,135,74,.3)}
.btn-p:hover{background:var(--clay-l);transform:translateY(-2px);box-shadow:0 14px 36px rgba(184,135,74,.4)}
.btn-s{font-size:1rem;color:rgba(248,243,236,.78);text-decoration:none;display:flex;align-items:center;gap:.5rem;transition:color .2s}
.btn-s:hover{color:var(--parchment)}
.arr{width:1.8rem;height:1.8rem;border-radius:50%;border:1px solid rgba(248,243,236,.2);display:flex;align-items:center;justify-content:center;font-size:.7rem;transition:border-color .2s,transform .2s}
.btn-s:hover .arr{border-color:var(--parchment);transform:translateX(3px)}
.hero-trial{font-size:.88rem;color:rgba(248,243,236,.55);margin-top:.5rem;letter-spacing:.04em}

/* TRUST BAR */
.trust{background:rgba(255,255,255,.03);border-top:1px solid rgba(255,255,255,.05);border-bottom:1px solid rgba(255,255,255,.05);padding:1.5rem 5%;display:flex;align-items:center;justify-content:center;gap:3rem;flex-wrap:wrap}
.trust-item{display:flex;align-items:center;gap:.6rem;font-size:1.02rem;color:rgba(248,243,236,.72);font-weight:400}
.trust-item::before{content:'✓';color:var(--sage-l);font-size:.82rem;font-weight:600}

/* SECTIONS */
section{padding:8rem 5%;position:relative}
.section-inner{max-width:1100px;margin:0 auto}
.center{text-align:center}

.ov{font-size:.8rem;font-weight:500;letter-spacing:.16em;text-transform:uppercase;display:inline-flex;align-items:center;gap:.6rem;margin-bottom:1.25rem}
.ov-l{color:var(--ember)}
.ov-l::before,.ov-l::after{content:'';width:1.5rem;height:1px;background:var(--ember)}
.ov-d{color:var(--ember)}
.ov-d::before,.ov-d::after{content:'';width:1.5rem;height:1px;background:var(--ember)}
.sh{font-family:'Cormorant Garamond',serif;font-size:clamp(2rem,4.5vw,3.5rem);font-weight:300;line-height:1.1;color:var(--parchment)}
.sh em{font-style:italic;color:var(--clay)}
.sh-d{font-family:'Cormorant Garamond',serif;font-size:clamp(2rem,4.5vw,3.5rem);font-weight:300;line-height:1.1;color:var(--ink)}
.sh-d em{font-style:italic;color:var(--ember)}
.sp{font-size:1rem;color:rgba(248,243,236,.80);line-height:1.85;margin-top:1rem}
.sp-d{font-size:1rem;color:var(--mid);line-height:1.85;margin-top:1rem}

/* PROBLEM */
.problem{background:var(--ink)}
.problem-grid{display:grid;grid-template-columns:1fr 1fr;gap:7rem;align-items:center;margin-top:0}
.stat-col{display:flex;flex-direction:column;gap:2.5rem}
.stat{border-left:1px solid rgba(184,135,74,.2);padding-left:2rem}
.stat-n{font-family:'Cormorant Garamond',serif;font-size:3.5rem;font-weight:300;color:var(--clay);line-height:1;letter-spacing:-.02em}
.stat-l{font-size:1rem;color:rgba(248,243,236,.72);margin-top:.35rem;line-height:1.55}

/* HOW */
.how{background:var(--parchment)}
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:2rem;margin-top:4rem;position:relative}
.steps::before{content:'';position:absolute;top:2.2rem;left:calc(12.5% + 1rem);right:calc(12.5% + 1rem);height:1px;background:linear-gradient(to right,transparent,var(--sand),transparent)}
.step{text-align:center;padding:0 1rem}
.step-n{width:2.75rem;height:2.75rem;border-radius:50%;background:var(--ink);color:var(--clay);font-family:'Cormorant Garamond',serif;font-size:1rem;font-weight:600;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;position:relative;z-index:1}
.step-ico{font-size:1.75rem;margin-bottom:1rem;display:block}
.step-t{font-family:'Cormorant Garamond',serif;font-size:1.25rem;font-weight:600;color:var(--ink);margin-bottom:.6rem;line-height:1.2}
.step-d{font-size:1rem;color:var(--mid);line-height:1.75}

/* FEATURES BENTO */
.features{background:var(--ink)}
.bento{display:grid;grid-template-columns:repeat(12,1fr);gap:1rem;margin-top:3.5rem}
.bc{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:1.5rem;padding:2.25rem;transition:background .3s,border-color .3s,transform .3s;overflow:hidden;position:relative}
.bc:hover{background:rgba(255,255,255,.07);border-color:rgba(184,135,74,.2);transform:translateY(-3px)}
.bc.feat{background:rgba(184,135,74,.08);border-color:rgba(184,135,74,.2)}
.bc.feat:hover{background:rgba(184,135,74,.13);border-color:rgba(184,135,74,.35)}
.c7{grid-column:span 7}.c5{grid-column:span 5}.c4{grid-column:span 4}.c8{grid-column:span 8}.c6{grid-column:span 6}.c12{grid-column:span 12}
.btag{display:inline-flex;align-items:center;gap:.35rem;font-size:.65rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--clay);background:rgba(184,135,74,.1);border:1px solid rgba(184,135,74,.2);padding:.28rem .7rem;border-radius:2rem;margin-bottom:1.1rem}
.bico{font-size:2rem;margin-bottom:1.25rem;display:block}
.bt{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:400;color:var(--parchment);line-height:1.2;margin-bottom:.65rem}
.bc.feat .bt{font-size:1.85rem}
.bd{font-size:1.05rem;color:rgba(248,243,236,.80);line-height:1.8}
.bpills{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:1.1rem}
.bpill{font-size:.72rem;padding:.25rem .7rem;border-radius:2rem;border:1px solid rgba(255,255,255,.08);color:rgba(248,243,236,.35)}
.bpill.on{background:rgba(184,135,74,.1);border-color:rgba(184,135,74,.3);color:var(--clay)}
.bcode{background:rgba(0,0,0,.3);border-radius:.6rem;padding:.9rem 1.1rem;margin-top:1.1rem;font-size:1.02rem;color:rgba(248,243,236,.3);line-height:1.7}

/* PHONE SECTION */
.phone-sec{background:var(--warm);overflow:hidden}
.phone-grid{display:grid;grid-template-columns:1fr 1fr;gap:5rem;align-items:center}
.feats-list{display:flex;flex-direction:column;gap:1.5rem;margin-top:2.5rem}
.fi{display:flex;gap:1rem;align-items:flex-start}
.fi-dot{width:2.2rem;height:2.2rem;border-radius:50%;background:rgba(192,92,48,.1);border:1px solid rgba(192,92,48,.2);display:flex;align-items:center;justify-content:center;font-size:.8rem;flex-shrink:0;margin-top:.1rem}
.fi-n{font-weight:500;font-size:1.05rem;color:var(--ink);margin-bottom:.2rem}
.fi-d{font-size:1rem;color:var(--mid);line-height:1.7}

/* iPhone mockup */
.iphone-wrap{display:flex;justify-content:center;align-items:center}
.iphone{width:260px;background:#111;border-radius:3rem;padding:.5rem;box-shadow:0 0 0 .5px rgba(255,255,255,.15),0 30px 80px rgba(0,0,0,.4),inset 0 0 0 .5px rgba(255,255,255,.05)}
.iphone-body{background:#111;border-radius:2.6rem;overflow:hidden;position:relative}
.dynamic-island{width:6rem;height:1.5rem;background:#000;border-radius:2rem;margin:.75rem auto .5rem;position:relative;z-index:2}
.iscreen{background:#1A1612;min-height:480px;padding:0}
.iscreen-top{background:linear-gradient(135deg,rgba(184,135,74,.15),rgba(192,92,48,.08));padding:1rem 1.1rem .85rem;border-bottom:1px solid rgba(255,255,255,.05)}
.iscreen-greeting{font-size:.68rem;color:var(--clay);letter-spacing:.1em;text-transform:uppercase}
.iscreen-date{font-family:'Cormorant Garamond',serif;font-size:1.05rem;color:var(--parchment);margin-top:.15rem}
.iscreen-meal-card{margin:.75rem .75rem 0;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);border-radius:1rem;overflow:hidden}
.imc-top{padding:.85rem 1rem;border-bottom:1px solid rgba(255,255,255,.05)}
.imc-label{font-size:.52rem;letter-spacing:.1em;text-transform:uppercase;color:rgba(248,243,236,.60);margin-bottom:.25rem}
.imc-name{font-family:'Cormorant Garamond',serif;font-size:1.05rem;color:var(--parchment);line-height:1.2;margin-bottom:.4rem}
.imc-meta{display:flex;gap:.7rem;font-size:.55rem;color:rgba(248,243,236,.58)}
.imc-timer{display:flex;justify-content:space-between;align-items:center;background:rgba(192,92,48,.1);padding:.7rem 1rem}
.imc-t-l{font-size:.6rem;color:var(--ember);letter-spacing:.08em;text-transform:uppercase}
.imc-t-v{font-family:'Cormorant Garamond',serif;font-size:1.15rem;color:var(--parchment)}
.iscreen-steps{padding:.75rem .75rem 1rem}
.iscreen-step-label{font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:rgba(248,243,236,.72);margin-bottom:.5rem}
.ist{display:flex;gap:.5rem;padding:.4rem 0;border-bottom:1px solid rgba(255,255,255,.04)}
.ist:last-child{border:none}
.ist-n{font-size:.65rem;color:var(--clay);font-weight:600;min-width:.9rem;padding-top:.1rem}
.ist-t{font-size:.72rem;color:rgba(248,243,236,.78);line-height:1.5}
.iphone-home{width:4rem;height:.35rem;background:rgba(255,255,255,.2);border-radius:1rem;margin:.6rem auto}

/* SHARING */
.sharing{background:var(--ink2)}
.share-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.5rem;margin-top:3.5rem}
.share-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:1.5rem;padding:2rem;transition:transform .3s,background .3s}
.share-card:hover{transform:translateY(-4px);background:rgba(255,255,255,.07)}
.share-ico{font-size:2.2rem;margin-bottom:1.25rem;display:block}
.share-t{font-family:'Cormorant Garamond',serif;font-size:1.35rem;color:var(--parchment);margin-bottom:.6rem;line-height:1.2}
.share-d{font-size:1.02rem;color:rgba(248,243,236,.78);line-height:1.8}
.share-tag{display:inline-block;margin-top:.85rem;font-size:.68rem;color:var(--sage-l);background:rgba(107,126,103,.1);border:1px solid rgba(107,126,103,.2);padding:.25rem .7rem;border-radius:2rem;letter-spacing:.06em}

/* ONBOARDING */
.onboard{background:var(--parchment)}
.ob-steps{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--sand);border-radius:1.25rem;overflow:hidden;margin-top:3.5rem}
.ob-step{background:var(--cream);padding:1.75rem 1.35rem;position:relative}
.ob-step::after{content:attr(data-n);position:absolute;top:1.25rem;right:1.25rem;font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:rgba(26,22,18,.07);font-weight:600}
.ob-ico{font-size:1.75rem;margin-bottom:.85rem;display:block}
.ob-t{font-weight:500;font-size:1.02rem;color:var(--ink);margin-bottom:.4rem;line-height:1.3}
.ob-d{font-size:.95rem;color:var(--mid);line-height:1.65}

/* DOT AI */
.dot-section{background:var(--ink)}
.dot-grid{display:grid;grid-template-columns:1fr 1fr;gap:6rem;align-items:center}
.dot-chat{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:1.5rem;overflow:hidden}
.dot-header{background:rgba(255,255,255,.04);padding:1.1rem 1.5rem;display:flex;align-items:center;gap:.75rem;border-bottom:1px solid rgba(255,255,255,.06)}
.dot-avatar{width:2.25rem;height:2.25rem;border-radius:50%;background:linear-gradient(135deg,#D4A46A,#8FA889);display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0}
.dot-n{font-weight:500;font-size:1rem;color:var(--parchment)}
.dot-s{font-size:.82rem;color:var(--sage-l)}
.dot-msgs{padding:1.5rem;display:flex;flex-direction:column;gap:.85rem}
.msg{max-width:82%;border-radius:1.25rem;padding:.8rem 1rem;font-size:.85rem;line-height:1.6}
.msg.u{background:rgba(184,135,74,.18);color:var(--parchment);align-self:flex-end;border-bottom-right-radius:.3rem}
.msg.a{background:rgba(255,255,255,.06);color:rgba(248,243,236,.7);align-self:flex-start;border-bottom-left-radius:.3rem}
.msg.a strong{color:var(--clay);font-weight:500}
.dot-input{display:flex;gap:.6rem;align-items:center;padding:1rem 1.5rem;background:rgba(255,255,255,.03);border-top:1px solid rgba(255,255,255,.05)}
.dot-field{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:2rem;padding:.6rem 1rem;font-size:1.02rem;color:rgba(248,243,236,.35)}
.dot-mic{width:2.2rem;height:2.2rem;border-radius:50%;background:var(--ember);display:flex;align-items:center;justify-content:center;font-size:.85rem;cursor:pointer;flex-shrink:0;transition:transform .2s,background .2s}
.dot-mic:hover{background:var(--clay);transform:scale(1.1)}
.dot-feats{display:flex;flex-direction:column;gap:1.5rem}
.dot-feat{display:flex;gap:1rem;align-items:flex-start}
.dot-feat-ico{width:2.25rem;height:2.25rem;border-radius:.6rem;background:rgba(184,135,74,.1);border:1px solid rgba(184,135,74,.2);display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0}
.dot-feat-n{font-weight:500;font-size:.95rem;color:var(--parchment);margin-bottom:.2rem}
.dot-feat-d{font-size:1rem;color:rgba(248,243,236,.75);line-height:1.7}

/* PRICING */
.pricing{background:var(--ink2)}
.pricing-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;margin-top:3.5rem}
.pc{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:1.75rem;padding:2.5rem 2rem;position:relative;transition:transform .3s,border-color .3s}
.pc:hover{transform:translateY(-4px)}
.pc.pop{background:rgba(184,135,74,.08);border-color:rgba(184,135,74,.3)}
.pc.pop:hover{border-color:rgba(184,135,74,.5)}
.pc-top-bar{height:2px;border-radius:1px;margin-bottom:2rem;background:rgba(255,255,255,.07)}
.pc.pop .pc-top-bar{background:linear-gradient(to right,transparent,var(--clay),transparent)}
.pc-badge{display:inline-block;font-size:.62rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;padding:.28rem .75rem;border-radius:2rem;margin-bottom:1.25rem}
.pc.pop .pc-badge{background:rgba(184,135,74,.15);color:var(--clay);border:1px solid rgba(184,135,74,.3)}
.pc:not(.pop) .pc-badge{background:rgba(255,255,255,.06);color:rgba(248,243,236,.4);border:1px solid rgba(255,255,255,.08)}
.pc-name{font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:400;color:var(--parchment);margin-bottom:1.5rem}
.pc-price{font-family:'Cormorant Garamond',serif;font-size:3.5rem;font-weight:300;color:var(--parchment);line-height:1;letter-spacing:-.02em}
.pc-price sup{font-size:1.4rem;vertical-align:super;color:var(--clay)}
.pc-price sub{font-size:1rem;color:rgba(248,243,236,.35);font-family:'Outfit',sans-serif;font-weight:300}
.pc-save{font-size:.72rem;color:var(--sage-l);margin:.4rem 0 .25rem;letter-spacing:.04em}
.pc-cadence{font-size:1.02rem;color:rgba(248,243,236,.3);margin-bottom:2rem;line-height:1.5}
.pc-feats{display:flex;flex-direction:column;gap:.6rem;margin-bottom:2rem}
.pcf{display:flex;align-items:flex-start;gap:.65rem;font-size:.88rem;color:rgba(248,243,236,.5)}
.pcf::before{content:'✓';color:var(--sage-l);font-weight:600;font-size:.75rem;flex-shrink:0;margin-top:.05rem}
.pc-cta{display:block;text-align:center;font-size:.9rem;font-weight:500;padding:.85rem;border-radius:2rem;text-decoration:none;transition:all .2s}
.pc:not(.pop) .pc-cta{border:1px solid rgba(255,255,255,.12);color:rgba(248,243,236,.6)}
.pc:not(.pop) .pc-cta:hover{border-color:rgba(184,135,74,.4);color:var(--clay)}
.pc.pop .pc-cta{background:var(--clay);color:var(--ink);box-shadow:0 8px 24px rgba(184,135,74,.3)}
.pc.pop .pc-cta:hover{background:var(--clay-l);box-shadow:0 12px 32px rgba(184,135,74,.4)}
.pricing-note{text-align:center;font-size:.82rem;color:rgba(248,243,236,.2);margin-top:2rem}
.trial-banner{background:rgba(107,126,103,.1);border:1px solid rgba(107,126,103,.2);border-radius:1rem;padding:1.25rem 1.75rem;display:flex;align-items:center;gap:1.25rem;margin-top:2.5rem;flex-wrap:wrap;justify-content:center;text-align:center}
.trial-ico{font-size:1.5rem;flex-shrink:0}
.trial-text strong{display:block;font-size:.95rem;font-weight:500;color:var(--parchment);margin-bottom:.2rem}
.trial-text span{font-size:.85rem;color:rgba(248,243,236,.4)}

/* FAQ */
.faq{background:var(--ink)}
.faq-list{margin-top:3.5rem;max-width:740px;margin-left:auto;margin-right:auto}
.faq-item{border-bottom:1px solid rgba(255,255,255,.07);padding:1.75rem 0;cursor:pointer}
.faq-item:first-child{border-top:1px solid rgba(255,255,255,.07)}
.faq-q{display:flex;justify-content:space-between;align-items:center;gap:1.5rem}
.faq-question{font-family:'Cormorant Garamond',serif;font-size:1.25rem;font-weight:400;color:var(--parchment);line-height:1.3}
.faq-tog{width:1.8rem;height:1.8rem;border-radius:50%;border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--clay);font-size:1rem;transition:all .3s}
.faq-item.open .faq-tog{background:rgba(184,135,74,.1);border-color:rgba(184,135,74,.4);transform:rotate(45deg)}
.faq-ans{font-size:1.02rem;color:rgba(248,243,236,.4);line-height:1.9;max-height:0;overflow:hidden;transition:max-height .4s ease,padding .3s}
.faq-item.open .faq-ans{max-height:300px;padding-top:1rem}

/* STORY */
.story{background:var(--parchment)}
.story-q{font-family:'Cormorant Garamond',serif;font-size:clamp(1.6rem,3.5vw,2.6rem);font-weight:300;font-style:italic;color:var(--ink);line-height:1.45;margin:2.5rem 0 1.5rem}
.story-q em{font-style:normal;color:var(--ember);font-weight:400}
.story-attr{font-size:.82rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--mid)}
.story-attr span{color:var(--ember)}

/* FOOTER CTA */
.footer-cta{background:var(--ink);padding:8rem 5% 4rem;position:relative;overflow:hidden}
.footer-cta::before{content:'SS';position:absolute;font-family:'Cormorant Garamond',serif;font-size:28vw;font-weight:600;color:rgba(255,255,255,.02);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;letter-spacing:-.05em;line-height:1}
.footer-cta-inner{position:relative;z-index:1;text-align:center}
.footer-cta-t{font-family:'Cormorant Garamond',serif;font-size:clamp(2.5rem,7vw,5.5rem);font-weight:300;color:var(--parchment);line-height:1;margin:1.5rem 0 1rem}
.footer-cta-t em{font-style:italic;color:var(--clay)}
.footer-cta-sub{font-size:1rem;color:rgba(248,243,236,.4);margin-bottom:2.5rem}
.footer-bottom{margin-top:6rem;padding-top:1.75rem;border-top:1px solid rgba(255,255,255,.07);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1.5rem}
.f-logo{font-family:'Cormorant Garamond',serif;font-size:1.25rem;font-weight:600;color:var(--parchment)}
.f-logo span{color:var(--clay);font-style:italic}
.f-tag{font-size:.78rem;color:rgba(248,243,236,.55);letter-spacing:.04em}
.f-links{display:flex;gap:1.75rem}
.f-links a{font-size:1.02rem;color:rgba(248,243,236,.55);text-decoration:none;transition:color .2s}
.f-links a:hover{color:var(--parchment)}

/* ANIMATIONS */
@keyframes up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.reveal{opacity:0;transform:translateY(28px);transition:opacity .75s cubic-bezier(.16,1,.3,1),transform .75s cubic-bezier(.16,1,.3,1)}
.reveal.vis{opacity:1;transform:translateY(0)}
.d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}.d4{transition-delay:.4s}

/* MOBILE NAV DRAWER */
.mob-nav{position:fixed;top:0;right:-100%;width:75%;max-width:280px;height:100vh;background:var(--ink2);z-index:300;padding:5rem 2rem 2rem;transition:right .35s cubic-bezier(.16,1,.3,1);border-left:1px solid rgba(255,255,255,.07)}
.mob-nav.open{right:0}
.mob-nav a{display:block;font-size:1.1rem;color:rgba(248,243,236,.6);text-decoration:none;padding:.85rem 0;border-bottom:1px solid rgba(255,255,255,.06);transition:color .2s}
.mob-nav a:hover{color:var(--parchment)}
.mob-nav .nav-btn{display:block;text-align:center;margin-top:1.5rem;border-radius:2rem;padding:.85rem;font-size:.95rem}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:250;opacity:0;pointer-events:none;transition:opacity .3s}
.overlay.open{opacity:1;pointer-events:all}
.mob-close{position:absolute;top:1.5rem;right:1.5rem;width:2rem;height:2rem;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(248,243,236,.4);font-size:1.2rem}

/* RESPONSIVE */
@media(max-width:1024px){
  .bento{grid-template-columns:1fr 1fr}
  .c7,.c5,.c4,.c8,.c6,.c12{grid-column:span 1}
  .bc.feat{grid-column:span 2}
  .steps{grid-template-columns:1fr 1fr;gap:2.5rem}
  .steps::before{display:none}
  .pricing-cards{grid-template-columns:1fr}
  .share-grid{grid-template-columns:1fr}
  .ob-steps{grid-template-columns:1fr 1fr;gap:1px}
  .dot-grid{grid-template-columns:1fr}
}
@media(max-width:768px){
  nav{padding:1.25rem 1.25rem}
  nav.scrolled{padding:1rem 1.25rem}
  .nav-r .nav-r-links{display:none}
  .nav-r a:not(.nav-btn):not(.nav-menu-btn){display:none}
  .nav-menu{display:flex}
  section{padding:5rem 5%}
  .problem-grid{grid-template-columns:1fr;gap:3.5rem}
  .steps{grid-template-columns:1fr}
  .bento{grid-template-columns:1fr}
  .bc.feat{grid-column:span 1}
  .phone-grid{grid-template-columns:1fr;gap:3rem}
  .iphone-wrap{order:-1}
  .ob-steps{grid-template-columns:1fr}
  h1{font-size:clamp(3rem,12vw,5rem)}
  .pricing-cards{grid-template-columns:1fr;max-width:380px;margin-left:auto;margin-right:auto}
  .share-grid{grid-template-columns:1fr}
  .footer-bottom{flex-direction:column;align-items:center;text-align:center}
  .f-links{justify-content:center}
  .trust{gap:1.25rem}
}
@media(max-width:480px){
  .hero-btns{flex-direction:column;align-items:center}
  .iphone{width:220px}
}
`
const LANDING_HTML = `

<!-- Mobile nav -->
<div class="overlay" id="overlay" onclick="closeMob()"></div>
<div class="mob-nav" id="mobNav">
  <div class="mob-close" onclick="closeMob()">✕</div>
  <a href="#how" onclick="closeMob()">How it works</a>
  <a href="#features" onclick="closeMob()">Features</a>
  <a href="#sharing" onclick="closeMob()">Sharing</a>
  <a href="#pricing" onclick="closeMob()">Pricing</a>
  <a href="#faq" onclick="closeMob()">FAQ</a>
  <a href="https://app.simplysous.com/login" onclick="closeMob()">Sign in</a>
  <a href="https://app.simplysous.com/signup" class="nav-btn" onclick="closeMob()">Start free trial</a>
</div>

<!-- NAV -->
<nav id="nav">
  <a href="#" class="logo">Simply <span>Sous</span></a>
  <div class="nav-r">
    <a href="#how" class="nav-r-links">How it works</a>
    <a href="#features" class="nav-r-links">Features</a>
    <a href="#sharing" class="nav-r-links">Sharing</a>
    <a href="#pricing" class="nav-r-links">Pricing</a>
    <a href="https://app.simplysous.com/login" class="nav-r-links">Sign in</a>
    <a href="https://app.simplysous.com/signup" class="nav-btn">Start free trial</a>
    <div class="nav-menu" id="menuBtn" onclick="openMob()">
      <span></span><span></span><span></span>
    </div>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-bg"></div>
  <div class="hero-grain"></div>
  <div class="hero-inner">
    <div class="eyebrow">Meet Simply Sous</div>
    <h1>Dinner,<br><em>decided.</em></h1>
    <p class="hero-sub">Your personal sous chef for the family table.</p>
    <p class="hero-p">Capture recipes from anywhere, plan your week in five minutes, and walk into the kitchen knowing exactly what to make — and when to start.</p>
    <div class="hero-btns">
      <a href="https://app.simplysous.com/signup" class="btn-p">Start your free trial</a>
      <a href="#how" class="btn-s">See how it works <div class="arr">→</div></a>
    </div>
    <p class="hero-trial">14-day free trial · No credit card required</p>
  </div>
</section>

<!-- TRUST BAR -->
<div class="trust">
  <div class="trust-item">14-day free trial</div>
  <div class="trust-item">No credit card required</div>
  <div class="trust-item">Works on any device</div>
  <div class="trust-item">Your data stays yours</div>
  <div class="trust-item">Cancel anytime</div>
</div>

<!-- PROBLEM -->
<section class="problem">
  <div class="section-inner">
    <div class="problem-grid">
      <div class="reveal">
        <div class="ov ov-l">The dinner problem</div>
        <h2 class="sh">Every night,<br>the same <em>exhausting question.</em></h2>
        <p class="sp" style="margin-top:1.25rem">It's 4:30pm. You've managed the kids, the appointments, the house. And now comes the hardest question of the day — not because cooking is hard. Because <em style="font-style:italic;color:var(--clay)">deciding</em> is.</p>
        <p class="sp" style="margin-top:1rem">Simply Sous eliminates the decision entirely. Your week is planned before you even think about it.</p>
      </div>
      <div class="stat-col reveal d2">
        <div class="stat">
          <div class="stat-n">365</div>
          <div class="stat-l">times a year the dinner question gets asked — and answered by you alone.</div>
        </div>
        <div class="stat">
          <div class="stat-n">40<span style="font-size:1.8rem">min</span></div>
          <div class="stat-l">average time families spend deciding what to cook before actually cooking it.</div>
        </div>
        <div class="stat">
          <div class="stat-n">0</div>
          <div class="stat-l">times you'll have to answer "what's for dinner?" once Simply Sous is running.</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section class="how" id="how">
  <div class="section-inner">
    <div class="center reveal">
      <div class="ov ov-d">How it works</div>
      <h2 class="sh-d">Four steps to a<br><em>dinner-decided week.</em></h2>
    </div>
    <div class="steps">
      <div class="step reveal d1">
        <div class="step-n">1</div>
        <span class="step-ico">📸</span>
        <div class="step-t">Build your recipe vault</div>
        <div class="step-d">Screenshot a TikTok, snap a cookbook page, paste a URL. AI reads it and stores a clean, tagged recipe in your personal vault instantly.</div>
      </div>
      <div class="step reveal d2">
        <div class="step-n">2</div>
        <span class="step-ico">📅</span>
        <div class="step-t">Review your week</div>
        <div class="step-d">On your chosen planning day, AI pre-builds your entire week from your vault. Review, swap meals, toggle off nights you're eating out. Done in 5 minutes.</div>
      </div>
      <div class="step reveal d3">
        <div class="step-n">3</div>
        <span class="step-ico">🛒</span>
        <div class="step-t">Shop with one list</div>
        <div class="step-d">Your grocery list auto-generates — merged, sorted by store section, trimmed by what's already in your pantry. Sent to your phone automatically.</div>
      </div>
      <div class="step reveal d4">
        <div class="step-n">4</div>
        <span class="step-ico">🍽️</span>
        <div class="step-t">Cook with confidence</div>
        <div class="step-d">Tonight's dinner greets you on the home screen. A smart countdown tells you exactly when to start. Step-by-step from there.</div>
      </div>
    </div>
  </div>
</section>

<!-- FEATURES -->
<section class="features" id="features">
  <div class="section-inner">
    <div class="reveal" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:1.5rem;margin-bottom:0">
      <div>
        <div class="ov ov-l">Everything included</div>
        <h2 class="sh">Built for the way<br><em>families actually eat.</em></h2>
      </div>
      <p style="font-size:1.05rem;color:rgba(248,243,236,.35);max-width:280px;text-align:right;line-height:1.8">Every feature designed around one question: what does a busy parent actually need at 5pm on a Tuesday?</p>
    </div>
    <div class="bento">
      <div class="bc feat c7 reveal">
        <div class="btag">✦ AI-Powered Planning</div>
        <div class="bt">Your week planned before you even open the app.</div>
        <div class="bd">AI picks from your vault, balances variety, honors rotation rules, skips your blackout days, and accounts for what's in your pantry — all before you sit down to review.</div>
        <div class="bpills">
          <div class="bpill on">Custom planning day</div>
          <div class="bpill on">Blackout days</div>
          <div class="bpill on">Up to 4-week view</div>
          <div class="bpill on">Rotation rules</div>
          <div class="bpill">Pantry-aware</div>
        </div>
      </div>
      <div class="bc c5 reveal d1">
        <span class="bico">📸</span>
        <div class="bt">Capture from anywhere</div>
        <div class="bd">Instagram, TikTok, cookbook pages, recipe URLs — AI reads it all and converts to a standardized recipe with tags and family-scaled quantities.</div>
        <div class="bcode">📷 Photo uploaded...<br>✓ Recipe extracted<br>✓ 9 tags generated<br>✓ Scaled to your family</div>
      </div>
      <div class="bc c4 reveal d1">
        <span class="bico">📚</span>
        <div class="bt">Built-in recipe database</div>
        <div class="bd">Thousands of curated recipes to start from day one — filterable by dietary needs, cuisine, cook time, and flavor preferences set in your profile.</div>
        <div class="bpills">
          <div class="bpill on">Vegan · Dairy-free</div>
          <div class="bpill on">Gluten-free</div>
          <div class="bpill">Personalized curation</div>
        </div>
      </div>
      <div class="bc c8 reveal d2">
        <span class="bico">🛒</span>
        <div class="bt">One grocery list. Zero duplicates. Sent to your phone.</div>
        <div class="bd">Ingredients across all planned meals are merged, quantities combined, and organized by store section. Check off pantry items and the list shrinks to exactly what you need — then it's texted or emailed directly to you.</div>
        <div class="bpills">
          <div class="bpill on">Sorted by aisle</div>
          <div class="bpill on">Pantry deduct</div>
          <div class="bpill on">SMS + email delivery</div>
          <div class="bpill">Weekly or per-shop</div>
        </div>
      </div>
      <div class="bc c6 reveal">
        <span class="bico">⚡</span>
        <div class="bt">Panic button for chaotic nights</div>
        <div class="bd">Soccer ran late. One tap shows your saved favorites — meals under 20 minutes using pantry staples. Swap dinner in 5 seconds, no guilt.</div>
      </div>
      <div class="bc c6 reveal d1">
        <span class="bico">🔔</span>
        <div class="bt">Reminders that actually help</div>
        <div class="bd">Custom planning day reminder. Daily "start cooking now" alert timed back from your dinner hour. Grocery list delivered after you plan. All automatic.</div>
        <div class="bcode" style="margin-top:1rem">📅 Your planning day · 9am<br>⏰ Daily · Start dinner by 5:25pm<br>🛒 Auto-send after planning</div>
      </div>
      <div class="bc c5 reveal d2">
        <span class="bico">👨‍👩‍👧‍👦</span>
        <div class="bt">Built for your family's preferences</div>
        <div class="bd">Dietary restrictions, favorite cuisines, picky eaters, ingredients anyone hates — all captured in onboarding and respected in every single recommendation.</div>
      </div>
      <div class="bc c7 reveal">
        <span class="bico">📅</span>
        <div class="bt">Plan up to a month ahead</div>
        <div class="bd">Default is weekly, but toggle to the month view and see exactly what's coming. Weekly shopping lists still generate for each upcoming week — you never need to shop for 4 weeks at once. Just plan with total visibility.</div>
      </div>
    </div>
  </div>
</section>

<!-- TODAY / PHONE -->
<section class="phone-sec">
  <div class="section-inner">
    <div class="phone-grid">
      <div class="reveal">
        <div class="ov ov-d">The today view</div>
        <h2 class="sh-d">Walk in the kitchen.<br><em>Everything is waiting.</em></h2>
        <p class="sp-d">Your home screen is built around the single most important moment of the day — 5pm, kids are home, you need to know what to do next.</p>
        <div class="feats-list">
          <div class="fi">
            <div class="fi-dot">⏰</div>
            <div><div class="fi-n">Smart prep countdown</div><div class="fi-d">AI calculates exactly when you need to start based on tonight's cook time and your dinner hour — and reminds you.</div></div>
          </div>
          <div class="fi">
            <div class="fi-dot">📋</div>
            <div><div class="fi-n">Step-by-step cook mode</div><div class="fi-d">Tap through each step one at a time, scaled to your family. No scrolling, no losing your place mid-cook.</div></div>
          </div>
          <div class="fi">
            <div class="fi-dot">⭐</div>
            <div><div class="fi-n">Rate after dinner</div><div class="fi-d">Quick family reaction after the meal. Simply Sous learns what lands and gets smarter with every week.</div></div>
          </div>
          <div class="fi">
            <div class="fi-dot">⚡</div>
            <div><div class="fi-n">Last-minute swap</div><div class="fi-d">Plans changed? Tap your favorites list for quick-win dinners using what you already have at home.</div></div>
          </div>
        </div>
      </div>
      <div class="iphone-wrap reveal d2">
        <div class="iphone">
          <div class="iphone-body">
            <div class="dynamic-island"></div>
            <div class="iscreen">
              <div class="iscreen-top">
                <div class="iscreen-greeting">Good afternoon</div>
                <div class="iscreen-date">Tuesday, April 1</div>
              </div>
              <div class="iscreen-meal-card">
                <div class="imc-top">
                  <div class="imc-label">Tonight's dinner</div>
                  <div class="imc-name">Winger Honey Buffalo Salad</div>
                  <div class="imc-meta"><span>⏱ 35 min</span><span>👨‍👩‍👧‍👦 Serves 5</span><span>⭐ Fam fav</span></div>
                </div>
                <div class="imc-timer">
                  <div><div class="imc-t-l">Start by</div><div class="imc-t-v">5:25 PM</div></div>
                  <div style="text-align:right"><div class="imc-t-l">Ready at</div><div class="imc-t-v">6:00 PM</div></div>
                </div>
              </div>
              <div class="iscreen-steps">
                <div class="iscreen-step-label">Steps</div>
                <div class="ist"><div class="ist-n">01</div><div class="ist-t">Pull chicken from fridge. Preheat oven to 400°F.</div></div>
                <div class="ist"><div class="ist-n">02</div><div class="ist-t">Toss wings in olive oil, salt, garlic. Bake 25 min.</div></div>
                <div class="ist"><div class="ist-n">03</div><div class="ist-t">Prep romaine, shred carrots, slice celery.</div></div>
                <div class="ist"><div class="ist-n">04</div><div class="ist-t">Whisk honey + buffalo + butter. Toss hot wings.</div></div>
              </div>
            </div>
            <div class="iphone-home"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- SHARING -->
<section class="sharing" id="sharing">
  <div class="section-inner">
    <div class="center reveal">
      <div class="ov ov-l">Recipes worth sharing</div>
      <h2 class="sh">Share recipes.<br><em>Grow your table.</em></h2>
      <p class="sp" style="max-width:520px;margin:1rem auto 0">Your best meals deserve to be shared. Send a single recipe, share a curated collection, or give a sister live access to your whole vault.</p>
    </div>
    <div class="share-grid reveal d1">
      <div class="share-card">
        <span class="share-ico">🔗</span>
        <div class="share-t">Share a single recipe</div>
        <div class="share-d">One tap generates a beautiful recipe card link. Anyone can open it — even without a Simply Sous account. They can save it to their own vault with one more tap.</div>
        <div class="share-tag">Your best growth mechanic</div>
      </div>
      <div class="share-card">
        <span class="share-ico">📂</span>
        <div class="share-t">Share a collection</div>
        <div class="share-d">Curate a named collection — "Quick Weeknights," "Kid Approved," "Date Night" — and share the whole set. Recipients browse and import what they love.</div>
        <div class="share-tag">Perfect for family groups</div>
      </div>
      <div class="share-card">
        <span class="share-ico">👯</span>
        <div class="share-t">Follow a vault</div>
        <div class="share-d">Give trusted people a live view of your recipe vault. When you add something new, they see it automatically. Like a private recipe feed between people who cook for each other.</div>
        <div class="share-tag">Sisters. Close friends. Family.</div>
      </div>
    </div>
  </div>
</section>

<!-- ONBOARDING -->
<section class="onboard">
  <div class="section-inner">
    <div class="reveal" style="max-width:580px">
      <div class="ov ov-d">Personal setup</div>
      <h2 class="sh-d">Onboarding that<br><em>actually learns you.</em></h2>
      <p class="sp-d">A 5-minute setup that captures your family's food DNA — so every recommendation feels like it was made specifically for you. And a preferences hub to update anything, anytime.</p>
    </div>
    <div class="ob-steps reveal d1">
      <div class="ob-step" data-n="01">
        <span class="ob-ico">👨‍👩‍👧‍👦</span>
        <div class="ob-t">Family profile</div>
        <div class="ob-d">Family size, ages, your dinner hour, and which nights to skip from the rotation.</div>
      </div>
      <div class="ob-step" data-n="02">
        <span class="ob-ico">🥦</span>
        <div class="ob-t">Food preferences</div>
        <div class="ob-d">Cuisines you love, ingredients anyone dislikes, dietary restrictions and allergies — hard limits AI will never break.</div>
      </div>
      <div class="ob-step" data-n="03">
        <span class="ob-ico">📅</span>
        <div class="ob-t">Planning schedule</div>
        <div class="ob-d">Your custom planning day, reminder time, and dinner hour. Set it once — reminders and countdowns run automatically from here.</div>
      </div>
      <div class="ob-step" data-n="04">
        <span class="ob-ico">🏠</span>
        <div class="ob-t">Pantry staples</div>
        <div class="ob-d">Log ingredients you always keep stocked. AI reduces your shopping list and builds meals around what you already have.</div>
      </div>
      <div class="ob-step" data-n="05">
        <span class="ob-ico">📸</span>
        <div class="ob-t">Add your first recipes</div>
        <div class="ob-d">Upload screenshots, photos, or URLs to seed your personal vault. Skip if you prefer — the built-in database has you covered from day one.</div>
      </div>
    </div>
  </div>
</section>

<!-- DOT AI -->
<section class="dot-section">
  <div class="section-inner">
    <div class="dot-grid">
      <div class="reveal">
        <div class="ov ov-l">Meet Dot</div>
        <h2 class="sh">Your kitchen's<br><em>wisest voice.</em></h2>
        <p class="sp">Dot is Simply Sous's built-in AI assistant — warm, knowledgeable, and entirely focused on making dinner easier. Ask her anything. She knows your vault, your family, and your preferences.</p>
        <div class="dot-feats" style="margin-top:2.5rem">
          <div class="dot-feat">
            <div class="dot-feat-ico">🔍</div>
            <div><div class="dot-feat-n">Search your vault by feeling</div><div class="dot-feat-d">"Something cozy for a cold Tuesday" — Dot understands what you mean and finds the right recipe from your saved collection.</div></div>
          </div>
          <div class="dot-feat">
            <div class="dot-feat-ico">🔄</div>
            <div><div class="dot-feat-n">Substitutions on the fly</div><div class="dot-feat-d">Don't have heavy cream? Dot suggests what to swap, adjusts quantities, and tells you if it'll change the dish.</div></div>
          </div>
          <div class="dot-feat">
            <div class="dot-feat-ico">🎤</div>
            <div><div class="dot-feat-n">Voice button — hands free</div><div class="dot-feat-d">Tap and hold to speak to Dot while your hands are covered in flour. She responds with the next step, a timer, or answers your question aloud.</div></div>
          </div>
          <div class="dot-feat">
            <div class="dot-feat-ico">📅</div>
            <div><div class="dot-feat-n">Add to the plan from chat</div><div class="dot-feat-d">"Add the Tuscan pasta to Thursday" and it's done — weekly plan and grocery list update automatically.</div></div>
          </div>
        </div>
      </div>
      <div class="reveal d2">
        <div class="dot-chat">
          <div class="dot-header">
            <div class="dot-avatar">🍲</div>
            <div><div class="dot-n">Dot</div><div class="dot-s">Knows your 47 saved recipes · always listening</div></div>
          </div>
          <div class="dot-msgs">
            <div class="msg u">What can I make with the rotisserie chicken in my fridge?</div>
            <div class="msg a">You've got 3 great options from your vault! <strong>Creamy Tuscan Pasta</strong> works perfectly — shredded rotisserie saves 15 minutes. <strong>Sheet Pan Tacos</strong> is another easy win. Want me to add one to tonight's plan?</div>
            <div class="msg u">Add the pasta to Thursday and tell me what I'm missing</div>
            <div class="msg a">Done — Thursday is now Tuscan Pasta. Based on your pantry, you have everything except <strong>sun-dried tomatoes</strong>. I've added them to this week's grocery list. Or I can suggest a quick sub!</div>
          </div>
          <div class="dot-input">
            <div class="dot-field">Ask Dot anything...</div>
            <div class="dot-mic">🎤</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- STORY -->
<section class="story">
  <div class="section-inner center reveal" style="max-width:760px;margin:0 auto">
    <div class="ov ov-d" style="justify-content:center">Why we built this</div>
    <blockquote class="story-q">"I watched my wife answer the dinner question <em>every single night</em> — and realized it wasn't about the cooking. It was about the deciding. So I built her a sous chef."</blockquote>
    <div class="story-attr">— The founder &nbsp;·&nbsp; <span>Built for family, open to yours</span></div>
  </div>
</section>

<!-- PRICING -->
<section class="pricing" id="pricing">
  <div class="section-inner">
    <div class="center reveal">
      <div class="ov ov-l" style="justify-content:center">Simple, honest pricing</div>
      <h2 class="sh">One price tier<br><em>for every family.</em></h2>
      <p class="sp" style="max-width:480px;margin:1rem auto 0">Start free. Stay as long as you need. Choose the plan that fits your life — and know that everything Simply Sous builds, you get.</p>
    </div>
    <div class="trial-banner reveal d1">
      <div class="trial-ico">🎁</div>
      <div class="trial-text">
        <strong>Start with a 14-day free trial — no credit card required</strong>
        <span>Full access to every feature. See if Simply Sous changes your evenings. Cancel with one click if it doesn't.</span>
      </div>
    </div>
    <div class="pricing-cards reveal d1">
      <div class="pc">
        <div class="pc-top-bar"></div>
        <div class="pc-badge">Monthly</div>
        <div class="pc-name">Flexible</div>
        <div class="pc-price"><sup>$</sup>7<sub>.99/mo</sub></div>
        <div class="pc-cadence">Billed monthly · Cancel anytime</div>
        <div class="pc-feats">
          <div class="pcf">Unlimited recipe vault</div>
          <div class="pcf">AI meal planning</div>
          <div class="pcf">Smart grocery lists</div>
          <div class="pcf">Today view + cook mode</div>
          <div class="pcf">Dot AI assistant</div>
          <div class="pcf">Recipe sharing</div>
          <div class="pcf">All core features</div>
        </div>
        <a href="https://app.simplysous.com/signup" class="pc-cta">Start free trial</a>
      </div>
      <div class="pc pop">
        <div class="pc-top-bar"></div>
        <div class="pc-badge">Most popular</div>
        <div class="pc-name">Annual</div>
        <div class="pc-price"><sup>$</sup>79<sub>.99/yr</sub></div>
        <div class="pc-save">Save 20% vs monthly · Just $6.67/mo</div>
        <div class="pc-cadence">Billed once a year · Cancel anytime</div>
        <div class="pc-feats">
          <div class="pcf">Everything in Flexible</div>
          <div class="pcf">Priority new features</div>
          <div class="pcf">Recipe collections + sharing</div>
          <div class="pcf">Month-ahead planning view</div>
          <div class="pcf">Built-in recipe database</div>
          <div class="pcf">Vault follow for family</div>
        </div>
        <a href="https://app.simplysous.com/signup" class="pc-cta">Start free trial</a>
      </div>
      <div class="pc">
        <div class="pc-top-bar"></div>
        <div class="pc-badge">Lifetime</div>
        <div class="pc-name">Forever</div>
        <div class="pc-price"><sup>$</sup>119<sub style="font-size:.85rem">.99</sub></div>
        <div class="pc-save">Pays off vs monthly in 15 months</div>
        <div class="pc-cadence">One payment · Yours forever · All future updates</div>
        <div class="pc-feats">
          <div class="pcf">Everything in Annual</div>
          <div class="pcf">All future features, free</div>
          <div class="pcf">No price increases ever</div>
          <div class="pcf">Early access to new features</div>
          <div class="pcf">Founding member status</div>
        </div>
        <a href="https://app.simplysous.com/signup" class="pc-cta">Get lifetime access</a>
      </div>
    </div>
    <p class="pricing-note">All plans include a 14-day free trial · Your recipes, your data, always yours · Cancel in one click</p>
  </div>
</section>

<!-- FAQ -->
<section class="faq" id="faq">
  <div class="section-inner center">
    <div class="reveal">
      <div class="ov ov-l" style="justify-content:center">Questions</div>
      <h2 class="sh" style="margin-top:.5rem">Answered.</h2>
    </div>
    <div class="faq-list reveal d1">
      <div class="faq-item open">
        <div class="faq-q"><div class="faq-question">What devices does Simply Sous work on?</div><div class="faq-tog">+</div></div>
        <div class="faq-ans">Simply Sous is a web app — it works on any device with a browser. Phone, tablet, laptop, desktop. No download required. Bookmark it on your phone's home screen and it feels completely native.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q"><div class="faq-question">What does the 14-day free trial include?</div><div class="faq-tog">+</div></div>
        <div class="faq-ans">Everything. Full access to the recipe vault, AI meal planning, grocery lists, Dot the AI assistant, sharing features, and the built-in recipe database. No credit card, no commitment. If Simply Sous doesn't change your evenings, cancel with one click.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q"><div class="faq-question">How does the AI recipe capture work?</div><div class="faq-tog">+</div></div>
        <div class="faq-ans">Three ways: paste a URL from any recipe website, upload a screenshot or photo (including cookbook pages and handwritten cards), or type it manually. AI reads the source, extracts the recipe, standardizes the format, and auto-generates tags — all in seconds.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q"><div class="faq-question">Can my whole family use it?</div><div class="faq-tog">+</div></div>
        <div class="faq-ans">Yes. Simply Sous supports multiple family members from day one. Your spouse can view the week's plan, the grocery list, and tonight's recipe. You can also share recipe collections with sisters, close friends, or anyone you cook for.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q"><div class="faq-question">What if we always eat out on certain nights?</div><div class="faq-tog">+</div></div>
        <div class="faq-ans">You can blackout any days of the week during onboarding — or toggle them off anytime in your preferences. Sunday family dinner, Wednesday pizza night, Friday date night — Simply Sous skips those days and only plans the nights you actually cook.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q"><div class="faq-question">Is my recipe data private?</div><div class="faq-tog">+</div></div>
        <div class="faq-ans">Completely. Your recipe vault is private to your account. We never share your recipes, meal plans, or family preferences with anyone. Your data is stored securely and belongs entirely to you.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q"><div class="faq-question">What's the difference between the Annual and Lifetime plans?</div><div class="faq-tog">+</div></div>
        <div class="faq-ans">Annual renews each year at $79.99. Lifetime is a single payment of $119.99 and you're done forever — including every feature we add in the future. If you use Simply Sous for more than 15 months, Lifetime pays for itself. Most families who fall in love with it choose Lifetime.</div>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER CTA -->
<section class="footer-cta">
  <div class="footer-cta-inner">
    <div class="reveal">
      <div class="ov ov-l" style="justify-content:center">Ready?</div>
      <h2 class="footer-cta-t">Dinner,<br><em>decided.</em></h2>
      <p class="footer-cta-sub">Stop answering the question. Start enjoying the meal.</p>
      <a href="https://app.simplysous.com/signup" class="btn-p" style="font-size:1rem;padding:1.05rem 2.75rem">Start your free trial</a>
      <p style="font-size:.78rem;color:rgba(248,243,236,.2);margin-top:.85rem">14 days free · No credit card · Cancel anytime</p>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="f-logo">Simply <span>Sous</span></div>
    <div class="f-tag">Dinner, decided. · Built with love for the family table.</div>
    <div class="f-links">
      <a href="#">Privacy</a>
      <a href="#">Terms</a>
      <a href="#">Contact</a>
    </div>
  </div>
`
