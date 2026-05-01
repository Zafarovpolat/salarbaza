"""Smart RU/UZ name generation for Bito categories (Uzbek/transliteration)."""
from __future__ import annotations

import re
from typing import Tuple

# Hand-curated translations for the most common Bito category prefixes/words.
# Anything not matched falls back to the original name (UZ) and a transliteration (RU).
UZ_TO_RU_TO_UZ = {
    # name(UZ-as-stored)             (RU,                 UZ display)
    "vetka_main":                  ("Ветки",                  "Shoxlar"),
    "vaza":                        ("Вазы",                   "Vazalar"),
    "shamdon":                     ("Подсвечники",            "Shamdonlar"),
    "shar":                        ("Шары",                   "Sharlar"),
    "girlyanda":                   ("Гирлянды",               "Girlandalar"),
    "Dekor daraxt":                ("Декоративные деревья",   "Dekorativ daraxtlar"),
    "Dekor":                       ("Декор",                  "Dekor"),
    "Dekor mevasi":                ("Декоративные плоды",     "Dekorativ mevalar"),
    "Dekor barg":                  ("Декоративные листья",    "Dekorativ barglar"),
    "Dekor gul":                   ("Декоративные цветы",     "Dekorativ gullar"),
    "Dekor butun":                 ("Декоративные композиции", "Dekorativ kompozitsiyalar"),
    "Dekor yopiq":                 ("Декор закрытый",         "Yopiq dekor"),
    "gul":                         ("Цветы",                  "Gullar"),
    "Gullar":                      ("Цветы",                  "Gullar"),
    "Mebel":                       ("Мебель",                 "Mebel"),
    "Sham":                        ("Свечи",                  "Shamlar"),
    "Suniy gul":                   ("Искусственные цветы",    "Suniy gullar"),
    "Suniy daraxt":                ("Искусственные деревья",  "Suniy daraxtlar"),
    "Suniy barg":                  ("Искусственные листья",   "Suniy barglar"),
    "Plastik":                     ("Пластиковые изделия",    "Plastik mahsulotlar"),
    "Plastik gul":                 ("Пластиковые цветы",      "Plastik gullar"),
    "Karkasli":                    ("Каркасные",              "Karkasli"),
    "Tsvetok":                     ("Цветок",                 "Gul"),
    "kompozitsiya":                ("Композиции",             "Kompozitsiyalar"),
    "moss":                        ("Мох",                    "Yo'sin"),
    "succulent":                   ("Суккуленты",             "Sukkulentlar"),
    "succulents":                  ("Суккуленты",             "Sukkulentlar"),
    "Asosiy":                      ("Основное",               "Asosiy"),
    "default":                     ("Без категории",          "Kategoriyasiz"),
}

# transliteration pairs (rough, Uzbek Latin -> Cyrillic-Russian style for fallback)
_TRANSLIT_PAIRS = [
    ("o'", "о"), ("g'", "г"),
    ("Sh", "Ш"), ("Ch", "Ч"),
]


def _translit(s: str) -> str:
    out = s
    for a, b in _TRANSLIT_PAIRS:
        out = out.replace(a, b)
    return out


def _slugify(s: str) -> str:
    s = s.lower().replace("'", "").replace("`", "").replace("’", "")
    s = re.sub(r"[^a-z0-9а-яё]+", "-", s, flags=re.UNICODE)
    s = re.sub(r"-+", "-", s).strip("-")
    return s or "category"


def smart_translate(uz_name: str) -> Tuple[str, str]:
    """Return (RU, UZ) display names for a Bito category name."""
    uz_name = (uz_name or "").strip()
    if not uz_name:
        return "Без названия", "Nomsiz"

    if uz_name in UZ_TO_RU_TO_UZ:
        return UZ_TO_RU_TO_UZ[uz_name]

    # Try lowercased variant
    if uz_name.lower() in UZ_TO_RU_TO_UZ:
        return UZ_TO_RU_TO_UZ[uz_name.lower()]

    # Word-level match: take the first known word
    parts = re.split(r"[_\s\-/]+", uz_name)
    matched = []
    for p in parts:
        for key in (p, p.lower()):
            if key in UZ_TO_RU_TO_UZ:
                matched.append(UZ_TO_RU_TO_UZ[key])
                break

    if matched:
        ru = " ".join(m[0] for m in matched)
        uz = " ".join(m[1] for m in matched)
        return ru, uz

    # Fallback: keep the original Uzbek; for RU transliterate roughly
    ru = _translit(uz_name)
    if not re.search(r"[А-Яа-яЁё]", ru):
        ru = uz_name  # leave Latin if no Cyrillic mapping happened
    return ru, uz_name


def smart_slug(uz_name: str, bito_id: str) -> str:
    """Slug for Supabase categories table — must be unique."""
    base = _slugify(uz_name)
    return f"{base}-{bito_id[-6:]}"
