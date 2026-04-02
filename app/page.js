'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const getClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

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

function LandingPage() {
  useEffect(() => {
    document.querySelectorAll('.faq-item').forEach(item => {
      item.querySelector('.faq-q')?.addEventListener('click', () => {
        const was = item.classList.contains('open')
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'))
        if (!was) item.classList.add('open')
      })
    })
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target) } })
    }, { threshold: 0.06, rootMargin: '0px 0px -20px 0px' })
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    const nav = document.getElementById('nav')
    const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const t = document.querySelector(a.getAttribute('href'))
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
      })
    })
    window.openMob = () => { document.getElementById('mobNav')?.classList.add('open'); document.getElementById('overlay')?.classList.add('open') }
    window.closeMob = () => { document.getElementById('mobNav')?.classList.remove('open'); document.getElementById('overlay')?.classList.remove('open') }
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <>
      <style>{LANDING_CSS}</style>
      <div dangerouslySetInnerHTML={{ __html: LANDING_HTML }} />
    </>
  )
}

export default function RootPage() {
  const [isApp, setIsApp] = useState(null)
  useEffect(() => { setIsApp(window.location.hostname.startsWith('app.')) }, [])
  if (isApp === null) return (
    <div style={{minHeight:'100vh',background:'#1A1612',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:24,height:24,border:'2px solid rgba(184,135,74,0.2)',borderTopColor:'#B8874A',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  return isApp ? <AppRedirect /> : <LandingPage />
}

const LANDING_CSS = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Outfit:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ink:#1A1612;--ink2:#2C2420;
  --parchment:#F8F3EC;--warm:#F2EBE0;--sand:#E2D5C3;
  --clay:#B8874A;--clay-l:#D4A46A;
  --ember:#C05C30;
  --sage-l:#8FA889;
  --mid:#7A6C5E;
}
html{scroll-behavior:smooth}
body{background:var(--ink);color:var(--parchment);font-family:'Outfit',sans-serif;font-weight:300;line-height:1.6;overflow-x:hidden}

/* NAV */
nav{position:fixed;top:0;left:0;right:0;z-index:200;display:flex;align-items:center;justify-content:space-between;padding:1.5rem 5%;transition:all .4s}
nav.scrolled{background:rgba(26,22,18,.95);backdrop-filter:blur(20px);padding:1rem 5%;border-bottom:1px solid rgba(255,255,255,.05)}
.logo{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:600;color:var(--parchment);text-decoration:none}
.logo span{color:var(--clay);font-style:italic}
.nav-r{display:flex;align-items:center;gap:2rem}
.nav-r a{font-size:.97rem;color:rgba(248,243,236,.7);text-decoration:none;transition:color .2s}
.nav-r a:hover{color:var(--parchment)}
.nav-btn{background:var(--clay);color:var(--ink)!important;padding:.55rem 1.4rem;border-radius:2rem;font-weight:500;font-size:.88rem;transition:background .2s,transform .2s!important}
.nav-btn:hover{background:var(--clay-l)!important;transform:translateY(-1px)}
.nav-menu{display:none;flex-direction:column;gap:.3rem;cursor:pointer;padding:.5rem}
.nav-menu span{width:22px;height:1.5px;background:var(--parchment);display:block;transition:all .3s}

/* HERO */
.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:8rem 5% 5rem;position:relative;overflow:hidden}
.hero-bg{position:absolute;inset:0;background:radial-gradient(ellipse 90% 70% at 50% 0%,rgba(184,135,74,.12) 0%,transparent 65%),radial-gradient(ellipse 40% 40% at 80% 90%,rgba(192,92,48,.08) 0%,transparent 55%)}
.hero-grain{position:absolute;inset:0;opacity:.25;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E");pointer-events:none}
.hero-inner{position:relative;z-index:1;max-width:760px;margin:0 auto}
.eyebrow{display:inline-flex;align-items:center;gap:.6rem;font-size:.78rem;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--clay);margin-bottom:2rem;opacity:0;animation:up .9s cubic-bezier(.16,1,.3,1) .2s forwards}
.eyebrow::before,.eyebrow::after{content:'';width:2rem;height:1px;background:var(--clay);opacity:.5}
h1{font-family:'Cormorant Garamond',serif;font-size:clamp(3.5rem,8vw,6.5rem);font-weight:300;line-height:.9;letter-spacing:-.02em;color:var(--parchment);opacity:0;animation:up 1s cubic-bezier(.16,1,.3,1) .4s forwards}
h1 em{font-style:italic;color:var(--clay)}
.hero-sub{font-size:clamp(1.05rem,2vw,1.3rem);color:rgba(248,243,236,.65);max-width:500px;margin:1.75rem auto 0;line-height:1.75;opacity:0;animation:up .9s cubic-bezier(.16,1,.3,1) .65s forwards}
.hero-btns{display:flex;align-items:center;justify-content:center;gap:1.25rem;margin-top:2.5rem;flex-wrap:wrap;opacity:0;animation:up .9s cubic-bezier(.16,1,.3,1) .85s forwards}
.btn-p{font-size:1rem;font-weight:500;color:var(--ink);background:var(--clay);padding:1rem 2.5rem;border-radius:3rem;text-decoration:none;transition:background .2s,transform .2s,box-shadow .2s;box-shadow:0 8px 32px rgba(184,135,74,.35)}
.btn-p:hover{background:var(--clay-l);transform:translateY(-2px);box-shadow:0 14px 40px rgba(184,135,74,.45)}
.btn-s{font-size:1rem;color:rgba(248,243,236,.65);text-decoration:none;display:flex;align-items:center;gap:.5rem;transition:color .2s}
.btn-s:hover{color:var(--parchment)}
.arr{width:1.9rem;height:1.9rem;border-radius:50%;border:1px solid rgba(248,243,236,.2);display:flex;align-items:center;justify-content:center;font-size:.7rem;transition:all .2s}
.btn-s:hover .arr{border-color:rgba(248,243,236,.5);transform:translateX(3px)}
.hero-trial{font-size:.85rem;color:rgba(248,243,236,.35);margin-top:.85rem;letter-spacing:.05em;opacity:0;animation:up .9s cubic-bezier(.16,1,.3,1) 1s forwards}

/* DEMO / PHONE MOCKUP */
.hero-demo{position:relative;z-index:1;margin-top:4rem;opacity:0;animation:up 1s cubic-bezier(.16,1,.3,1) 1.1s forwards}
.demo-phone{width:280px;margin:0 auto;background:#111;border-radius:2.8rem;padding:.5rem;box-shadow:0 0 0 .5px rgba(255,255,255,.12),0 40px 100px rgba(0,0,0,.6),inset 0 0 0 .5px rgba(255,255,255,.04)}
.demo-body{background:#1A1612;border-radius:2.4rem;overflow:hidden}
.demo-island{width:5.5rem;height:1.4rem;background:#000;border-radius:2rem;margin:.7rem auto .4rem;position:relative;z-index:2}
.demo-screen{min-height:520px;position:relative}
.demo-slide{position:absolute;inset:0;transition:opacity .8s ease,transform .8s ease;opacity:0;transform:translateY(8px)}
.demo-slide.active{opacity:1;transform:translateY(0);z-index:1}

/* Screen 1 - Tonight */
.ds-hd{background:linear-gradient(135deg,rgba(184,135,74,.15),rgba(192,92,48,.06));padding:1rem 1.1rem .8rem;border-bottom:1px solid rgba(255,255,255,.05)}
.ds-eyebrow{font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;color:var(--clay);margin-bottom:.2rem}
.ds-title{font-family:'Cormorant Garamond',serif;font-size:1.05rem;color:var(--parchment)}
.ds-card{margin:.75rem .75rem 0;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);border-radius:1rem;overflow:hidden}
.ds-card-top{padding:.8rem 1rem;border-bottom:1px solid rgba(255,255,255,.05)}
.ds-label{font-size:.5rem;letter-spacing:.1em;text-transform:uppercase;color:rgba(248,243,236,.45);margin-bottom:.2rem}
.ds-meal{font-family:'Cormorant Garamond',serif;font-size:1rem;color:var(--parchment);line-height:1.2;margin-bottom:.35rem}
.ds-meta{display:flex;gap:.6rem;font-size:.52rem;color:rgba(248,243,236,.5)}
.ds-timer{display:flex;justify-content:space-between;background:rgba(192,92,48,.1);padding:.65rem 1rem}
.ds-tl{font-size:.52rem;text-transform:uppercase;letter-spacing:.08em;color:var(--ember)}
.ds-tv{font-family:'Cormorant Garamond',serif;font-size:1.05rem;color:var(--parchment)}
.ds-steps{padding:.6rem .75rem}
.ds-step{display:flex;gap:.4rem;padding:.3rem 0;border-bottom:1px solid rgba(255,255,255,.04)}
.ds-sn{font-size:.55rem;color:var(--clay);font-weight:600;min-width:.8rem;padding-top:.05rem}
.ds-st{font-size:.62rem;color:rgba(248,243,236,.72);line-height:1.45}

/* Screen 2 - Plan */
.ds-plan-hd{padding:.85rem 1rem;border-bottom:1px solid rgba(255,255,255,.05)}
.ds-plan-week{font-size:.58rem;letter-spacing:.1em;text-transform:uppercase;color:var(--clay);margin-bottom:.15rem}
.ds-plan-title{font-family:'Cormorant Garamond',serif;font-size:1rem;color:var(--parchment)}
.ds-day{display:flex;align-items:center;gap:.75rem;padding:.55rem 1rem;border-bottom:1px solid rgba(255,255,255,.04)}
.ds-day-name{font-size:.58rem;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:rgba(248,243,236,.35);width:2.2rem;flex-shrink:0}
.ds-day-recipe{font-size:.72rem;color:rgba(248,243,236,.82);flex:1;line-height:1.3}
.ds-day-time{font-size:.58rem;color:var(--clay)}
.ds-day.tonight .ds-day-name{color:var(--clay)}
.ds-day.tonight .ds-day-recipe{color:var(--parchment);font-weight:400}

/* Screen 3 - Dot */
.ds-dot-hd{background:rgba(255,255,255,.03);padding:.85rem 1rem;display:flex;align-items:center;gap:.65rem;border-bottom:1px solid rgba(255,255,255,.05)}
.ds-dot-av{width:2rem;height:2rem;border-radius:50%;background:linear-gradient(135deg,#D4A46A,#8FA889);display:flex;align-items:center;justify-content:center;font-size:.75rem;flex-shrink:0}
.ds-dot-n{font-size:.85rem;font-weight:500;color:var(--parchment)}
.ds-dot-s{font-size:.6rem;color:var(--sage-l)}
.ds-msgs{padding:.85rem .9rem;display:flex;flex-direction:column;gap:.65rem}
.ds-msg{max-width:85%;border-radius:1.1rem;padding:.65rem .85rem;font-size:.68rem;line-height:1.55}
.ds-msg.u{background:rgba(184,135,74,.18);color:var(--parchment);align-self:flex-end;border-bottom-right-radius:.25rem}
.ds-msg.a{background:rgba(255,255,255,.06);color:rgba(248,243,236,.75);align-self:flex-start;border-bottom-left-radius:.25rem}
.ds-msg.a strong{color:var(--clay);font-weight:500}

/* Slide dots */
.demo-dots{display:flex;gap:.5rem;justify-content:center;margin-top:1.25rem}
.demo-dot{width:.45rem;height:.45rem;border-radius:50%;background:rgba(255,255,255,.15);transition:background .3s,transform .3s}
.demo-dot.active{background:var(--clay);transform:scale(1.2)}
.iphone-home{width:3.5rem;height:.3rem;background:rgba(255,255,255,.18);border-radius:1rem;margin:.55rem auto}

/* TRUST BAR */
.trust{background:rgba(255,255,255,.025);border-top:1px solid rgba(255,255,255,.05);border-bottom:1px solid rgba(255,255,255,.05);padding:1.4rem 5%;display:flex;align-items:center;justify-content:center;gap:2.5rem;flex-wrap:wrap}
.trust-item{display:flex;align-items:center;gap:.5rem;font-size:.92rem;color:rgba(248,243,236,.6)}
.trust-item::before{content:'✓';color:var(--sage-l);font-size:.75rem;font-weight:600}

/* SECTIONS */
section{padding:8rem 5%;position:relative}
.section-inner{max-width:1100px;margin:0 auto}
.center{text-align:center}
.ov{font-size:.75rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;display:inline-flex;align-items:center;gap:.6rem;margin-bottom:1.25rem;color:var(--ember)}
.ov::before,.ov::after{content:'';width:1.5rem;height:1px;background:var(--ember);opacity:.7}
.ov-d{color:var(--ember)}
.ov-d::before,.ov-d::after{content:'';width:1.5rem;height:1px;background:var(--ember);opacity:.7}
.sh{font-family:'Cormorant Garamond',serif;font-size:clamp(2.2rem,4.5vw,3.75rem);font-weight:300;line-height:1.05;color:var(--parchment);letter-spacing:-.01em}
.sh em{font-style:italic;color:var(--clay)}
.sh-d{font-family:'Cormorant Garamond',serif;font-size:clamp(2.2rem,4.5vw,3.75rem);font-weight:300;line-height:1.05;color:var(--ink);letter-spacing:-.01em}
.sh-d em{font-style:italic;color:var(--ember)}
.sp{font-size:1.05rem;color:rgba(248,243,236,.72);line-height:1.9;margin-top:1.1rem}
.sp-d{font-size:1.05rem;color:var(--mid);line-height:1.9;margin-top:1.1rem}

/* PROBLEM */
.problem{background:var(--ink)}
.problem-grid{display:grid;grid-template-columns:1fr 1fr;gap:7rem;align-items:center}
.stat-col{display:flex;flex-direction:column;gap:2.75rem}
.stat{border-left:2px solid rgba(184,135,74,.15);padding-left:2rem}
.stat-n{font-family:'Cormorant Garamond',serif;font-size:4rem;font-weight:300;color:var(--clay);line-height:1;letter-spacing:-.02em}
.stat-l{font-size:1rem;color:rgba(248,243,236,.65);margin-top:.4rem;line-height:1.65}

/* HOW */
.how{background:var(--warm)}
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:2.5rem;margin-top:4.5rem;position:relative}
.steps::before{content:'';position:absolute;top:2.3rem;left:calc(12.5% + 1rem);right:calc(12.5% + 1rem);height:1px;background:linear-gradient(to right,transparent,var(--sand),transparent)}
.step{text-align:center;padding:0 .75rem}
.step-n{width:2.75rem;height:2.75rem;border-radius:50%;background:var(--ink);color:var(--clay);font-family:'Cormorant Garamond',serif;font-size:1rem;font-weight:600;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;position:relative;z-index:1}
.step-ico{font-size:1.85rem;margin-bottom:1rem;display:block}
.step-t{font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:500;color:var(--ink);margin-bottom:.6rem;line-height:1.2}
.step-d{font-size:.97rem;color:var(--mid);line-height:1.8}

/* FEATURES BENTO */
.features{background:var(--ink)}
.bento{display:grid;grid-template-columns:repeat(12,1fr);gap:1rem;margin-top:3.5rem}
.bc{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:1.5rem;padding:2.25rem;transition:background .3s,border-color .3s,transform .3s;overflow:hidden}
.bc:hover{background:rgba(255,255,255,.065);border-color:rgba(184,135,74,.18);transform:translateY(-3px)}
.bc.feat{background:rgba(184,135,74,.07);border-color:rgba(184,135,74,.18)}
.bc.feat:hover{background:rgba(184,135,74,.11);border-color:rgba(184,135,74,.3)}
.c7{grid-column:span 7}.c5{grid-column:span 5}.c4{grid-column:span 4}.c8{grid-column:span 8}.c6{grid-column:span 6}.c12{grid-column:span 12}
.btag{display:inline-flex;align-items:center;gap:.35rem;font-size:.65rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--clay);background:rgba(184,135,74,.1);border:1px solid rgba(184,135,74,.2);padding:.28rem .7rem;border-radius:2rem;margin-bottom:1.1rem}
.bico{font-size:2.1rem;margin-bottom:1.25rem;display:block}
.bt{font-family:'Cormorant Garamond',serif;font-size:1.55rem;font-weight:400;color:var(--parchment);line-height:1.2;margin-bottom:.65rem}
.bc.feat .bt{font-size:1.9rem}
.bd{font-size:1rem;color:rgba(248,243,236,.72);line-height:1.85}
.bpills{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:1.1rem}
.bpill{font-size:.72rem;padding:.25rem .7rem;border-radius:2rem;border:1px solid rgba(255,255,255,.08);color:rgba(248,243,236,.3)}
.bpill.on{background:rgba(184,135,74,.1);border-color:rgba(184,135,74,.25);color:var(--clay)}
.bcode{background:rgba(0,0,0,.25);border-radius:.65rem;padding:.9rem 1.1rem;margin-top:1.1rem;font-size:.88rem;color:rgba(248,243,236,.35);line-height:1.75}

/* SHARING */
.sharing{background:var(--ink2)}
.share-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.5rem;margin-top:3.5rem}
.share-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:1.5rem;padding:2.25rem;transition:transform .3s,background .3s,border-color .3s}
.share-card:hover{transform:translateY(-4px);background:rgba(255,255,255,.065);border-color:rgba(184,135,74,.15)}
.share-ico{font-size:2.25rem;margin-bottom:1.25rem;display:block}
.share-t{font-family:'Cormorant Garamond',serif;font-size:1.45rem;color:var(--parchment);margin-bottom:.65rem;line-height:1.2}
.share-d{font-size:1rem;color:rgba(248,243,236,.68);line-height:1.85}
.share-tag{display:inline-block;margin-top:1rem;font-size:.68rem;color:var(--sage-l);background:rgba(143,168,137,.08);border:1px solid rgba(143,168,137,.2);padding:.28rem .75rem;border-radius:2rem;letter-spacing:.06em}
.share-coming{display:inline-block;margin-top:.75rem;font-size:.68rem;color:rgba(248,243,236,.3);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);padding:.28rem .75rem;border-radius:2rem;letter-spacing:.06em}

