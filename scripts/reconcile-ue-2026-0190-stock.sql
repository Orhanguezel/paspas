-- YN-2da4ed48: Isletmenin tamamlanmis takim olarak dogruladigi operator
-- girislerini ara urunden mamule aktar. Canlida bir kez, release sonrasi calisir.
DELIMITER //
CREATE PROCEDURE reconcile_ue_2026_0190_stock()
BEGIN
  DECLARE v_order_id char(36) DEFAULT '16c60c9e-7a4f-40b6-ac12-92f07c6387cc';
  DECLARE v_source_id char(36) DEFAULT '6984a48a-dd5a-670f-8322-7ccb1353de01';
  DECLARE v_target_id char(36) DEFAULT 'a342bf84-296b-440e-bd26-00b0a0f93017';
  DECLARE v_actual_target char(36);
  DECLARE v_source_stock decimal(12,4);
  DECLARE v_target_stock decimal(12,4);
  DECLARE v_legacy decimal(12,4);
  DECLARE v_operator_net decimal(12,4);
  DECLARE v_done int;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  SELECT stok_hedef_urun_id INTO v_actual_target
    FROM uretim_emirleri WHERE id = v_order_id FOR UPDATE;
  IF v_actual_target IS NULL OR v_actual_target <> v_target_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock target does not match confirmed order';
  END IF;

  SELECT stok INTO v_source_stock FROM urunler WHERE id = v_source_id FOR UPDATE;
  SELECT stok INTO v_target_stock FROM urunler WHERE id = v_target_id FOR UPDATE;
  SELECT COALESCE(SUM(net_miktar), 0) INTO v_operator_net
    FROM operator_gunluk_kayitlari WHERE uretim_emri_id = v_order_id;
  SELECT COALESCE(SUM(miktar), 0) INTO v_legacy
    FROM hareketler
    WHERE referans_id = v_order_id AND urun_id = v_source_id
      AND hareket_tipi = 'giris' AND referans_tipi = 'uretim';
  SELECT COUNT(*) INTO v_done FROM hareketler
    WHERE referans_id = v_order_id AND aciklama = 'YN-2da4ed48 stok hedefi duzeltmesi';
  IF v_done <> 0 OR v_legacy <= 0 OR v_legacy > v_operator_net
     OR v_source_stock < v_legacy OR v_target_stock IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reconciliation precondition failed';
  END IF;

  INSERT INTO hareketler (id, urun_id, hareket_tipi, referans_tipi, referans_id, miktar, aciklama)
    VALUES (UUID(), v_source_id, 'cikis', 'uretim', v_order_id, v_legacy, 'YN-2da4ed48 stok hedefi duzeltmesi');
  INSERT INTO hareketler (id, urun_id, hareket_tipi, referans_tipi, referans_id, miktar, aciklama)
    VALUES (UUID(), v_target_id, 'giris', 'uretim', v_order_id, v_legacy, 'YN-2da4ed48 stok hedefi duzeltmesi');
  UPDATE urunler SET stok = stok - v_legacy WHERE id = v_source_id;
  UPDATE urunler SET stok = stok + v_legacy WHERE id = v_target_id;
  COMMIT;
  SELECT v_legacy AS transferred_sets;
END//
DELIMITER ;
CALL reconcile_ue_2026_0190_stock();
DROP PROCEDURE reconcile_ue_2026_0190_stock;
