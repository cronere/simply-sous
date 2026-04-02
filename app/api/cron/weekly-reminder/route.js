import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateStr(date) {
  return date.toISOString().split('T')[0]
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const sb = getSupabase()
  const today = new Date()
  const todayDow = today.getDay()
  const weekStart = getWeekStart(today)
  const weekStartStr = toDateStr(weekStart)
  const results = { planning_day: 0, followup: 0, errors: [] }

  try {
    // ── 1. PLANNING DAY REMINDER ──────────────────────────────
    const { data: planningUsers } = await sb
      .from('profiles')
      .select('id, email, family_name')
      .eq('planning_day', todayDow)
      .not('email', 'is', null)

    for (const user of planningUsers || []) {
      try {
        // Already sent this week?
        const { data: alreadySent } = await sb
          .from('reminder_logs')
          .select('id')
          .eq('profile_id', user.id)
          .eq('week_start_date', weekStartStr)
          .eq('reminder_type', 'planning_day')
          .maybeSingle()
        if (alreadySent) continue

        // Plan already confirmed?
        const { data: plan } = await sb
          .from('weekly_plans')
          .select('status')
          .eq('profile_id', user.id)
          .eq('week_start_date', weekStartStr)
          .maybeSingle()
        if (plan?.status === 'confirmed') continue

        await resend.emails.send({
          from: 'Simply Sous <hello@simplysous.com>',
          to: user.email,
          subject: "Time to plan this week's dinners 🍽️",
          html: planningDayEmail(user.family_name),
        })

        await sb.from('reminder_logs').insert({
          profile_id: user.id,
          reminder_type: 'planning_day',
          week_start_date: weekStartStr,
        })

        results.planning_day++
      } catch (e) {
        results.errors.push(`planning_day ${user.id}: ${e.message}`)
      }
    }

    // ── 2. FOLLOW-UP REMINDER (day after planning day) ────────
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayDow = yesterday.getDay()

    const { data: followupUsers } = await sb
      .from('profiles')
      .select('id, email, family_name')
      .eq('planning_day', yesterdayDow)
      .not('email', 'is', null)

    for (const user of followupUsers || []) {
      try {
        // Must have received planning_day reminder this week
        const { data: sentYesterday } = await sb
          .from('reminder_logs')
          .select('id')
          .eq('profile_id', user.id)
          .eq('week_start_date', weekStartStr)
          .eq('reminder_type', 'planning_day')
          .maybeSingle()
        if (!sentYesterday) continue

        // Already sent followup?
        const { data: alreadyFollowed } = await sb
          .from('reminder_logs')
          .select('id')
          .eq('profile_id', user.id)
          .eq('week_start_date', weekStartStr)
          .eq('reminder_type', 'planning_followup')
          .maybeSingle()
        if (alreadyFollowed) continue

        // Plan confirmed yet?
        const { data: plan } = await sb
          .from('weekly_plans')
          .select('status')
          .eq('profile_id', user.id)
          .eq('week_start_date', weekStartStr)
          .maybeSingle()
        if (plan?.status === 'confirmed') continue

        await resend.emails.send({
          from: 'Simply Sous <hello@simplysous.com>',
          to: user.email,
          subject: "Still haven't planned this week? Takes 2 minutes ⏱️",
          html: followupEmail(user.family_name),
        })

        await sb.from('reminder_logs').insert({
          profile_id: user.id,
          reminder_type: 'planning_followup',
          week_start_date: weekStartStr,
        })

        results.followup++
      } catch (e) {
        results.errors.push(`followup ${user.id}: ${e.message}`)
      }
    }

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }

  console.log('[cron/weekly-reminder]', JSON.stringify(results))
  return Response.json(results)
}

function planningDayEmail(familyName) {
  const name = familyName ? `The ${familyName} family` : 'Your family'
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F3EC;font-family:Georgia,serif">
<div style="max-width:560px;margin:0 auto;padding:2rem 1.5rem">
  <div style="margin-bottom:2rem">
    <span style="font-size:1.3rem;color:#1A1612;font-weight:600">Simply <span style="color:#B8874A;font-style:italic">Sous</span></span>
  </div>
  <h1 style="font-size:2rem;font-weight:300;color:#1A1612;line-height:1.1;margin:0 0 1rem">
    Dinner, <em style="color:#B8874A">decided.</em>
  </h1>
  <p style="font-size:1rem;color:#4A3F35;line-height:1.8;margin:0 0 1.5rem">
    It's your planning day. ${name}'s dinners for the week are just a few taps away — Dot has already picked recipes from your vault and is ready to show you the plan.
  </p>
  <a href="https://app.simplysous.com/plan"
     style="display:inline-block;background:#B8874A;color:#1A1612;text-decoration:none;padding:.9rem 2.25rem;border-radius:3rem;font-size:1rem;font-weight:600;margin-bottom:1.5rem">
    Plan this week →
  </a>
  <p style="font-size:.9rem;color:#7A6C5E;line-height:1.7;margin:0 0 2rem">
    Takes about 2 minutes. Review what Dot picked, swap anything you're not feeling, confirm — and your grocery list builds automatically.
  </p>
  <hr style="border:none;border-top:1px solid #E2D5C3;margin:1.5rem 0"/>
  <p style="font-size:.78rem;color:#B5A898;line-height:1.6;margin:0">
    You're receiving this because you set a planning day in Simply Sous.
    <a href="https://app.simplysous.com/settings" style="color:#B8874A">Update your preferences</a>
  </p>
</div>
</body>
</html>`
}

function followupEmail(familyName) {
  const name = familyName ? `The ${familyName} family` : 'Your family'
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F3EC;font-family:Georgia,serif">
<div style="max-width:560px;margin:0 auto;padding:2rem 1.5rem">
  <div style="margin-bottom:2rem">
    <span style="font-size:1.3rem;color:#1A1612;font-weight:600">Simply <span style="color:#B8874A;font-style:italic">Sous</span></span>
  </div>
  <h1 style="font-size:2rem;font-weight:300;color:#1A1612;line-height:1.1;margin:0 0 1rem">
    This week's dinners<br><em style="color:#B8874A">aren't planned yet.</em>
  </h1>
  <p style="font-size:1rem;color:#4A3F35;line-height:1.8;margin:0 0 1.5rem">
    No worries — it happens. ${name} still has time. Dot is ready with a full week of recipes pulled from your vault. Two minutes and you're set.
  </p>
  <a href="https://app.simplysous.com/plan"
     style="display:inline-block;background:#B8874A;color:#1A1612;text-decoration:none;padding:.9rem 2.25rem;border-radius:3rem;font-size:1rem;font-weight:600;margin-bottom:1.5rem">
    Plan this week →
  </a>
  <p style="font-size:.9rem;color:#7A6C5E;line-height:1.7;margin:0 0 2rem">
    Once confirmed, your grocery list builds automatically — sorted and ready to shop.
  </p>
  <hr style="border:none;border-top:1px solid #E2D5C3;margin:1.5rem 0"/>
  <p style="font-size:.78rem;color:#B5A898;line-height:1.6;margin:0">
    This is a one-time follow-up. We won't keep nudging you.
    <a href="https://app.simplysous.com/settings" style="color:#B8874A">Update your preferences</a>
  </p>
</div>
</body>
</html>`
}