/* ONBOARDING */
.onboard{background:var(--warm)}
.ob-steps{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--sand);border-radius:1.25rem;overflow:hidden;margin-top:3.5rem}
.ob-step{background:#FBF8F3;padding:1.85rem 1.35rem;position:relative}
.ob-step::after{content:attr(data-n);position:absolute;top:1.25rem;right:1.25rem;font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:rgba(26,22,18,.06);font-weight:600}
.ob-ico{font-size:1.85rem;margin-bottom:.85rem;display:block}
.ob-t{font-weight:500;font-size:1rem;color:var(--ink);margin-bottom:.4rem;line-height:1.3}
.ob-d{font-size:.92rem;color:var(--mid);line-height:1.7}

/* DOT AI */
.dot-section{background:var(--ink)}
.dot-grid{display:grid;grid-template-columns:1fr 1fr;gap:6rem;align-items:center}
.dot-chat{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:1.5rem;overflow:hidden}
.dot-header{background:rgba(255,255,255,.04);padding:1.1rem 1.5rem;display:flex;align-items:center;gap:.75rem;border-bottom:1px solid rgba(255,255,255,.06)}
.dot-avatar{width:2.25rem;height:2.25rem;border-radius:50%;background:linear-gradient(135deg,#D4A46A,#8FA889);display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0}
.dot-n{font-weight:500;font-size:1rem;color:var(--parchment)}
.dot-s{font-size:.82rem;color:var(--sage-l)}
.dot-msgs{padding:1.5rem;display:flex;flex-direction:column;gap:.85rem}
.msg{max-width:82%;border-radius:1.25rem;padding:.85rem 1.1rem;font-size:.88rem;line-height:1.65}
.msg.u{background:rgba(184,135,74,.18);color:var(--parchment);align-self:flex-end;border-bottom-right-radius:.3rem}
.msg.a{background:rgba(255,255,255,.06);color:rgba(248,243,236,.72);align-self:flex-start;border-bottom-left-radius:.3rem}
.msg.a strong{color:var(--clay);font-weight:500}
.dot-input{display:flex;gap:.6rem;align-items:center;padding:1rem 1.5rem;background:rgba(255,255,255,.03);border-top:1px solid rgba(255,255,255,.05)}
.dot-field{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:2rem;padding:.6rem 1rem;font-size:.88rem;color:rgba(248,243,236,.3)}
.dot-send{width:2.2rem;height:2.2rem;border-radius:50%;background:var(--clay);display:flex;align-items:center;justify-content:center;font-size:.8rem;cursor:pointer;flex-shrink:0}
.dot-feats{display:flex;flex-direction:column;gap:1.75rem}
.dot-feat{display:flex;gap:1rem;align-items:flex-start}
.dot-feat-ico{width:2.25rem;height:2.25rem;border-radius:.65rem;background:rgba(184,135,74,.1);border:1px solid rgba(184,135,74,.18);display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;margin-top:.1rem}
.dot-feat-n{font-weight:500;font-size:1rem;color:var(--parchment);margin-bottom:.25rem}
.dot-feat-d{font-size:.97rem;color:rgba(248,243,236,.65);line-height:1.75}

/* FAMILY INTELLIGENCE */
.family-sec{background:var(--warm)}
.family-grid{display:grid;grid-template-columns:1fr 1fr;gap:6rem;align-items:center}
.family-features{display:flex;flex-direction:column;gap:1.75rem;margin-top:2.5rem}
.ff{display:flex;gap:1rem;align-items:flex-start}
.ff-ico{width:2.2rem;height:2.2rem;border-radius:50%;background:rgba(192,92,48,.08);border:1px solid rgba(192,92,48,.15);display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0;margin-top:.1rem}
.ff-n{font-weight:500;font-size:1.05rem;color:var(--ink);margin-bottom:.2rem}
.ff-d{font-size:.97rem;color:var(--mid);line-height:1.7}
.family-card{background:var(--ink);border-radius:1.5rem;padding:2rem;box-shadow:0 20px 60px rgba(0,0,0,.15)}
.fcard-hd{font-size:.68rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--clay);margin-bottom:1.25rem}
.fcard-member{display:flex;align-items:center;justify-content:space-between;padding:.7rem 0;border-bottom:1px solid rgba(255,255,255,.06)}
.fcard-member:last-child{border-bottom:none}
.fcard-name{font-size:.97rem;color:var(--parchment)}
.fcard-age{font-size:.82rem;color:rgba(248,243,236,.4)}
.fcard-tag{font-size:.7rem;padding:.2rem .65rem;border-radius:2rem;background:rgba(143,168,137,.1);border:1px solid rgba(143,168,137,.2);color:var(--sage-l)}

/* PRICING */
.pricing{background:var(--ink2)}
.pricing-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;margin-top:3.5rem}
.pc{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:1.75rem;padding:2.5rem 2rem;position:relative;transition:transform .3s,border-color .3s}
.pc:hover{transform:translateY(-4px)}
.pc.pop{background:rgba(184,135,74,.07);border-color:rgba(184,135,74,.28)}
.pc.pop:hover{border-color:rgba(184,135,74,.45)}
.pc-top-bar{height:2px;border-radius:1px;margin-bottom:2rem;background:rgba(255,255,255,.06)}
.pc.pop .pc-top-bar{background:linear-gradient(to right,transparent,var(--clay),transparent)}
.pc-badge{display:inline-block;font-size:.62rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;padding:.3rem .8rem;border-radius:2rem;margin-bottom:1.25rem}
.pc.pop .pc-badge{background:rgba(184,135,74,.15);color:var(--clay);border:1px solid rgba(184,135,74,.3)}
.pc:not(.pop) .pc-badge{background:rgba(255,255,255,.05);color:rgba(248,243,236,.35);border:1px solid rgba(255,255,255,.08)}
.pc-name{font-family:'Cormorant Garamond',serif;font-size:1.45rem;font-weight:400;color:var(--parchment);margin-bottom:1.5rem}
.pc-price{font-family:'Cormorant Garamond',serif;font-size:3.75rem;font-weight:300;color:var(--parchment);line-height:1;letter-spacing:-.02em}
.pc-price sup{font-size:1.5rem;vertical-align:super;color:var(--clay)}
.pc-price sub{font-size:1rem;color:rgba(248,243,236,.3);font-family:'Outfit',sans-serif;font-weight:300}
.pc-save{font-size:.72rem;color:var(--sage-l);margin:.4rem 0 .25rem;letter-spacing:.04em}
.pc-cadence{font-size:.88rem;color:rgba(248,243,236,.28);margin-bottom:2rem;line-height:1.5}
.pc-feats{display:flex;flex-direction:column;gap:.65rem;margin-bottom:2rem}
.pcf{display:flex;align-items:flex-start;gap:.65rem;font-size:.9rem;color:rgba(248,243,236,.55)}
.pcf::before{content:'✓';color:var(--sage-l);font-weight:600;font-size:.75rem;flex-shrink:0;margin-top:.1rem}
.pc-cta{display:block;text-align:center;font-size:.92rem;font-weight:500;padding:.9rem;border-radius:2rem;text-decoration:none;transition:all .2s}
.pc:not(.pop) .pc-cta{border:1px solid rgba(255,255,255,.12);color:rgba(248,243,236,.55)}
.pc:not(.pop) .pc-cta:hover{border-color:rgba(184,135,74,.35);color:var(--clay)}
.pc.pop .pc-cta{background:var(--clay);color:var(--ink);box-shadow:0 8px 24px rgba(184,135,74,.3)}
.pc.pop .pc-cta:hover{background:var(--clay-l);box-shadow:0 12px 32px rgba(184,135,74,.4)}
.pricing-note{text-align:center;font-size:.82rem;color:rgba(248,243,236,.2);margin-top:2rem;line-height:1.8}
.trial-banner{background:rgba(143,168,137,.07);border:1px solid rgba(143,168,137,.18);border-radius:1.1rem;padding:1.35rem 1.75rem;display:flex;align-items:center;gap:1.25rem;margin-top:2.5rem;flex-wrap:wrap;justify-content:center;text-align:center}
.trial-ico{font-size:1.5rem;flex-shrink:0}
.trial-text strong{display:block;font-size:.97rem;font-weight:500;color:var(--parchment);margin-bottom:.2rem}
.trial-text span{font-size:.85rem;color:rgba(248,243,236,.38)}

/* FAQ */
.faq{background:var(--ink)}
.faq-list{margin-top:3.5rem;max-width:760px;margin-left:auto;margin-right:auto}
.faq-item{border-bottom:1px solid rgba(255,255,255,.07);padding:1.85rem 0;cursor:pointer}
.faq-item:first-child{border-top:1px solid rgba(255,255,255,.07)}
.faq-q{display:flex;justify-content:space-between;align-items:center;gap:1.5rem}
.faq-question{font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:400;color:var(--parchment);line-height:1.3}
.faq-tog{width:1.9rem;height:1.9rem;border-radius:50%;border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--clay);font-size:1rem;transition:all .3s}
.faq-item.open .faq-tog{background:rgba(184,135,74,.1);border-color:rgba(184,135,74,.35);transform:rotate(45deg)}
.faq-ans{font-size:1rem;color:rgba(248,243,236,.48);line-height:1.9;max-height:0;overflow:hidden;transition:max-height .4s ease,padding .3s}
.faq-item.open .faq-ans{max-height:300px;padding-top:1.1rem}

