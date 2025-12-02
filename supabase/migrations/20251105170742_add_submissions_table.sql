/*
  # Add Submissions Table for Video Generation Tracking

  1. New Tables
    - `submissions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `product_title` (text) - Product name
      - `user_prompt` (text) - Creative prompt/description
      - `user_email` (text) - User email
      - `template_style` (text) - Selected template
      - `image_base64` (text) - Base64 encoded image
      - `status` (text) - pending, processing, completed, failed
      - `n8n_execution_id` (text) - n8n workflow execution ID
      - `error_message` (text) - Error details if failed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on submissions table
    - Users can only view their own submissions
*/

CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_title text NOT NULL,
  user_prompt text NOT NULL,
  user_email text NOT NULL,
  template_style text NOT NULL,
  image_base64 text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  n8n_execution_id text DEFAULT '',
  error_message text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions"
  ON submissions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);