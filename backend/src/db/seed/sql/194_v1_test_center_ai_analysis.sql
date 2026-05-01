-- =============================================================
-- Test Merkezi AI Analiz Altyapısı
-- - test_center_ai_templates: prompt template kayıtları (CRUD)
-- - test_center_run_analyses: her run için yapılan AI analiz sonuçları
-- =============================================================

CREATE TABLE IF NOT EXISTS `test_center_ai_templates` (
  `id` char(36) NOT NULL,
  `kod` varchar(128) NOT NULL,
  `ad` varchar(255) NOT NULL,
  `aciklama` varchar(1000) DEFAULT NULL,
  `system_prompt` text NOT NULL,
  `user_template` text NOT NULL,
  `kategori` varchar(64) NOT NULL DEFAULT 'test_run_analysis',
  `provider` varchar(32) NOT NULL DEFAULT 'anthropic',
  `model` varchar(128) DEFAULT NULL,
  `temperature` decimal(3,2) DEFAULT NULL,
  `max_tokens` int DEFAULT NULL,
  `is_default` tinyint NOT NULL DEFAULT 0,
  `is_active` tinyint NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_test_center_ai_templates_kod` (`kod`),
  KEY `idx_test_center_ai_templates_kategori` (`kategori`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_center_run_analyses` (
  `id` char(36) NOT NULL,
  `run_id` char(36) NOT NULL,
  `template_id` char(36) DEFAULT NULL,
  `provider` varchar(32) NOT NULL,
  `model` varchar(128) NOT NULL,
  `severity` varchar(16) NOT NULL,
  `summary` varchar(2000) NOT NULL,
  `root_cause` varchar(2000) DEFAULT NULL,
  `suggested_actions` json DEFAULT NULL,
  `risks` json DEFAULT NULL,
  `related_files` json DEFAULT NULL,
  `raw_response` text DEFAULT NULL,
  `tokens_input` int DEFAULT NULL,
  `tokens_output` int DEFAULT NULL,
  `latency_ms` int DEFAULT NULL,
  `cost_usd` decimal(10, 6) DEFAULT NULL,
  `error_msg` varchar(1000) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_test_center_run_analyses_run` (`run_id`, `created_at`),
  KEY `idx_test_center_run_analyses_severity` (`severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default prompt template — bun:test çıktısı analizi
INSERT IGNORE INTO test_center_ai_templates (
  id, kod, ad, aciklama, system_prompt, user_template,
  kategori, provider, model, temperature, max_tokens, is_default, is_active
) VALUES (
  '00000000-0000-4000-8000-000000000a01',
  'default_test_run_analysis',
  'Varsayılan Test Sonuç Analizi',
  'Bun test çıktısını analiz edip kök neden, yapılacak işlemler, riskler ve ilgili dosyalar üreten varsayılan template.',
  'Sen bir senior software engineer\'sin ve bun:test çıktısını analiz ediyorsun. Türkçe yanıt ver. ÇIKTI MUTLAKA aşağıdaki şemada geçerli bir JSON OBJESI olmalı, ek metin/markdown yok:\n\n{\n  "severity": "high" | "medium" | "low",\n  "summary": "<test sonucu özeti — başlangıç: \\"PASS:\\", \\"FAIL:\\" veya \\"SKIP:\\">",\n  "root_cause": "<test neden başarısız oldu — kök sebep tek cümlede; PASS ise \\"Yok\\">",\n  "suggested_actions": ["<somut adım 1>", "<somut adım 2>", ...],\n  "risks": ["<bu hatanın sebep olabileceği veya gizlediği başka bir risk>", ...],\n  "related_files": ["<dosya yolu (varsa, src/... gibi göreceli)>"]\n}\n\nKurallar:\n- Test PASS ise: severity \"low\", summary \"PASS: Test başarılı\", root_cause \"Yok\".\n- Test FAIL ise:\n  - summary MUTLAKA \"FAIL: <hata mesajının kısa özeti>\" formatında olmalı.\n  - root_cause MUTLAKA dolu olmalı — neden bu hata oldu, tek cümlede teknik sebep (örn: \"1 Mayıs İşçi Bayramı tatiller tablosunda kayıtlı olduğu için isMakineWorkingDay false döndü ve repoUretimBaslat \\"makine_bugun_calismiyor\\" exception attı\").\n  - \"Test, ...\" gibi belirsiz başlangıç KULLANMA. Önce HATA, sonra NEDEN.\n- Hata mesajından dosya yolu çıkarabilirsen related_files\'a koy.\n- Mock/dummy fix önerme — somut, gerçek kod değişikliği öner.\n- Markdown veya açıklayıcı paragraf yazma; sadece JSON.',
  'Test bilgisi:\n- Başlık: {{title}}\n- Komut: {{command}}\n- Status: {{status}}\n- Pass: {{passCount}} / Fail: {{failCount}} / Skip: {{skipCount}}\n\nÇıktı kesiti:\n```\n{{outputExcerpt}}\n```\n\nLütfen yukarıdaki kuralları izleyerek JSON yanıt ver.',
  'test_run_analysis',
  'anthropic',
  'claude-sonnet-4-5',
  0.20,
  1024,
  1,
  1
);