/* STORY */
.story{background:var(--warm)}
.story-q{font-family:'Cormorant Garamond',serif;font-size:clamp(1.7rem,3.5vw,2.75rem);font-weight:300;font-style:italic;color:var(--ink);line-height:1.45;margin:2.5rem 0 1.75rem}
.story-q em{font-style:normal;color:var(--ember);font-weight:400}
.story-attr{font-size:.82rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--mid)}
.story-attr span{color:var(--ember)}

/* FOOTER CTA */
.footer-cta{background:var(--ink);padding:9rem 5% 4rem;position:relative;overflow:hidden}
.footer-cta::before{display:none}
.footer-cta-inner{position:relative;z-index:1;text-align:center}
.footer-cta-t{font-family:'Cormorant Garamond',serif;font-size:clamp(3rem,8vw,6rem);font-weight:300;color:var(--parchment);line-height:.9;margin:1.5rem 0 1.25rem;letter-spacing:-.02em}
.footer-cta-t em{font-style:italic;color:var(--clay)}
.footer-cta-sub{font-size:1.1rem;color:rgba(248,243,236,.38);margin-bottom:2.75rem;line-height:1.7}
.footer-bottom{margin-top:7rem;background:rgba(0,0,0,.25);margin-left:-5%;margin-right:-5%;padding:1.75rem 5%;border-top:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem}
.f-logo{font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:600;color:var(--parchment)}
.f-logo span{color:var(--clay);font-style:italic}
.f-tag{font-size:.78rem;color:rgba(248,243,236,.28);letter-spacing:.04em}
.f-links{display:flex;gap:1.75rem;align-items:center}
.f-links a{font-size:.82rem;color:rgba(248,243,236,.4);text-decoration:none;transition:color .2s}
.f-links a:hover{color:var(--parchment)}

