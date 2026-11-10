CREATE TABLE IF NOT EXISTS page_feedback_actions (
  id char(36) NOT NULL PRIMARY KEY,
  thread_id char(36) NOT NULL,
  party varchar(24) NOT NULL,
  work_phase varchar(24) DEFAULT NULL,
  expected_action varchar(1000) DEFAULT NULL,
  changed_by_user_id char(36) DEFAULT NULL,
  changed_by_name varchar(120) DEFAULT NULL,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_page_feedback_actions_thread (thread_id, created_at),
  CONSTRAINT fk_page_feedback_actions_thread FOREIGN KEY (thread_id) REFERENCES page_feedback_threads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS page_feedback_releases (
  id char(36) NOT NULL PRIMARY KEY,
  thread_id char(36) NOT NULL,
  release_state varchar(24) NOT NULL,
  evidence varchar(1000) NOT NULL,
  changed_by_user_id char(36) DEFAULT NULL,
  changed_by_name varchar(120) DEFAULT NULL,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_page_feedback_releases_thread (thread_id, created_at),
  CONSTRAINT fk_page_feedback_releases_thread FOREIGN KEY (thread_id) REFERENCES page_feedback_threads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS page_feedback_watchers (
  thread_id char(36) NOT NULL,
  user_id char(36) NOT NULL,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (thread_id, user_id),
  KEY idx_page_feedback_watchers_user (user_id),
  CONSTRAINT fk_page_feedback_watchers_thread FOREIGN KEY (thread_id) REFERENCES page_feedback_threads(id) ON DELETE CASCADE,
  CONSTRAINT fk_page_feedback_watchers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
