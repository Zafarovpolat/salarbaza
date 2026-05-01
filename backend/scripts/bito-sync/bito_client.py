"""Thin wrapper around Bito Integration REST API v2."""
from __future__ import annotations

import os
import time
from typing import Any, Dict, Iterable, List, Optional

import requests


class BitoClient:
    """Bito Integration API client.

    Auth is via header `api-key: <login>:<token>`.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: int = 60,
    ) -> None:
        self.base_url = (base_url or os.environ.get("BITO_BASE_URL", "")).rstrip("/")
        self.api_key = api_key or os.environ.get("BITO_API_KEY", "")
        if not self.base_url or not self.api_key:
            raise RuntimeError(
                "BITO_BASE_URL and BITO_API_KEY must be set (env or constructor args)"
            )
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update(
            {
                "api-key": self.api_key,
                "Accept": "application/json",
                "Content-Type": "application/json",
            }
        )

    def _request(
        self,
        method: str,
        path: str,
        *,
        json_body: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        retries: int = 3,
    ) -> Any:
        url = f"{self.base_url}/{path.lstrip('/')}"
        last_exc: Optional[Exception] = None
        for attempt in range(retries):
            try:
                resp = self.session.request(
                    method,
                    url,
                    json=json_body,
                    params=params,
                    timeout=self.timeout,
                )
                if resp.status_code == 429:
                    time.sleep(1.5 * (attempt + 1))
                    continue
                resp.raise_for_status()
                if not resp.content:
                    return None
                return resp.json()
            except requests.RequestException as e:
                last_exc = e
                time.sleep(1.0 * (attempt + 1))
        raise RuntimeError(
            f"Bito API request failed after {retries} attempts: "
            f"{method} {url}: {last_exc}"
        )

    @staticmethod
    def _unwrap(payload: Any) -> Any:
        """Bito wraps everything in `{code:0, message, data: ...}`. Unwrap to data."""
        if isinstance(payload, dict) and "data" in payload and "code" in payload:
            return payload["data"]
        return payload

    # ------------- generic paging -------------
    def get_paging(
        self,
        path: str,
        body: Optional[Dict[str, Any]] = None,
        *,
        page_size: int = 200,
    ) -> Iterable[Dict[str, Any]]:
        body = dict(body or {})
        page = 1
        seen = 0
        while True:
            payload = dict(body)
            payload.setdefault("page", page)
            payload.setdefault("limit", page_size)
            raw = self._request("POST", path, json_body=payload)
            data = self._unwrap(raw)
            items: List[Dict[str, Any]] = []
            total = 0
            if isinstance(data, dict):
                items = data.get("data") or data.get("items") or []
                total = data.get("total") or data.get("count") or 0
            elif isinstance(data, list):
                items = data
                total = len(items)
            for it in items:
                yield it
            seen += len(items)
            if not items or seen >= total:
                return
            page += 1

    # ------------- domain wrappers -------------
    def warehouses(self) -> List[Dict[str, Any]]:
        raw = self._request("POST", "/warehouse/get-all", json_body={})
        data = self._unwrap(raw)
        if isinstance(data, dict):
            return data.get("data") or []
        return data or []

    def categories(self) -> List[Dict[str, Any]]:
        return list(self.get_paging("/category/get-paging"))

    def products(self) -> List[Dict[str, Any]]:
        return list(self.get_paging("/product/get-paging"))

    def prices_meta(self) -> List[Dict[str, Any]]:
        raw = self._request("POST", "/price/get-all", json_body={})
        data = self._unwrap(raw)
        if isinstance(data, dict):
            return data.get("data") or []
        return data or []

    def price_items(self, price_id: str) -> List[Dict[str, Any]]:
        return list(
            self.get_paging("/price/items/get-paging", body={"price_id": price_id})
        )

    def customers(self) -> List[Dict[str, Any]]:
        return list(self.get_paging("/customer/get-paging"))

    def employees(self) -> List[Dict[str, Any]]:
        return list(self.get_paging("/employee/get-paging"))
