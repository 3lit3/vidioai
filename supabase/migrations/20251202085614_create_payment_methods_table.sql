/*
  # Create payment methods and pricing tables

  1. New Tables
    - `payment_methods`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `stripe_payment_method_id` (text)
      - `type` (text: card, bank_account)
      - `last_four` (text: last 4 digits)
      - `expiry_month` (int)
      - `expiry_year` (int)
      - `is_default` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `pricing_tiers`
      - `id` (uuid, primary key)
      - `tier` (text: starter, creator, pro)
      - `price` (int: price in cents)
      - `stripe_product_id` (text)
      - `stripe_price_id` (text)
      - `video_limit` (int: -1 for unlimited)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their payment methods
    - Add public read policy for pricing tiers

  3. Notes
    - Pricing data will be synced with Stripe
    - Payment methods are encrypted at rest by Supabase
*/

CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_method_id text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('card', 'bank_account')),
  last_four text NOT NULL,
  expiry_month int,
  expiry_year int,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL UNIQUE CHECK (tier IN ('starter', 'creator', 'pro')),
  price int NOT NULL,
  stripe_product_id text,
  stripe_price_id text,
  video_limit int NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods"
  ON payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods"
  ON payment_methods FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods"
  ON payment_methods FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view pricing tiers"
  ON pricing_tiers FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO pricing_tiers (tier, price, video_limit) VALUES
  ('starter', 0, 5),
  ('creator', 2900, 50),
  ('pro', 9900, -1)
ON CONFLICT (tier) DO NOTHING;