/* ANIMATIONS */
@keyframes up{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
.reveal{opacity:0;transform:translateY(28px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
.reveal.vis{opacity:1;transform:translateY(0)}
.d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}.d4{transition-delay:.4s}

/* MOBILE NAV */
.mob-nav{position:fixed;top:0;right:-100%;width:75%;max-width:280px;height:100vh;background:var(--ink2);z-index:300;padding:5rem 2rem 2rem;transition:right .35s cubic-bezier(.16,1,.3,1);border-left:1px solid rgba(255,255,255,.07)}
.mob-nav.open{right:0}
.mob-nav a{display:block;font-size:1.1rem;color:rgba(248,243,236,.6);text-decoration:none;padding:.85rem 0;border-bottom:1px solid rgba(255,255,255,.06);transition:color .2s}
.mob-nav a:hover{color:var(--parchment)}
.mob-nav .nav-btn{display:block;text-align:center;margin-top:1.5rem;border-radius:2rem;padding:.85rem;font-size:.95rem}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:250;opacity:0;pointer-events:none;transition:opacity .3s}
.overlay.open{opacity:1;pointer-events:all}
.mob-close{position:absolute;top:1.5rem;right:1.5rem;width:2rem;height:2rem;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(248,243,236,.4);font-size:1.2rem}

/* Demo animation */
@keyframes slideDemo{0%,30%{opacity:1;transform:translateY(0)}35%,65%{opacity:0;transform:translateY(-8px)}70%,100%{opacity:0;transform:translateY(8px)}}

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
  .dot-grid,.family-grid{grid-template-columns:1fr}
}
@media(max-width:768px){
  nav{padding:1.25rem 1.25rem}
  .nav-r .nav-r-links{display:none}
  .nav-r .nav-btn{display:none}
  .nav-menu{display:flex}
  section{padding:5rem 5%}
  .problem-grid{grid-template-columns:1fr;gap:3.5rem}
  .steps{grid-template-columns:1fr}
  .bento{grid-template-columns:1fr}
  .bc.feat{grid-column:span 1}
  .ob-steps{grid-template-columns:1fr}
  h1{font-size:clamp(3rem,13vw,5.5rem)}
  .pricing-cards{grid-template-columns:1fr;max-width:380px;margin-left:auto;margin-right:auto}
  .share-grid{grid-template-columns:1fr}
  .footer-bottom{flex-direction:column;align-items:center;text-align:center}
  .f-links{justify-content:center}
  .trust{gap:1.25rem}
  .ov,.ov-d{justify-content:center !important}
  .sh,.sh-d,.sp,.sp-d{text-align:center !important}
  .section-inner .reveal > .ov,
  .section-inner .reveal > .sh,
  .section-inner .reveal > .sh-d,
  .section-inner > .reveal > p{text-align:center !important}
  .problem-grid p,.dot-grid p,.family-grid p{text-align:center}
  .footer-bottom{flex-direction:column;align-items:center;text-align:center;gap:.75rem}
  .f-links{justify-content:center}
  .trust{gap:1rem;padding:1.2rem 5%}
  .trust-item{font-size:.85rem}
}
@media(max-width:480px){
  .hero-btns{flex-direction:column;align-items:center}
  .demo-phone{width:240px}
  .footer-bottom{margin-left:-5%;margin-right:-5%;padding:1.5rem 5%}
}
</style>
`

const LANDING_HTML = `

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

