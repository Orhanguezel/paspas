#!/usr/bin/env python3
"""Eski iki dilli Promats PDF'inden okunaklı, yalnız Türkçe katalog üretir.

Kaynak PDF'nin tasarım dosyası bulunmadığı için metin katmanları kontrollü olarak
temizlenir; Türkçe açıklamalar boşalan EN alanına daha büyük puntoyla yeniden dizilir.
"""

from __future__ import annotations

import runpy
import sys
from pathlib import Path

import fitz


helpers = runpy.run_path(str(Path(__file__).with_name("fix-promats-catalog-tr.py")))
corrected = helpers["corrected"]
sampled_fill = helpers["sampled_fill"]
rgb = helpers["rgb"]

NOTO = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"
NOTO_BOLD = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
OVERVIEW_PAGES = list(range(3, 36, 2))  # sıfır tabanlı: 4, 6, ... 36
DETAIL_PAGES = list(range(4, 37, 2))    # sıfır tabanlı: 5, 7, ... 37

EN_STARTS = (
    "with ", "footrest ", "design of ", "passenger ", "in its ", "exactly ",
    "barrier", "liquids ", "the ", "provides ", "due to ", "through ",
    "driver ", "designed ", "your ", "prevents ", "our ", "we ", "as ",
)
EN_LABELS = {
    "DIMENSIONS", "DIMESIONS", "SET WEIGHT", "PACK WEIGHT",
    "LEFT FRONT", "RIGHT FRONT", "BACK",
    "Rest your foot", "Including the spot", "Everywhere", "Fully heals",
    "5PCS FULL SET", "Cut & Ap ply", "Cut & Apply", "Cleanable",
    "Heat Resistant",
}
TEXT_REPLACEMENTS = {
    "Siyah / Black": "Siyah", "Bej / Beige": "Bej", "Gri / Grey": "Gri",
    "Kırmızı / Red": "Kırmızı", "Mavi / Blue": "Mavi",
    "Gümüş / Silver": "Gümüş", "Karbon / Carbon": "Karbon",
    "OEM QUALITY": "OEM KALİTESİ", "O E M Q U A L I T Y": "OEM KALİTESİ",
    "D E E P P O O L": "DERİN HAVUZ", "W I T H P O O L": "HAVUZLU",
    "D E S I G N W I T H P O O L": "HAVUZLU TASARIM",
}

