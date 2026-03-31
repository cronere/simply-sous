import { createClient } from '@supabase/supabase-js'

// Lazy singleton — only created in the browser, never during SSR/build
let client = null

export function getSupabase() {
  if (client) return client
  client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  return client
}
