-- Run outside a transaction: CREATE INDEX CONCURRENTLY cannot run in a transaction block.
-- Retained legacy clients still read review logs by user and review timestamp.
CREATE INDEX CONCURRENTLY IF NOT EXISTS review_logs_user_date_idx
  ON review_logs (user_id, review_date);

-- Supports lookups of the active (non-backup) profile without indexing backups.
CREATE INDEX CONCURRENTLY IF NOT EXISTS profile_data_active_user_idx
  ON profile_data (user_id)
  WHERE is_backup = false;