<nav id="nav">
  <a href="#" class="logo">Simply <span>Sous</span></a>
  <div class="nav-r">
    <a href="#how" class="nav-r-links">How it works</a>
    <a href="#features" class="nav-r-links">Features</a>
    <a href="#sharing" class="nav-r-links">Sharing</a>
    <a href="#pricing" class="nav-r-links">Pricing</a>
    <a href="https://app.simplysous.com/login" class="nav-r-links">Sign in</a>
    <a href="https://app.simplysous.com/signup" class="nav-btn">Start free trial</a>
    <div class="nav-menu" onclick="openMob()"><span></span><span></span><span></span></div>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-bg"></div>
  <div class="hero-grain"></div>
  <div class="hero-inner">
    <div class="eyebrow">Meet Simply Sous</div>
    <h1>Dinner,<br><em>decided.</em></h1>
    <p class="hero-sub">The AI meal planner that knows your family, your vault of recipes, and your evenings — and makes dinner feel effortless every night.</p>
    <div class="hero-btns">
      <a href="https://app.simplysous.com/signup" class="btn-p">Start your free trial →</a>
      <a href="#how" class="btn-s">See how it works <div class="arr">↓</div></a>
    </div>
    <p class="hero-trial">14 days free · No credit card · Cancel anytime</p>
  </div>

  <!-- Animated phone demo -->
  <div class="hero-demo">
    <div class="demo-phone" id="demoPhone">
      <div class="demo-body">
        <div class="demo-island"></div>
        <div class="demo-screen">

          <!-- Slide 1: Tonight view -->
          <div class="demo-slide active" id="slide0">
            <div class="ds-hd">
              <div class="ds-eyebrow">Tonight</div>
              <div class="ds-title">Wednesday, April 9</div>
            </div>
            <div class="ds-card">
              <div class="ds-card-top">
                <div class="ds-label">Tonight's dinner</div>
                <div class="ds-meal">Thai Green Curry with Jasmine Rice</div>
                <div class="ds-meta"><span>🌍 Thai</span><span>⏱ 35 min</span><span>👥 Serves 5</span></div>
              </div>
              <div class="ds-timer">
                <div><div class="ds-tl">Start by</div><div class="ds-tv">5:25 PM</div></div>
                <div style="text-align:right"><div class="ds-tl">Ready at</div><div class="ds-tv">6:00 PM</div></div>
              </div>
            </div>
            <div class="ds-steps">
              <div class="ds-step"><div class="ds-sn">01</div><div class="ds-st">Pull chicken from fridge. Rinse jasmine rice.</div></div>
              <div class="ds-step"><div class="ds-sn">02</div><div class="ds-st">Heat coconut oil. Sauté curry paste 1 min.</div></div>
              <div class="ds-step"><div class="ds-sn">03</div><div class="ds-st">Add coconut milk, chicken. Simmer 20 min.</div></div>
              <div class="ds-step"><div class="ds-sn">04</div><div class="ds-st">Serve over rice. Garnish with basil.</div></div>
            </div>
            <div class="iphone-home"></div>
          </div>

          <!-- Slide 2: Weekly plan -->
          <div class="demo-slide" id="slide1">
            <div class="ds-plan-hd">
              <div class="ds-plan-week">This week · Apr 7–13</div>
              <div class="ds-plan-title" style="display:flex;align-items:center;gap:.5rem">Weekly <em style="color:var(--clay);font-style:italic;font-family:'Cormorant Garamond',serif">Plan</em> <span style="font-size:.58rem;background:rgba(143,168,137,.15);color:#8FA889;border:1px solid rgba(143,168,137,.3);padding:.15rem .5rem;border-radius:2rem;letter-spacing:.08em;text-transform:uppercase;">✓ Confirmed</span></div>
            </div>
            <div class="ds-day tonight"><div class="ds-day-name">MON</div><div class="ds-day-recipe">Honey Garlic Chicken Thighs</div><div class="ds-day-time">5:40</div></div>
            <div class="ds-day"><div class="ds-day-name">TUE</div><div class="ds-day-recipe">Shrimp Scampi with Linguine</div><div class="ds-day-time">5:30</div></div>
            <div class="ds-day"><div class="ds-day-name">WED</div><div class="ds-day-recipe">Thai Green Curry</div><div class="ds-day-time">5:25</div></div>
            <div class="ds-day"><div class="ds-day-name">THU</div><div class="ds-day-recipe">Sheet Pan Salmon</div><div class="ds-day-time">5:45</div></div>
            <div class="ds-day"><div class="ds-day-name">FRI</div><div class="ds-day-recipe" style="color:rgba(248,243,236,.3);font-style:italic">blackout day</div><div class="ds-day-time"></div></div>
            <div class="ds-day"><div class="ds-day-name">SAT</div><div class="ds-day-recipe">Beef Bulgogi Bowls</div><div class="ds-day-time">6:00</div></div>
            <div class="iphone-home"></div>
          </div>

          <!-- Slide 3: Dot chat -->
          <div class="demo-slide" id="slide2">
            <div class="ds-dot-hd">
              <div class="ds-dot-av">👵</div>
              <div><div class="ds-dot-n">Dot</div><div class="ds-dot-s">Your kitchen assistant</div></div>
            </div>
            <div class="ds-msgs">
              <div class="ds-msg u">Something quick tonight — the kids are starving</div>
              <div class="ds-msg a">I've got you! <strong>Honey Garlic Chicken</strong> from your vault is 27 minutes — and it's a family favorite. Or <strong>Shrimp Fried Rice</strong> using your leftover rice. Which one sounds right?</div>
              <div class="ds-msg u">Add shrimp fried rice to tonight</div>
              <div class="ds-msg a">Done! Tonight is now <strong>Shrimp Fried Rice</strong>. I've checked your pantry — you have everything except the shrimp. Added to your grocery list.</div>
            </div>
            <div class="iphone-home"></div>
          </div>

        </div>
      </div>
    </div>
    <div class="demo-dots">
      <div class="demo-dot active" id="dot0" onclick="goSlide(0)"></div>
      <div class="demo-dot" id="dot1" onclick="goSlide(1)"></div>
      <div class="demo-dot" id="dot2" onclick="goSlide(2)"></div>
    </div>
  </div>