# Başlıkların koordinatları açıklamalarla iç içe geçtiği için her ürünün
# açıklama paneli açıkça tanımlıdır. Böylece MAXIMUM / SERIES gibi büyük
# başlıkların tek bir harfi dahi redaksiyona girmez.
OVERVIEW_ZONES = {
    3: (50, 140, 303, 241), 5: (50, 140, 303, 241),
    7: (50, 144, 303, 229), 9: (50, 144, 303, 234),
    11: (50, 144, 303, 216), 13: (50, 144, 303, 241),
    15: (50, 139, 303, 241), 17: (50, 144, 303, 229),
    19: (50, 144, 303, 229), 21: (50, 144, 303, 236),
    23: (50, 144, 303, 241), 25: (50, 169, 303, 218),
    27: (50, 145, 315, 245), 29: (50, 151, 303, 218),
    31: (50, 146, 303, 207), 33: (50, 149, 303, 205),
    35: (50, 142, 320, 245),
}
OVERVIEW_TITLES = {
    3: "MAXIMUM", 5: "PROFESSIONAL", 7: "EXTRA PLUS",
    9: "EXTRA PLUS CHROME", 11: "EXTRA POOL", 13: "EXTRA POOL CHROME",
    15: "PARS", 17: "STAR", 19: "STAR PLUS", 21: "KAPİTONE",
    23: "PREMIUM", 25: "GLIPTONE", 27: "NEXT GENERATION",
    29: "NEXT GENERATION CHROME", 31: "MERKÜR", 33: "GOLD",
    35: "BAŞAK",
}
DETAIL_ZONES = {
    4: (80, 382, 270, 465), 6: (86, 378, 262, 465),
    8: (86, 378, 264, 465), 10: (86, 378, 264, 465),
    12: (86, 378, 264, 465), 14: (86, 378, 264, 465),
    16: (86, 371, 264, 457), 18: (84, 373, 258, 445),
    20: (84, 373, 258, 445), 22: (84, 373, 258, 445),
    24: (82, 373, 260, 445), 26: (84, 373, 258, 445),
    28: (84, 373, 258, 445), 30: (84, 373, 258, 445),
    32: (86, 371, 264, 457), 34: (86, 371, 264, 457),
    36: (84, 373, 258, 445),
}
OVERVIEW_TEXT_OVERRIDES = {
    27: (
        "Universal kesim çizgileri sayesinde yerli ve yabancı 4x4, SUV ve ticari "
        "araçlarla uyumludur. Manuel ve otomatik araçlarda kullanılabilir. %100 PVC "
        "enjeksiyon ve ileri üretim teknolojisiyle üretilen yapısı, zamanla aşınmaya "
        "ve biçim bozukluğuna karşı dayanıklıdır. Özel kanalları dökülen sıvıları "
        "toplayarak aracın temiz kalmasına yardımcı olur. Kolayca yıkanır, hızlı kurur "
        "ve ıslandığında koku yapmaz."
    ),
    35: (
        "Universal kesim çizgileri sayesinde yerli ve yabancı 4x4, SUV ve ticari "
        "araçlarla uyumludur. Manuel ve otomatik araçlarda kullanılabilir. %100 PVC "
        "enjeksiyon yapısı aşınmaya ve biçim bozukluğuna karşı dayanıklıdır. Özel "
        "kanalları sıvıları bir arada tutarak aracın temiz kalmasına yardımcı olur. "
        "Kolayca yıkanır, hızlı kurur ve ıslandığında koku yapmaz."
    ),
}


def lines(page: fitz.Page):
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if text:
                yield line, text


def is_english(text: str) -> bool:
    clean = text.strip()
    low = clean.lower()
    if clean in EN_LABELS:
        return True
    if any(low.startswith(prefix) for prefix in EN_STARTS):
        return True
    return any(phrase in low for phrase in (
        "vehicle", "manufactured", "compatible with", "mud, soil", "mud, dust",
        "high-quality", "full set", "heat resistant", "cleanable",
    ))


def clean_join(parts: list[str]) -> str:
    text = " ".join(parts)
    text = text.replace("- ", "").replace(" -", "-")
    text = text.replace("4x4,suv,ticari", "4x4, SUV ve ticari")
    text = text.replace("PVC Enjeksiyon", "PVC enjeksiyon")
    text = text.replace("ham maddesi", "ham maddesi")
    text = text.replace("Soför", "Şoför")
    text = text.replace("klıﬂarı", "kılıfları")
    text = text.replace("extra", "ekstra")
    text = text.replace("silver", "gümüş")
    text = text.replace("krom karbon", "karbon")
    return corrected(text).strip()


def add_redaction(page: fitz.Page, rect: fitz.Rect) -> None:
    page.add_redact_annot(rect, fill=sampled_fill(page, rect))


def replace_span(page: fitz.Page, span: dict, new: str | None) -> tuple[fitz.Rect, str | None, float, int]:
    rect = fitz.Rect(span["bbox"])
    add_redaction(page, rect + (-0.5, 0.5, 1.0, -0.5))
    return rect, new, span["size"], span["color"]


def collect_zone(page: fitz.Page, x_max: float, y_min: float, y_max: float) -> tuple[list[str], list[fitz.Rect]]:
    tr: list[str] = []
    rects: list[fitz.Rect] = []
    english_started = False
    for line, text in sorted(lines(page), key=lambda item: (item[0]["bbox"][1], item[0]["bbox"][0])):
        x0, y0, x1, y1 = line["bbox"]
        size = max(span["size"] for span in line["spans"])
        if x0 > x_max or not (y_min <= y0 <= y_max) or size > 11:
            continue
        if is_english(text):
            english_started = True
            rects.append(fitz.Rect(line["bbox"]))
            continue
        # İngilizce paragraf başladıktan sonraki metin bu açıklama alanına ait değil.
        if english_started:
            continue
        tr.append(text)
        rects.append(fitz.Rect(line["bbox"]))
    return tr, rects


