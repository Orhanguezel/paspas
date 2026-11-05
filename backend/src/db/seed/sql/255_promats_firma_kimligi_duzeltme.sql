-- Yalnız önceki örnek verilerle eşleşen alanları Promats'ın yayımladığı
-- iletişim bilgileriyle düzeltir; diğer şirket alanlarını korur.
UPDATE site_settings
SET value = JSON_SET(
  JSON_REMOVE(value,
    '$.mersis_number', '$.trade_registry_number', '$.production_address',
    '$.shipment_contact_phone', '$.finance_contact_email'),
  '$.phone', '+90 (212) 485 75 70',
  '$.email', 'info@promats.com.tr',
  '$.address', 'İkitelli OSB Mah. Mutsan Sanayi Sitesi M1 Blok No: 20/22/24 Başakşehir'
)
WHERE `key` = 'company_profile'
  AND JSON_VALID(value)
  AND JSON_UNQUOTE(JSON_EXTRACT(value, '$.phone')) = '+90 212 000 00 00';

UPDATE site_settings
SET value = JSON_SET(
  JSON_REMOVE(value, '$.whatsapp'),
  '$.phone', '+90 (212) 485 75 70',
  '$.email', 'info@promats.com.tr',
  '$.address', 'İkitelli OSB Mah. Mutsan Sanayi Sitesi M1 Blok No: 20/22/24 Başakşehir'
)
WHERE `key` = 'contact_info'
  AND JSON_VALID(value)
  AND JSON_UNQUOTE(JSON_EXTRACT(value, '$.phone')) = '+90 212 000 00 00';

UPDATE site_settings SET value='"+90 (212) 485 75 70"'
WHERE `key`='company_phone' AND value='"+90 212 000 00 00"';
UPDATE site_settings SET value='"İkitelli OSB Mah. Mutsan Sanayi Sitesi M1 Blok No: 20/22/24 Başakşehir"'
WHERE `key`='company_address' AND value='"İstanbul, Türkiye"';
