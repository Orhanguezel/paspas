#!/usr/bin/env python3
"""Hakkimizda sayfa icerigini repo JSON'undan canli site_settings'e tasir (G4).

Kaynak: frontend/src/config/pages/hakkimizda-page.json  ({tr: {...}, en: {...}})
Hedef anahtarlar: web.promats.frontend.page_content.hakkimizda.locale.{tr,en}

Calistirma (yerelden):
  python3 scripts/hakkimizda-page-content-seed-20260828.py | ssh vps-paspas \
    "mysql -u app -pApp2026paspas promats_erp --default-character-set=utf8mb4"

Mevcut anahtar varsa ON DUPLICATE KEY UPDATE ile gunceller (idempotent).
"""
import json
import pathlib
import uuid

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "frontend/src/config/pages/hakkimizda-page.json"


def sql_quote(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


def main() -> None:
    data = json.loads(SRC.read_text(encoding="utf-8"))
    print("SET NAMES utf8mb4;")
    for locale in ("tr", "en"):
        content = data[locale]
        key = f"web.promats.frontend.page_content.hakkimizda.locale.{locale}"
        value = json.dumps(content, ensure_ascii=False, separators=(",", ":"))
        row_id = "wps-" + uuid.uuid4().hex[:32]
        print(
            "INSERT INTO site_settings (id,`key`,value) VALUES "
            f"({sql_quote(row_id)},{sql_quote(key)},{sql_quote(value)}) "
            "ON DUPLICATE KEY UPDATE value=VALUES(value),updated_at=CURRENT_TIMESTAMP(3);"
        )


if __name__ == "__main__":
    main()
