import { createClient } from '@supabase/supabase-js';

// Browser-side Supabase client
// Used in all 'use client' components
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper: get current user (returns null if not logged in)
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

// Helper: get current user's profile
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

// Helper: check if subscription is active
export async function isSubscriptionActive(userId) {
  const { data } = await supabase
    .rpc('is_subscription_active', { p_profile_id: userId });
  return data ?? false;
}

// Helper: sign out
export async function signOut() {
  await supabase.auth.signOut();
}
