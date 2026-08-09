ALTER TABLE customers ADD COLUMN is_active tinyint(1) NOT NULL DEFAULT 1 AFTER is_foreign;
