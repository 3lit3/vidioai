import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  subscription_tier: 'starter' | 'creator' | 'pro';
  created_at: string;
  updated_at: string;
};

export type Video = {
  id: string;
  user_id: string;
  title: string;
  product_title: string;
  user_prompt: string;
  template_style: string;
  aspect_ratio: '1:1' | '16:9' | '9:16';
  brand_logo_url: string;
  video_url: string;
  thumbnail_url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  n8n_workflow_id: string;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  tier: 'starter' | 'creator' | 'pro';
  status: 'active' | 'cancelled' | 'expired';
  stripe_subscription_id: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
};

export type Submission = {
  id: string;
  user_id: string;
  product_title: string;
  user_prompt: string;
  user_email: string;
  template_style: string;
  image_base64: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  n8n_execution_id: string;
  error_message: string;
  created_at: string;
  updated_at: string;
};
