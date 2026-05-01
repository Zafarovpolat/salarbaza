"""Match Bito product groups to existing Supabase products.

Supabase already has 280 products curated by hand with RU/UZ names, slugs,
descriptions, photos. We must NOT create duplicates of those — instead, the
Bito group must be linked back to the existing Supabase row.

Match keys are derived from `code` on Supabase side and `name` on Bito side,
using the rules established earlier in the project (case-insensitive, leading
zeros, parentheses, slashes, color suffixes, etc.).
"""
from __future__ import annotations

import re
import unicodedata
from typing import Dict, Iterable, List, Optional, Set, Tuple


def _strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))


def normalize_match_key(s: str) -> str:
    """Lowercase, strip accents, collapse whitespace, normalize punctuation."""
    if not s:
        return ""
    s = _strip_accents(s).lower()
    # `(black/gray)` or `(black)` -> ` black gray` / ` black`
    s = re.sub(r"\(([^)]+)\)", lambda m: " " + m.group(1).replace("/", " ").replace(",", " "), s)
    # collapse separators
    s = s.replace(",", " ")
    s = re.sub(r"\s*-\s*", "-", s)  # spaces around `-` are removed (`DS - 044` -> `DS-044`)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _strip_leading_zero(token: str) -> str:
    """`DS-046` -> `DS-46`. Removes leading zeros from each numeric segment."""
    return re.sub(r"(?<![0-9])0+(?=[1-9])", "", token)


def expand_keys(name: str) -> Set[str]:
    """Generate plausible match keys for a Bito name or Supabase code."""
    base = normalize_match_key(name)
    keys = {base, _strip_leading_zero(base)}

    # Replace `+` with `/` and vice versa
    if "+" in base:
        keys.add(base.replace("+", "/"))
        keys.add(base.replace("+", " "))
    if "/" in base:
        keys.add(base.replace("/", "+"))
        keys.add(base.replace("/", " "))
    keys.add(re.sub(r"\s+", "", base))  # squashed
    keys.add(re.sub(r"[\s\-]+", "", base))  # no spaces or dashes
    return {k for k in keys if k}


def expand_root_keys(root_normalized: str) -> Set[str]:
    """Generate match keys for a Bito *root* (no color suffix)."""
    return expand_keys(root_normalized)


def supabase_keys(code: str) -> Set[str]:
    return expand_keys(code or "")


class Matcher:
    def __init__(self, supabase_products: Iterable[Dict]) -> None:
        # Build index: key -> supabase product
        self.index: Dict[str, Dict] = {}
        self.products: List[Dict] = list(supabase_products)
        for sp in self.products:
            for k in supabase_keys(sp.get("code", "")):
                # last-wins is fine; product codes are unique
                self.index[k] = sp

    def find(self, *names: str) -> Optional[Dict]:
        """Try matching any of the candidate names against Supabase products."""
        for n in names:
            for k in expand_keys(n):
                hit = self.index.get(k)
                if hit:
                    return hit
        return None
