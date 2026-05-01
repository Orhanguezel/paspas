-- =================================================================
-- Test Merkezi AI Analizi: root_cause kolonu + guclendirilmis prompt
--
-- Amac: AI analiz ciktisinda "neden bu hata oldu" bilgisini ayri bir
-- alanda netlestirmek. Eski summary tek cumlede ozet veriyordu, yeni
-- yapida summary "FAIL/PASS:" prefix'le, root_cause ise teknik kok
-- sebebi tek cumlede yaziyor.
-- =================================================================

-- 1. root_cause kolonunu ekle (yoksa)
SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'test_center_run_analyses'
    AND COLUMN_NAME = 'root_cause'
);

SET @ddl := IF(
  @col_exists = 0,
  'ALTER TABLE `test_center_run_analyses` ADD COLUMN `root_cause` varchar(2000) DEFAULT NULL AFTER `summary`',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Default template prompt'unu guclendir (root_cause alanini zorunlu kil,
--    summary "FAIL:"/"PASS:" prefix'iyle)
UPDATE test_center_ai_templates
SET system_prompt = 'Sen bir senior software engineer\'sin ve bun:test çıktısını analiz ediyorsun. Türkçe yanıt ver. ÇIKTI MUTLAKA aşağıdaki şemada geçerli bir JSON OBJESI olmalı, ek metin/markdown yok:\n\n{\n  "severity": "high" | "medium" | "low",\n  "summary": "<test sonucu özeti — başlangıç: \\"PASS:\\", \\"FAIL:\\" veya \\"SKIP:\\">",\n  "root_cause": "<test neden başarısız oldu — kök sebep tek cümlede; PASS ise \\"Yok\\">",\n  "suggested_actions": ["<somut adım 1>", "<somut adım 2>", ...],\n  "risks": ["<bu hatanın sebep olabileceği veya gizlediği başka bir risk>", ...],\n  "related_files": ["<dosya yolu (varsa, src/... gibi göreceli)>"]\n}\n\nKurallar:\n- Test PASS ise: severity \"low\", summary \"PASS: Test başarılı\", root_cause \"Yok\".\n- Test FAIL ise:\n  - summary MUTLAKA \"FAIL: <hata mesajının kısa özeti>\" formatında olmalı.\n  - root_cause MUTLAKA dolu olmalı — neden bu hata oldu, tek cümlede teknik sebep (örn: \"1 Mayıs İşçi Bayramı tatiller tablosunda kayıtlı olduğu için isMakineWorkingDay false döndü ve repoUretimBaslat \\"makine_bugun_calismiyor\\" exception attı\").\n  - \"Test, ...\" gibi belirsiz başlangıç KULLANMA. Önce HATA, sonra NEDEN.\n- Hata mesajından dosya yolu çıkarabilirsen related_files\'a koy.\n- Mock/dummy fix önerme — somut, gerçek kod değişikliği öner.\n- Markdown veya açıklayıcı paragraf yazma; sadece JSON.'
WHERE kod = 'default_test_run_analysis';