def insert_box(page: fitz.Page, rect: fitz.Rect, text: str, fontsize: float, color: tuple[float, float, float],
               align: int = fitz.TEXT_ALIGN_LEFT) -> None:
    size = fontsize
    while size >= 7.8:
        result = page.insert_textbox(
            rect, text, fontname="TrCatalog", fontfile=NOTO, fontsize=size,
            lineheight=1.18, color=color, align=align, overlay=True,
        )
        if result >= 0:
            return
        size -= 0.4
    raise RuntimeError(f"Metin kutuya sığmadı: {text[:50]!r}")


def original_turkish(page: fitz.Page, rect: fitz.Rect, max_size: float = 11) -> str:
    parts = []
    english_started = False
    for line, text in sorted(lines(page), key=lambda item: (item[0]["bbox"][1], item[0]["bbox"][0])):
        box = fitz.Rect(line["bbox"])
        size = max(span["size"] for span in line["spans"])
        if rect.intersects(box) and box.x0 < rect.x1 and size <= max_size:
            if is_english(text):
                english_started = True
                continue
            if english_started:
                continue
            parts.append(text)
    return clean_join(parts)


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Kullanım: build-promats-catalog-tr-only.py INPUT.pdf OUTPUT.pdf")
    source, target = map(Path, sys.argv[1:])
    doc = fitz.open(source)
    redraw: list[tuple[int, fitz.Rect, str, float, tuple[float, float, float]]] = []

    # Kapak alt sloganını Türkçeleştir.
    cover = doc[0]
    tagline = fitz.Rect(55, 485, 390, 520)
    add_redaction(cover, tagline)
    redraw.append((0, fitz.Rect(65, 490, 390, 515), "BİRİNCİ SINIF OTOMOBİL PASPASLARI", 13, (0.84, 0.84, 0.84)))

    # Hakkımızda sayfasını yalnız Türkçe ve daha büyük puntoyla yeniden kur.
    about = doc[2]
    about_area = fitz.Rect(62, 62, 460, 500)
    add_redaction(about, about_area)
    about_text = (
        "HAKKIMIZDA\n\n"
        "Firmamız 2017 yılında kurulmuştur. Gelişmiş makine parkuru, üretim teknolojisi, "
        "güçlü bilgi birikimi ve nitelikli kadrosuyla kısa sürede sektörün öncü firmaları "
        "arasına girmiştir. Türkiye genelindeki toptan bayi ağına hizmet veren Promats, "
        "doğrudan ve dolaylı olarak 20'den fazla ülkeye ihracat yapmaktadır.\n\n"
        "VİZYONUMUZ\n"
        "Sektör standartlarına uygun üretim yapmak, koşulsuz müşteri memnuniyetine "
        "odaklanmak ve yüksek kaliteli ürünler geliştirerek sürdürülebilir değer oluşturmaktır.\n\n"
        "DEĞERLERİMİZ\n"
        "Ürettiğimiz her ürünün sorumluluğunu taşır, fiyat rekabeti uğruna kaliteden ödün vermeyiz.\n\n"
        "HEDEFLERİMİZ\n"
        "Bilgi, deneyim, yenilik ve teknolojiyi bir araya getirerek en yüksek kaliteyi "
        "verimli ve güvenilir biçimde sunmayı hedefleriz."
    )
    redraw.append((2, fitz.Rect(70, 68, 455, 475), about_text, 11.2, (0.11, 0.11, 0.11)))

    # Ürün tanıtım sayfaları: EN paragrafı kaldır, TR açıklamayı büyüt.
    for index in OVERVIEW_PAGES:
        page = doc[index]
        # Kaynak tasarımda başlık ile açıklama katmanları çakışıyor. Başlığı
        # ayrı bir şeritte yeniden kurmak, kesik harfleri tamamen engeller.
        title_zone = fitz.Rect(46, 91, 500, 142)
        page.add_redact_annot(title_zone, fill=(0.10, 0.11, 0.11))
        zone = fitz.Rect(OVERVIEW_ZONES[index])
        text = OVERVIEW_TEXT_OVERRIDES.get(index, original_turkish(page, zone))
        add_redaction(page, zone)
        fontsize = 8.8 if len(text) > 600 else 9.5 if len(text) > 380 else 10.3
        redraw.append((index, zone + (3, 3, -4, -3), text, fontsize, (0.92, 0.92, 0.92)))

        # “Tüm Binek...” bloğunu tek, düzgün bir Türkçe ifadeyle yenile.
        compat = fitz.Rect(662, 516, 835, 558)
        page.add_redact_annot(compat, fill=(0.97, 0.97, 0.95))

    # Detay/renk sayfaları: EN açıklamaları ve etiketleri kaldır, TR metni büyüt.
    for index in DETAIL_PAGES:
        page = doc[index]
        zone = fitz.Rect(DETAIL_ZONES[index])
        text = original_turkish(page, zone)
        add_redaction(page, zone)
        redraw.append((index, zone + (5, 5, -5, -4), text, 10.5, (0.08, 0.08, 0.08)))

    # Ürün/renk sayfalarındaki ikincil İngilizce etiketleri kaldır.
    span_redraw: list[tuple[int, fitz.Rect, str | None, float, int]] = []
    for index in OVERVIEW_PAGES + DETAIL_PAGES:
        page = doc[index]
        for line, _text in list(lines(page)):
            for span in line["spans"]:
                old = span["text"].strip()
                if old in TEXT_REPLACEMENTS:
                    span_redraw.append((index, *replace_span(page, span, TEXT_REPLACEMENTS[old])))
                elif old in EN_LABELS:
                    replace_span(page, span, None)

    # Not sayfalarının İngilizce başlığını Türkçeleştir.
    for index in (37, 38):
        page = doc[index]
        for hit in page.search_for("N O T I C E S"):
            add_redaction(page, hit + (-3, -2, 3, 2))
            redraw.append((index, hit + (-2, -1, 75, 3), "N O T L A R", 12, (0.9, 0.9, 0.9)))

    # Tüm redaksiyonları uygula.
    for page in doc:
        page.apply_redactions()

    # Büyük TR blokları.
    for index, rect, text, size, color in redraw:
        if index == 2:
            # Hakkımızda başlıkları aynı kutuda, okunaklı tek font ailesiyle.
            insert_box(doc[index], rect, text, size, color)
        else:
            insert_box(doc[index], rect, text, size, color)

    for index, rect, text, size, color_value in span_redraw:
        if text:
            insert_box(
                doc[index], rect + (0, -1, max(35, rect.width * 0.6), 3),
                text, min(size, 9.5), rgb(color_value),
            )

    # Kısa başlıklar doğrudan yerleştirilir; bu yöntem PDF'nin dar özgün
    # metin kutularında font küçülmesini önler.
    for index in OVERVIEW_PAGES:
        page = doc[index]
        title = OVERVIEW_TITLES[index]
        title_size = 24 if len(title) < 20 else 20
        page.insert_text(
            fitz.Point(55, 128), title, fontname="TrCatalogBold",
            fontfile=NOTO_BOLD, fontsize=title_size, color=(0.97, 0.97, 0.97),
            overlay=True,
        )
        page.insert_text(
            fitz.Point(674, 536), "TÜM BİNEK VE SUV", fontname="TrCatalogBold",
            fontfile=NOTO_BOLD, fontsize=8.8, color=(0.08, 0.08, 0.08), overlay=True,
        )
        page.insert_text(
            fitz.Point(674, 548), "ARAÇLARLA UYUMLUDUR", fontname="TrCatalogBold",
            fontfile=NOTO_BOLD, fontsize=8.8, color=(0.08, 0.08, 0.08), overlay=True,
        )
    target.parent.mkdir(parents=True, exist_ok=True)
    doc.save(target, garbage=4, deflate=True, clean=True)
    print(f"Yalnız Türkçe katalog üretildi: {target}")


if __name__ == "__main__":
    main()
