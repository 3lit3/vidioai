/*
  # Add DELETE policy for submissions table

  1. Security
    - Add DELETE policy allowing users to delete their own submissions
    - Only allows deletion of pending submissions to prevent accidental loss of processing/completed videos
*/

CREATE POLICY "Users can delete own pending submissions"
  ON submissions FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND status = 'pending'
  );
