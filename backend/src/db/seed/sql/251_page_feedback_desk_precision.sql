ALTER TABLE page_feedback_actions
  MODIFY created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);

ALTER TABLE page_feedback_releases
  MODIFY created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
