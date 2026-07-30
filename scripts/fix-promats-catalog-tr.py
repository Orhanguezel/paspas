#!/usr/bin/env python3
"""Promats'ın kaynak tasarım dosyası bulunmayan eski PDF kataloğundaki TR yazım hatalarını düzeltir.

Gereksinim: pymupdf
Kullanım:
  python scripts/fix-promats-catalog-tr.py INPUT.pdf OUTPUT.pdf
"""

from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

import fitz


REPLACEMENTS = (
    ("F i r s t h   C l a s s", "F i r s t   C l a s s"),
    ("HAK KIMIZDA", "HAKKIMIZDA"),
    ("Firmamız ,", "Firmamız,"),
    ("kısa süre de", "kısa sürede"),
    ("Türkiye ye", "Türkiye'ye"),
    ("kısa sürede de direk", "kısa sürede doğrudan"),
    ("20 ye ülkeye", "20 ülkeye"),
    ("Vizoynumuz", "Vizyonumuz"),
    ("Hedeﬂerimiz", "Hedeflerimiz"),
    ("Sektörün de", "Sektörde"),
    ("yapmak ,", "yapmak,"),
    ("üst kalite de", "üst kalitede"),
    ("Promats olarak ,", "Promats olarak,"),
    ("bilgi ,", "bilgi,"),
    ("yenilik, ve teknoloji", "yenilik ve teknoloji"),
    ("4.5 cm lik", "4,5 cm'lik"),
    ("3.5 cm lik", "3,5 cm'lik"),
    ("2.5 cm lik", "2,5 cm'lik"),
    ("3cm lik", "3 cm'lik"),
    ("2cm lik", "2 cm'lik"),
    ("2.5Cm lik", "2,5 cm'lik"),
    ("3.5Cm lik", "3,5 cm'lik"),
    ("Tasarımında ki", "Tasarımındaki"),
    ("kalmaını", "kalmasını"),
    ("engeller aracınızın", "engeller, aracınızın"),
    ("havuzlu paspas sevenlerin", "havuzlu paspas tercih edenlerin"),
    ("PROFES SIONAL", "PROFESSIONAL"),
    ("EXTRA PO OL", "EXTRA POOL"),
    ("CROME", "CHROME"),
    ("aracınıza extra uyum", "aracınıza ekstra uyum"),
    ("extra bariyerli", "ekstra bariyerli"),
    ("Extra bariyerli", "Ekstra bariyerli"),
    ("CIRTLI SABITLEYICI", "CIRTLI SABİTLEYİCİ"),
    ("TEMIZLENEBILIR", "TEMİZLENEBİLİR"),
    ("DERIN", "DERİN"),
    ("A r a ç l a r i l e U y u m l u d u r.", "A r a ç l a r l a U y u m l u d u r."),
)


def rgb(color: int) -> tuple[float, float, float]:
    return ((color >> 16 & 255) / 255, (color >> 8 & 255) / 255, (color & 255) / 255)


def corrected(text: str) -> str:
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    return text


def sampled_fill(page: fitz.Page, rect: fitz.Rect) -> tuple[float, float, float]:
    pix = page.get_pixmap(matrix=fitz.Matrix(1, 1), alpha=False)
    colors: list[tuple[int, int, int]] = []
    x0, x1 = int(rect.x0), int(rect.x1)
    y0, y1 = int(rect.y0), int(rect.y1)
    # Metnin çevresindeki 3 px'lik halkadan en sık görülen zemini seç.
    for x in range(x0 - 4, x1 + 5):
        for y in (y0 - 4, y0 - 3, y1 + 3, y1 + 4):
            if 0 <= x < pix.width and 0 <= y < pix.height:
                colors.append(tuple((value // 4) * 4 for value in pix.pixel(x, y)[:3]))
    for y in range(y0 - 2, y1 + 3):
        for x in (x0 - 4, x0 - 3, x1 + 3, x1 + 4):
            if 0 <= x < pix.width and 0 <= y < pix.height:
                colors.append(tuple((value // 4) * 4 for value in pix.pixel(x, y)[:3]))
    chosen = Counter(colors).most_common(1)[0][0] if colors else (255, 255, 255)
    return tuple(channel / 255 for channel in chosen)


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Kullanım: fix-promats-catalog-tr.py INPUT.pdf OUTPUT.pdf")
    source, target = map(Path, sys.argv[1:])
    doc = fitz.open(source)
    noto = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"
    changes: list[tuple[int, fitz.Rect, str, str, float, int, tuple[float, float, float]]] = []

    for page_index, page in enumerate(doc):
        for block in page.get_text("dict")["blocks"]:
            for line in block.get("lines", []):
                for span in line["spans"]:
                    old = span["text"]
                    new = corrected(old)
                    if new != old:
                        rect = fitz.Rect(span["bbox"])
                        changes.append((page_index, rect, old, new, span["size"], span["color"], sampled_fill(page, rect)))

    for page_index in sorted({item[0] for item in changes}):
        page = doc[page_index]
        page_changes = [item for item in changes if item[0] == page_index]
        for _, rect, _old, _new, size, _color, fill in page_changes:
            # PDF font bbox'ları komşu satırlarla üst üste binebiliyor. Dikey alanı
            # daraltmak başlık/önceki satırın yanlışlıkla silinmesini önler.
            erase = fitz.Rect(rect.x0 - 0.7, rect.y0 + size * 0.22, rect.x1 + 1.2, rect.y1 - size * 0.12)
            page.add_redact_annot(erase, fill=fill)
        page.apply_redactions()
        for _, rect, _old, new, size, color, _fill in page_changes:
            baseline = fitz.Point(rect.x0, rect.y1 - max(1.2, size * 0.16))
            page.insert_text(
                baseline,
                new,
                fontsize=size,
                fontname="CatalogNoto",
                fontfile=noto,
                color=rgb(color),
                overlay=True,
            )

    # Kapaktaki “Firsth” kelimesinin fazladan h harfi PDF'de “h C” adlı tek
    # glif kümesinin başında tutuluyor. Yalnız h alanını temizle; yanındaki
    # “Class” harfine dokunma.
    cover = doc[0]
    for block in cover.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                if span["text"] == "h C":
                    full = fitz.Rect(span["bbox"])
                    h_rect = fitz.Rect(full.x0 - 0.3, full.y0 + 1, full.x0 + full.height * 0.55, full.y1 - 1)
                    cover.add_redact_annot(h_rect, fill=sampled_fill(cover, h_rect))
    cover.apply_redactions()

    target.parent.mkdir(parents=True, exist_ok=True)
    doc.save(target, garbage=4, deflate=True, clean=True)
    print(f"{len(changes)} metin alanı düzeltildi: {target}")


if __name__ == "__main__":
    main()
