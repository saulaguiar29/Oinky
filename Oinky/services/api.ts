import { API_BASE_URL } from "../constants";

// Helper to make authenticated requests
// token will come from Firebase Auth (Week 6)
async function request(
  path: string,
  options: RequestInit = {},
  token?: string,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

// ── Goals ─────────────────────────────────────────────
export const goalsAPI = {
  getAll: (token: string, status?: string) =>
    request(`/goals${status ? `?status=${status}` : ""}`, {}, token),

  getOne: (token: string, id: string) => request(`/goals/${id}`, {}, token),

  create: (token: string, body: object) =>
    request("/goals", { method: "POST", body: JSON.stringify(body) }, token),

  update: (token: string, id: string, body: object) =>
    request(
      `/goals/${id}`,
      { method: "PATCH", body: JSON.stringify(body) },
      token,
    ),

  delete: (token: string, id: string) =>
    request(`/goals/${id}`, { method: "DELETE" }, token),

  calcSavingsPlan: (token: string, body: object) =>
    request(
      "/goals/summary/savings-plan",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),
};

// ── Transactions ───────────────────────────────────────
export const transactionsAPI = {
  getAll: (token: string, goalId?: string) =>
    request(`/transactions${goalId ? `?goalId=${goalId}` : ""}`, {}, token),

  deposit: (token: string, body: object) =>
    request(
      "/transactions/deposit",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),

  withdraw: (token: string, body: object) =>
    request(
      "/transactions/withdraw",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),

  transfer: (token: string, body: object) =>
    request(
      "/transactions/transfer",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),
};

// ── Plaid ──────────────────────────────────────────────
export const plaidAPI = {
  createLinkToken: (token: string) =>
    request("/plaid/create-link-token", { method: "POST" }, token),

  exchangeToken: (token: string, public_token: string) =>
    request(
      "/plaid/exchange-token",
      { method: "POST", body: JSON.stringify({ public_token }) },
      token,
    ),

  getBalance: (token: string) => request("/plaid/balance", {}, token),

  unlink: (token: string) =>
    request("/plaid/unlink", { method: "DELETE" }, token),
};

// ── Auth ───────────────────────────────────────────────
export const authAPI = {
  sync: (token: string) => request("/auth/sync", { method: "POST" }, token),

  me: (token: string) => request("/auth/me", {}, token),
};
