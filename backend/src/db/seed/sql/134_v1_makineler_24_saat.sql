-- ============================================================================
-- PASPAS ERP V1 — Makinelerde 24 saat çalışma bilgisi
-- ============================================================================

UPDATE `makineler`
SET `calisir_24_saat` = CASE
  WHEN `kod` LIKE 'EKS-%' THEN 1
  WHEN `kod` LIKE 'PRS-%' THEN 1
  WHEN `kod` LIKE 'FRN-%' THEN 1
  ELSE 0
END;

DELETE FROM `tatil_makineler`;
