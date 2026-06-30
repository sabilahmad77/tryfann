// Concierge roles never see points / missions / leaderboard (mandate §2).
// Mirrors the backend's CONCIERGE_ROLES (fann/qualification/services.py).
export const CONCIERGE_ROLES = ["gallery", "investor", "organization"];

export function isConciergeRole(role?: string | null): boolean {
  return !!role && CONCIERGE_ROLES.includes(role.toLowerCase());
}
