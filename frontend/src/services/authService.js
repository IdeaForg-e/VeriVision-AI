import { STORAGE_KEYS } from "../utils/constants.js";
// import { api } from "./api.js"; // TODO(backend): uncomment once /auth endpoints exist

/**
 * Auth service. Mocked for now — swap each function body for a real call
 * through `api.js` once the backend auth flow (JWT vs session, refresh
 * token lifetime, etc.) is confirmed.
 *
 * TODO(backend):
 *   POST /auth/login       { email, password } -> { user, token, refreshToken }
 *   POST /auth/logout
 *   POST /auth/refresh     { refreshToken } -> { token }
 *   GET  /auth/me          -> { user }
 */

const MOCK_LATENCY = 600;

const MOCK_USER = {
  id: "u_chaitanya",
  name: "Chaitanya",
  email: "chaitanya@fraudshield.dev",
  role: "reviewer",
};

export function login(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email || !password) {
        reject(new Error("Email and password are required"));
        return;
      }
      const token = "mock-jwt-token";
      const refreshToken = "mock-refresh-token";
      try {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(MOCK_USER));
      } catch {
        // localStorage unavailable (e.g. private browsing) — caller can decide how to handle
      }
      resolve({ user: MOCK_USER, token, refreshToken });
    }, MOCK_LATENCY);
  });
}

export function logout() {
  return new Promise((resolve) => {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch {
      /* no-op */
    }
    setTimeout(resolve, MOCK_LATENCY / 2);
  });
}

export function getCurrentUser() {
  return new Promise((resolve) => {
    let stored = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      stored = raw ? JSON.parse(raw) : null;
    } catch {
      stored = null;
    }
    setTimeout(() => resolve(stored), 200);
  });
}

export function isAuthenticated() {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN));
  } catch {
    return false;
  }
}
