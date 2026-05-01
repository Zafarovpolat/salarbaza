"""Variant A: group Bito products by 'root' code with color/size suffixes.

The Bito ERP stores each color/size as its own product (e.g. `B-1 white`,
`B-1 pink`). On the storefront we want a single product `B-1` with two color
options. This module derives the `root` from a Bito product name.
"""
from __future__ import annotations

import re
from collections import defaultdict
from typing import Dict, Iterable, List, Optional, Tuple

# Known color tokens; lowercase. Multi-word colors are matched greedily from the right.
COLOR_WORDS = {
    "white", "black", "red", "blue", "green", "yellow", "orange",
    "pink", "purple", "violet", "gray", "grey", "brown", "beige",
    "gold", "silver", "cream", "ivory", "olive", "lime", "mint",
    "peach", "coral", "rose", "magenta", "cyan", "navy", "teal",
    "fuchsia", "lavender", "khaki", "burgundy", "wine", "coffee",
    "chocolate", "tan", "salmon", "turquoise", "amber", "champagne",
    "pearl", "rust", "wenge", "antique", "moss", "mocco", "mocha",
    "nature", "natural", "mix",
    # observed Bito typos for "eucalyptus"
    "eucalyptus", "eucalptus", "ucalptus",
    # tone modifiers (only allowed adjacent to a real color)
    "cactus",
    "light", "dark", "bright", "soft", "hot",
}

# Color RU/UZ translations (best-effort; user can edit in DB after sync)
COLOR_RU_UZ = {
    "white":      ("Белый",         "Oq"),
    "black":      ("Чёрный",        "Qora"),
    "red":        ("Красный",       "Qizil"),
    "blue":       ("Синий",         "Ko'k"),
    "green":      ("Зелёный",       "Yashil"),
    "yellow":     ("Жёлтый",        "Sariq"),
    "orange":     ("Оранжевый",     "Apelsinrang"),
    "pink":       ("Розовый",       "Pushti"),
    "purple":     ("Пурпурный",     "Binafsha"),
    "violet":     ("Фиолетовый",    "Binafsha"),
    "gray":       ("Серый",         "Kulrang"),
    "grey":       ("Серый",         "Kulrang"),
    "brown":      ("Коричневый",    "Jigarrang"),
    "beige":      ("Бежевый",       "Bej"),
    "gold":       ("Золотой",       "Tilla"),
    "silver":     ("Серебряный",    "Kumush"),
    "cream":      ("Кремовый",      "Krem"),
    "ivory":      ("Слоновая кость", "Fil suyagi"),
    "olive":      ("Оливковый",     "Zaytun"),
    "lime":       ("Лаймовый",      "Layma"),
    "mint":       ("Мятный",        "Yalpiz"),
    "peach":      ("Персиковый",    "Shaftoli"),
    "coral":      ("Коралловый",    "Marjon"),
    "rose":       ("Розовый",       "Atirgul"),
    "magenta":    ("Маджента",      "Magenta"),
    "cyan":       ("Голубой",       "Moviy"),
    "navy":       ("Тёмно-синий",   "Tundayako'k"),
    "teal":       ("Бирюзовый",     "Firuza"),
    "fuchsia":    ("Фуксия",        "Fuksiya"),
    "lavender":   ("Лавандовый",    "Lavanda"),
    "khaki":      ("Хаки",          "Xaki"),
    "burgundy":   ("Бордовый",      "Bordo"),
    "wine":       ("Винный",        "Vino"),
    "coffee":     ("Кофейный",      "Kofe"),
    "chocolate":  ("Шоколадный",    "Shokolad"),
    "tan":        ("Загорелый",     "Quyosh"),
    "salmon":     ("Лососёвый",     "Losos"),
    "turquoise":  ("Бирюзовый",     "Firuza"),
    "amber":      ("Янтарный",      "Qahrabo"),
    "champagne":  ("Шампань",       "Shampan"),
    "pearl":      ("Жемчужный",     "Marvarid"),
    "rust":       ("Ржавчина",      "Zang"),
    "wenge":      ("Венге",         "Venge"),
    "antique":    ("Антик",         "Antik"),
    "moss":       ("Мох",           "Yo'sin"),
    "mocco":      ("Мокко",         "Mokka"),
    "mocha":      ("Мокко",         "Mokka"),
    "nature":     ("Натуральный",   "Tabiiy"),
    "natural":    ("Натуральный",   "Tabiiy"),
    "mix":        ("Микс",          "Mix"),
    "eucalyptus": ("Эвкалипт",      "Evkalipt"),
    "eucalptus":  ("Эвкалипт",      "Evkalipt"),
    "ucalptus":   ("Эвкалипт",      "Evkalipt"),
    "cactus":     ("Кактус",        "Kaktus"),
    "light":      ("Светлый",       "Och"),
    "dark":       ("Тёмный",        "To'q"),
    "bright":     ("Яркий",         "Yorqin"),
    "soft":       ("Мягкий",        "Yumshoq"),
    "hot":        ("Горячий",       "Issiq"),
}


def split_root_color(name: str) -> Tuple[str, Optional[str]]:
    """Return (root, color_label_original_case).

    Strategy: greedily walk from the right, collecting tokens that are color
    words or color-tokens joined with `+`/`/`. Stop when we see a non-color
    token. Special-case `light pink`, `dark blue` etc.
    """
    n = name.strip()
    if not n:
        return n, None

    tokens = n.split()
    color_start = len(tokens)  # exclusive

    for i in range(len(tokens) - 1, -1, -1):
        tok = tokens[i].lower().strip(",.;:")
        # Each color slot may itself contain `+` or `/` separators
        sub = re.split(r"[+/]", tok)
        if all(s in COLOR_WORDS for s in sub if s):
            color_start = i
            continue
        break

    if color_start == len(tokens):
        return n, None
    if color_start == 0:
        # Whole name is color words; not a real product split.
        return n, None

    root = " ".join(tokens[:color_start]).strip()
    color = " ".join(tokens[color_start:]).strip()
    if not root:
        return n, None
    return root, color


def normalize_root(root: str) -> str:
    """Normalize root for grouping (case-insensitive, collapse whitespace)."""
    return " ".join(root.lower().split())


def color_label_ru_uz(color: str) -> Tuple[str, str]:
    """Return (RU label, UZ label) for a color suffix like 'black+gold'."""
    parts = re.split(r"[+/\s]+", color.lower())
    parts = [p for p in parts if p]
    rus, uzs = [], []
    for p in parts:
        ru, uz = COLOR_RU_UZ.get(p, (p.capitalize(), p.capitalize()))
        rus.append(ru)
        uzs.append(uz)
    return " + ".join(rus), " + ".join(uzs)


def group_products(products: Iterable[Dict]) -> Dict[str, List[Tuple[Optional[str], Dict]]]:
    """Group Bito products by normalized root.

    Returns: {root_normalized: [(color_label_or_None, product_dict), ...]}
    """
    groups: Dict[str, List[Tuple[Optional[str], Dict]]] = defaultdict(list)
    for p in products:
        root, color = split_root_color(p.get("name", "") or "")
        key = normalize_root(root) if root else (p.get("number") or p.get("_id") or "?")
        groups[key].append((color, p))
    return groups