</section>

<script>
var currentSlide = 0;
var slideTimer;
function goSlide(n) {
  document.getElementById('slide' + currentSlide).classList.remove('active');
  document.getElementById('dot' + currentSlide).classList.remove('active');
  currentSlide = n;
  document.getElementById('slide' + n).classList.add('active');
  document.getElementById('dot' + n).classList.add('active');
  clearInterval(slideTimer);
  slideTimer = setInterval(function(){ goSlide((currentSlide + 1) % 3); }, 4000);
}
slideTimer = setInterval(function(){ goSlide((currentSlide + 1) % 3); }, 4000);
</script>

<!-- TRUST BAR -->
<div class="trust">
  <div class="trust-item">14-day free trial</div>
  <div class="trust-item">No credit card required</div>
  <div class="trust-item">Works on any device</div>
  <div class="trust-item">Family privacy protected</div>
  <div class="trust-item">Cancel anytime</div>
</div>

<!-- PROBLEM -->
<section class="problem">
  <div class="section-inner">
    <div class="problem-grid">
      <div class="reveal">
        <div class="ov">The dinner problem</div>
        <h2 class="sh">Every night,<br>the same <em>exhausting question.</em></h2>
        <p class="sp" style="margin-top:1.5rem">It's 4:30pm. You've managed the kids, the appointments, the house. And now comes the hardest question of the day — not because cooking is hard. Because <em style="font-style:italic;color:var(--clay)">deciding</em> is.</p>
        <p class="sp" style="margin-top:1rem">Simply Sous eliminates the decision entirely. Your week is planned before you even think about it — and Dot, your AI kitchen assistant, handles the rest.</p>
      </div>
      <div class="stat-col reveal d2">
        <div class="stat">
          <div class="stat-n">365</div>
          <div class="stat-l">times a year the dinner question gets asked — and answered by you, alone, after an already-full day.</div>
        </div>
        <div class="stat">
          <div class="stat-n">40<span style="font-size:2rem">min</span></div>
          <div class="stat-l">average time families spend deciding what to cook before they've even started cooking.</div>
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
      <h2 class="sh-d">Five minutes to a<br><em>fully decided week.</em></h2>
    </div>
    <div class="steps">
      <div class="step reveal d1">
        <div class="step-n">1</div>
        <span class="step-ico">📸</span>
        <div class="step-t">Build your vault</div>
        <div class="step-d">Screenshot a recipe, paste a URL, or snap a cookbook page. AI reads it and stores a clean, tagged recipe instantly.</div>
      </div>
      <div class="step reveal d2">
        <div class="step-n">2</div>
        <span class="step-ico">✨</span>
        <div class="step-t">AI plans your week</div>
        <div class="step-d">AI builds your week from your vault — balancing variety, rotation rules, dietary needs, and your family's preferences.</div>
      </div>
      <div class="step reveal d3">
        <div class="step-n">3</div>
        <span class="step-ico">🛒</span>
        <div class="step-t">One grocery list</div>
        <div class="step-d">Your grocery list auto-generates across up to 4 weeks — merged, organized, and filtered against your pantry staples.</div>
      </div>
      <div class="step reveal d4">
        <div class="step-n">4</div>
        <span class="step-ico">🍽️</span>
        <div class="step-t">Cook with confidence</div>
        <div class="step-d">Tonight's dinner greets you at 5pm. A smart countdown tells you when to start. Step-by-step cook mode from there.</div>
      </div>
    </div>
  </div>
</section>

