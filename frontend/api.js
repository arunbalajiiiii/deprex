// ─── DEPREX API CLIENT SEAM ───────────────────────────────────────────────────
// Centralized HTTP transport, token persistence, and backend endpoint helpers.

export const API_BASE = "http://localhost:8000";

export function getToken() {
  return localStorage.getItem("dx_token") || "";
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("dx_token", token);
  } else {
    localStorage.removeItem("dx_token");
  }
}

export function clearToken() {
  localStorage.removeItem("dx_token");
}

export async function apiFetch(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
    body: opts.body
      ? typeof opts.body === "string"
        ? opts.body
        : JSON.stringify(opts.body)
      : undefined,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || res.statusText);
  }
  return res.json();
}

export async function getPersonalisedResources(interest, userDescription, existingResources) {
  if (!userDescription || !userDescription.trim()) return existingResources;
  try {
    const data = await apiFetch("/ai/personalise", {
      method: "POST",
      body: { interest, description: userDescription, resources: existingResources },
    });
    const order = data.order || [];
    return order.map((i) => existingResources[i]).filter(Boolean);
  } catch {
    return existingResources;
  }
}

export async function getChatHistory() {
  return apiFetch("/ai/chat/history");
}

export async function sendChatMessage(content) {
  return apiFetch("/ai/chat", {
    method: "POST",
    body: { content },
  });
}

export async function getWellbeingSummary() {
  return apiFetch("/assessment/summary");
}
