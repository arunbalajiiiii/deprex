from typing import Optional, Any
import requests
import streamlit as st

API_BASE = "http://localhost:8000"


class DeprexAPIClient:
    """
    Deep API Client module encapsulating HTTP transport, bearer token injection,
    and structured error recovery for the Streamlit frontend.
    """

    def __init__(self, base_url: str = API_BASE):
        self.base_url = base_url.rstrip("/")

    @property
    def token(self) -> str:
        return st.session_state.get("dx_token", "")

    def set_token(self, token: str) -> None:
        st.session_state["dx_token"] = token

    def clear_token(self) -> None:
        if "dx_token" in st.session_state:
            del st.session_state["dx_token"]
        if "current_user" in st.session_state:
            del st.session_state["current_user"]

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _request(self, method: str, endpoint: str, json: Optional[dict] = None) -> dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        try:
            resp = requests.request(
                method=method,
                url=url,
                headers=self._headers(),
                json=json,
                timeout=15,
            )
            if resp.status_code == 401:
                self.clear_token()
                raise ValueError("Session expired or invalid credentials. Please sign in again.")

            if not resp.ok:
                try:
                    data = resp.json()
                    detail = data.get("detail", resp.text)
                except Exception:
                    detail = resp.text or f"HTTP {resp.status_code}"
                raise ValueError(detail)

            return resp.json()
        except requests.RequestException as e:
            raise ConnectionError(f"Backend connection error: {str(e)}") from e

    # ── Auth Operations ────────────────────────────────────────────────────────
    def login(self, email: str, password: str) -> dict[str, Any]:
        data = self._request("POST", "/auth/login", json={"email": email, "password": password})
        self.set_token(data["access_token"])
        user = self.get_me()
        st.session_state["current_user"] = user
        return user

    def register(self, name: str, email: str, password: str) -> dict[str, Any]:
        data = self._request("POST", "/auth/register", json={"name": name, "email": email, "password": password})
        self.set_token(data["access_token"])
        user = self.get_me()
        st.session_state["current_user"] = user
        return user

    def get_me(self) -> dict[str, Any]:
        return self._request("GET", "/auth/me")

    # ── Companion Chat Operations ──────────────────────────────────────────────
    def send_chat(self, content: str) -> dict[str, Any]:
        return self._request("POST", "/ai/chat", json={"content": content})

    def get_chat_history(self) -> list[dict[str, Any]]:
        try:
            res = self._request("GET", "/ai/chat/history")
            return res.get("messages", [])
        except Exception:
            return []

    # ── Assessment & Wellbeing Operations ─────────────────────────────────────
    def submit_assessment(self, answers: list[int]) -> dict[str, Any]:
        return self._request("POST", "/assessment/", json={"answers": answers})

    def get_latest_assessment(self) -> Optional[dict[str, Any]]:
        try:
            return self._request("GET", "/assessment/latest")
        except Exception:
            return None

    def get_wellbeing_summary(self) -> dict[str, Any]:
        try:
            return self._request("GET", "/assessment/summary")
        except Exception:
            return {}

    # ── Journal Operations ────────────────────────────────────────────────────
    def save_journal(self, content: str) -> dict[str, Any]:
        return self._request("POST", "/journal/", json={"content": content})

    def get_journals(self) -> list[dict[str, Any]]:
        try:
            return self._request("GET", "/journal/")
        except Exception:
            return []

    # ── User & Events Operations ──────────────────────────────────────────────
    def update_interests(self, interests: list[str], sub_interests: dict) -> dict[str, Any]:
        return self._request(
            "PUT",
            "/user/interests",
            json={"interests": interests, "sub_interests": sub_interests, "onboarded": True},
        )

    def log_relief_event(self, interest_key: str, resource_title: str) -> None:
        try:
            self._request(
                "POST",
                "/relief-events",
                json={"interest_key": interest_key, "resource_title": resource_title},
            )
        except Exception:
            pass


api = DeprexAPIClient()