<!-- FEATURES BENTO -->
<section class="features" id="features">
  <div class="section-inner">
    <div class="reveal" style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:1.5rem;margin-bottom:0">
      <div>
        <div class="ov">Everything included</div>
        <h2 class="sh">Built for the way<br><em>families actually eat.</em></h2>
      </div>
      <p style="font-size:1rem;color:rgba(248,243,236,.32);max-width:260px;text-align:right;line-height:1.85">Every feature designed around one question: what does a busy family need at 5pm on a Tuesday?</p>
    </div>
    <div class="bento">
      <div class="bc feat c7 reveal">
        <div class="btag">✦ AI-Powered Planning</div>
        <div class="bt">Your week planned before you open the app.</div>
        <div class="bd">AI picks from your personal vault, balances cuisine variety, respects rotation rules, skips blackout days, adapts to the season, and accounts for your family's taste — all before you sit down to review.</div>
        <div class="bpills">
          <div class="bpill on">Seasonal menus</div>
          <div class="bpill on">Rotation rules</div>
          <div class="bpill on">4-week planning</div>
          <div class="bpill on">Family intelligence</div>
          <div class="bpill on">Pantry-aware</div>
        </div>
      </div>
      <div class="bc c5 reveal d1">
        <span class="bico">📸</span>
        <div class="bt">Capture from anywhere</div>
        <div class="bd">Instagram, TikTok, cookbook photos, recipe URLs — AI extracts, tags, and scales every recipe to your family size in seconds.</div>
        <div class="bcode">📷 Photo uploaded...<br>✓ Recipe extracted · 9 tags<br>✓ Scaled to family of 5<br>✓ Added to vault</div>
      </div>
      <div class="bc c4 reveal d1">
        <span class="bico">✨</span>
        <div class="bt">Discover 1,000+ recipes</div>
        <div class="bd">Browse Dot's curated recipe database — filtered by dietary needs, cuisine, cook time, and your taste profile. Save any to your vault with one tap.</div>
        <div class="bpills">
          <div class="bpill on">Gluten-free</div>
          <div class="bpill on">Paleo · Keto</div>
          <div class="bpill on">Under 30 min</div>
        </div>
      </div>
      <div class="bc c8 reveal d2">
        <span class="bico">🛒</span>
        <div class="bt">Multi-week grocery list. Organized. Accurate.</div>
        <div class="bd">Ingredients across all planned weeks are merged and deduplicated. Pantry staples are pre-checked. Each item shows which recipe it's for — so you can verify at a glance and shop with total confidence.</div>
        <div class="bpills">
          <div class="bpill on">Up to 4 weeks</div>
          <div class="bpill on">Recipe-tagged items</div>
          <div class="bpill on">Pantry deduct</div>
          <div class="bpill">Check off as you shop</div>
        </div>
      </div>
      <div class="bc c6 reveal">
        <span class="bico">👶</span>
        <div class="bt">Family intelligence</div>
        <div class="bd">Add child profiles with ages. Simply Sous adjusts meal suggestions based on picky toddlers vs. teenagers — and scales portions to your real family size automatically.</div>
      </div>
      <div class="bc c6 reveal d1">
        <span class="bico">⭐</span>
        <div class="bt">It learns what you love</div>
        <div class="bd">Rate dinner after each meal. Simply Sous tracks what lands with your family and automatically removes poorly-rated recipes from future rotation — getting smarter every week.</div>
      </div>
      <div class="bc c5 reveal d2">
        <span class="bico">🔄</span>
        <div class="bt">Swap in seconds</div>
        <div class="bd">Plans changed? Not feeling it tonight? One tap serves 6 suggestions — your vault recipes and Dot's picks — filtered to under 30 minutes by default.</div>
      </div>
      <div class="bc c7 reveal">
        <span class="bico">🍂</span>
        <div class="bt">Seasonal menus, automatically</div>
        <div class="bd">Simply Sous knows what season it is and adjusts recommendations accordingly — lighter grilled meals in summer, warming soups and braises in winter. No configuration needed.</div>
      </div>
    </div>
  </div>
</section>

<!-- SHARING -->
<section class="sharing" id="sharing">
  <div class="section-inner">
    <div class="center reveal">
      <div class="ov">Recipes worth sharing</div>
      <h2 class="sh">Share recipes.<br><em>Grow your table.</em></h2>
      <p class="sp" style="max-width:520px;margin:1.1rem auto 0">Your best meals deserve to be shared. Send a recipe, share a collection, or give family live access to your vault.</p>
    </div>
    <div class="share-grid reveal d1">
      <div class="share-card">
        <span class="share-ico">🔗</span>
        <div class="share-t">Share a single recipe</div>
        <div class="share-d">One tap generates a shareable recipe card. Anyone can open it without an account — and save it to their own vault with one more tap.</div>
        <div class="share-tag">Coming soon</div>
      </div>
      <div class="share-card">
        <span class="share-ico">📂</span>
        <div class="share-t">Share a collection</div>
        <div class="share-d">Curate named collections — "Quick Weeknights," "Kid Approved," "Date Night" — and share the whole set. Recipients browse and import what they love.</div>
        <div class="share-tag">Coming soon</div>
      </div>
      <div class="share-card">
        <span class="share-ico">👯</span>
        <div class="share-t">Follow a vault</div>
        <div class="share-d">Give trusted people a live view of your recipe vault. When you add something new, they see it automatically. Like a private recipe feed between family.</div>
        <div class="share-tag">Coming soon</div>
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
      <p class="sp-d">A 5-minute setup that captures your family's food DNA — so every recommendation feels made specifically for you.</p>
    </div>
    <div class="ob-steps reveal d1">
      <div class="ob-step" data-n="01">
        <span class="ob-ico">👨‍👩‍👧‍👦</span>
        <div class="ob-t">Family profile</div>
        <div class="ob-d">Family size, child ages, your dinner hour, and which nights to skip from the rotation.</div>
      </div>
      <div class="ob-step" data-n="02">
        <span class="ob-ico">🥦</span>
        <div class="ob-t">Food preferences</div>
        <div class="ob-d">Cuisines you love, ingredients anyone dislikes, dietary restrictions and allergens — hard limits AI never breaks.</div>
      </div>
      <div class="ob-step" data-n="03">
        <span class="ob-ico">🏠</span>
        <div class="ob-t">Pantry staples</div>
        <div class="ob-d">All common pantry items are pre-selected. Uncheck what you don't have — your grocery list adjusts automatically.</div>
      </div>
      <div class="ob-step" data-n="04">
        <span class="ob-ico">📸</span>
        <div class="ob-t">Add your recipes</div>
        <div class="ob-d">Paste URLs, upload screenshots, or photos. AI extracts everything. Or skip — 1,000+ curated recipes are ready from day one.</div>
      </div>
      <div class="ob-step" data-n="05">
        <span class="ob-ico">✨</span>
        <div class="ob-t">First plan, instantly</div>
        <div class="ob-d">Simply Sous generates your first week's meal plan the moment setup is complete. Review, adjust, confirm. Done.</div>
      </div>
    </div>
  </div>
</section>

<!-- DOT AI -->
<section class="dot-section">
  <div class="section-inner">
    <div class="dot-grid">
      <div class="reveal">
        <div class="ov">Meet Dot</div>
        <h2 class="sh">Your kitchen's<br><em>wisest voice.</em></h2>
        <p class="sp">Dot is Simply Sous's built-in AI kitchen assistant — warm, knowledgeable, and entirely focused on making dinner easier. Ask her anything. She knows your vault, your family, and your pantry.</p>
        <div class="dot-feats" style="margin-top:2.5rem">
          <div class="dot-feat">
            <div class="dot-feat-ico">🔍</div>
            <div><div class="dot-feat-n">Search your vault by feeling</div><div class="dot-feat-d">"Something cozy for a cold Tuesday" — Dot understands and finds the right recipe from your collection.</div></div>
          </div>
          <div class="dot-feat">
            <div class="dot-feat-ico">💡</div>
            <div><div class="dot-feat-n">Instant recipe ideas</div><div class="dot-feat-d">"What can I make with chicken and zucchini?" — Dot suggests recipes with full ingredients and saves them to your vault in one tap.</div></div>
          </div>
          <div class="dot-feat">
            <div class="dot-feat-ico">🥗</div>
            <div><div class="dot-feat-n">Seasonal & family-aware</div><div class="dot-feat-d">Dot knows the season, your children's ages, your allergens, and your preferences — every suggestion is genuinely tailored to you.</div></div>
          </div>
          <div class="dot-feat">
            <div class="dot-feat-ico">🔄</div>
            <div><div class="dot-feat-n">Substitutions on the fly</div><div class="dot-feat-d">Don't have an ingredient? Dot suggests what to swap and tells you if it changes the dish.</div></div>
          </div>
        </div>
      </div>
      <div class="reveal d2">
        <div class="dot-chat">
          <div class="dot-header">
            <div class="dot-avatar">👵</div>
            <div><div class="dot-n">Dot</div><div class="dot-s">Knows your vault · your family · your pantry</div></div>
          </div>
          <div class="dot-msgs">
            <div class="msg u">What can I make with the rotisserie chicken in my fridge?</div>
            <div class="msg a">You've got <strong>Creamy Tuscan Pasta</strong> in your vault — shredded rotisserie saves 15 minutes. Or I can suggest something fresh. Want to see it?</div>
            <div class="msg u">Yes, show me. And something under 20 minutes.</div>
            <div class="msg a">Here are two great options — both gluten-free and peanut-free for your family. <strong>Tuscan Pasta</strong> is 25 min from your vault, or <strong>Chicken Lettuce Wraps</strong> in 15. Tap either to view the full recipe and save it.</div>
          </div>
          <div class="dot-input">
            <div class="dot-field">Ask Dot anything...</div>
            <div class="dot-send">➤</div>
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
    <div class="story-attr">— Jacob Merkley, Founder &nbsp;·&nbsp; <span>Built for family, open to yours</span></div>
  </div>
