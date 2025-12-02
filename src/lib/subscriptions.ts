import { supabase } from './supabase';

export interface Tier {
  id: string;
  tier: 'starter' | 'creator' | 'pro';
  price: number;
  video_limit: number;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: 'starter' | 'creator' | 'pro';
  status: 'active' | 'cancelled' | 'expired';
  stripe_subscription_id: string | null;
  current_period_start: string;
  current_period_end: string;
}

export const getTiers = async (): Promise<Tier[]> => {
  const { data, error } = await supabase
    .from('pricing_tiers')
    .select('*')
    .order('price', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getUserSubscription = async (userId: string): Promise<Subscription | null> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getSubmissionLimit = (tier: 'starter' | 'creator' | 'pro'): number => {
  const limits = {
    starter: 5,
    creator: 50,
    pro: -1,
  };
  return limits[tier];
};

export const getRemainingSubmissions = async (userId: string, tier: 'starter' | 'creator' | 'pro'): Promise<number> => {
  const limit = getSubmissionLimit(tier);
  if (limit === -1) return -1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  if (error) throw error;
  return Math.max(0, limit - (count || 0));
};

export const checkSubmissionAllowed = async (userId: string, tier: 'starter' | 'creator' | 'pro'): Promise<{ allowed: boolean; remaining: number }> => {
  try {
    const remaining = await getRemainingSubmissions(userId, tier);
    return { allowed: remaining > 0 || remaining === -1, remaining };
  } catch {
    return { allowed: false, remaining: 0 };
  }
};

export const createCheckoutSession = async (tier: 'creator' | 'pro', email: string, userId: string) => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'X-User-Id': userId,
      },
      body: JSON.stringify({ tier, email }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }

  const data = await response.json();
  return data;
};

export const cancelSubscription = async (userId: string) => {
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', userId);

  if (error) throw error;
};
