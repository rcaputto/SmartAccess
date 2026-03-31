export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("auth") === "true";
}

export function login() {
  localStorage.setItem("auth", "true");
}

export function logout() {
  localStorage.removeItem("auth");
}

// Deprecated: Sprint 6 migrated to NextAuth sessions.