</section>

<!-- PRICING -->
<section class="pricing" id="pricing">
  <div class="section-inner">
    <div class="center reveal">
      <div class="ov" style="justify-content:center">Simple, honest pricing</div>
      <h2 class="sh">One price<br><em>for every family.</em></h2>
      <p class="sp" style="max-width:460px;margin:1.1rem auto 0">Start free. Stay as long as you need. Everything Simply Sous builds, you get — regardless of plan.</p>
    </div>
    <div class="trial-banner reveal d1">
      <div class="trial-ico">🎁</div>
      <div class="trial-text">
        <strong>Start with a 14-day free trial — no credit card required</strong>
        <span>Full access to every feature. See if Simply Sous changes your evenings. Cancel in one click if it doesn't.</span>
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
          <div class="pcf">Multi-week grocery lists</div>
          <div class="pcf">Today view + cook mode</div>
          <div class="pcf">Dot AI assistant</div>
          <div class="pcf">1,000+ recipe database</div>
          <div class="pcf">Family intelligence</div>
        </div>
        <a href="https://app.simplysous.com/signup" class="pc-cta">Start free trial</a>
      </div>
      <div class="pc pop">
        <div class="pc-top-bar"></div>
        <div class="pc-badge">Most popular</div>
        <div class="pc-name">Annual</div>
        <div class="pc-price"><sup>$</sup>79<sub>.99/yr</sub></div>
        <div class="pc-save">Save 17% · Just $6.67/mo</div>
        <div class="pc-cadence">Billed once yearly · Cancel anytime</div>
        <div class="pc-feats">
          <div class="pcf">Everything in Flexible</div>
          <div class="pcf">Seasonal menu shifting</div>
          <div class="pcf">Recipe sharing + collections</div>
          <div class="pcf">Pattern recognition & ratings</div>
          <div class="pcf">Priority new features</div>
          <div class="pcf">Child profiles</div>
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
          <div class="pcf">All future features, free forever</div>
          <div class="pcf">No price increases, ever</div>
          <div class="pcf">Early access to new features</div>
          <div class="pcf">Founding member status</div>
        </div>
        <a href="https://app.simplysous.com/signup" class="pc-cta">Get lifetime access</a>
      </div>
    </div>
    <p class="pricing-note">All plans include a 14-day free trial · No credit card required · Cancel in one click<br>Your recipes, your data — always yours.</p>
  </div>
</section>

<!-- FAQ -->
<section class="faq" id="faq">
  <div class="section-inner center">
    <div class="reveal">
      <div class="ov" style="justify-content:center">Questions</div>
      <h2 class="sh" style="margin-top:.5rem">Answered.</h2>
    </div>
    <div class="faq-list reveal d1">
      <div class="faq-item open">
        <div class="faq-q"><div class="faq-question">What devices does Simply Sous work on?</div><div class="faq-tog">+</div></div>
        <div class="faq-ans">Simply Sous is a web app — it works on any device with a browser. Phone, tablet, laptop, desktop. No download required. Add it to your phone's home screen and it feels completely native.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q"><div class="faq-question">What does the 14-day free trial include?</div><div class="faq-tog">+</div></div>
        <div class="faq-ans">Everything. Full access to the recipe vault, AI meal planning, grocery lists, Dot the AI assistant, the 1,000+ recipe database, family intelligence, and seasonal planning. No credit card, no commitment. Cancel with one click if Simply Sous doesn't change your evenings.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q"><div class="faq-question">How does the AI recipe capture work?</div><div class="faq-tog">+</div></div>
        <div class="faq-ans">Three ways: paste a URL from any recipe website, upload a screenshot or photo (including cookbook pages), or type it manually. AI reads the source, extracts the recipe, standardizes the format, and auto-generates tags — all in under 10 seconds.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q"><div class="faq-question">Can my whole family use it?</div><div class="faq-tog">+</div></div>
        <div class="faq-ans">Yes. Simply Sous is built for the whole household. Add child profiles with ages and the AI adjusts meal suggestions accordingly. You can also share recipe collections with family members — sisters, parents, close friends — even if they're not Simply Sous users yet.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q"><div class="faq-question">What if we always eat out on certain nights?</div><div class="faq-tog">+</div></div>
        <div class="faq-ans">Set blackout days during onboarding — or update them anytime in settings. Simply Sous skips those nights completely and only plans the evenings you actually cook. Friday pizza night stays sacred.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q"><div class="faq-question">Is my recipe data private?</div><div class="faq-tog">+</div></div>
        <div class="faq-ans">Completely private. Your recipe vault, meal plans, and family information belong entirely to you. We never share your data with anyone. Child profiles are stored with no names required — just ages — for your family's privacy.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q"><div class="faq-question">What's the difference between Annual and Lifetime?</div><div class="faq-tog">+</div></div>
        <div class="faq-ans">Annual renews each year at $79.99. Lifetime is a single payment of $119.99 — you own it forever, including every feature we add in the future. If you use Simply Sous for more than 15 months, Lifetime pays for itself. Most families who love it choose Lifetime.</div>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER CTA -->
<section class="footer-cta">
  <div class="footer-cta-inner">
    <div class="reveal">
      <div class="ov" style="justify-content:center">Ready?</div>
      <h2 class="footer-cta-t">Dinner,<br><em>decided.</em></h2>
      <p class="footer-cta-sub">Stop answering the question. Start enjoying the meal.</p>
      <a href="https://app.simplysous.com/signup" class="btn-p" style="font-size:1.05rem;padding:1.1rem 3rem">Start your free trial →</a>
      <p style="font-size:.8rem;color:rgba(248,243,236,.2);margin-top:1rem;letter-spacing:.04em">14 days free · No credit card · Cancel anytime</p>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="f-logo">Simply <span>Sous</span></div>
    <div class="f-tag">© 2026 Inboxx Digital, LLC · Dinner, decided.</div>
    <div class="f-links">
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
    </div>
  </div>
`
