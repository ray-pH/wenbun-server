ALTER TABLE auth_providers
  DROP CONSTRAINT auth_providers_user_id_fkey,
  ADD CONSTRAINT auth_providers_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE profile_data
  DROP CONSTRAINT profile_data_user_id_fkey,
  ADD CONSTRAINT profile_data_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE review_logs
  DROP CONSTRAINT review_logs_user_id_fkey,
  ADD CONSTRAINT review_logs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE auto_grading_logs
  DROP CONSTRAINT auto_grading_logs_user_id_fkey,
  ADD CONSTRAINT auto_grading_logs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
