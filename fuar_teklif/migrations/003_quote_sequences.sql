CREATE TABLE quote_sequences (
  sequence_year int PRIMARY KEY,
  current_value int NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
