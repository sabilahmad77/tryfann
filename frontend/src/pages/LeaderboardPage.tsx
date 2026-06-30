/**
 * Public leaderboard — REMOVED per the Pre-Launch Mandate.
 *
 * The product does not use a points-race or a public ranking of users by score.
 * Access is quality-gated by the qualification engine (readiness, not rank), and
 * the decided alternative — the user's own Readiness model — lives on the
 * dashboard. This route is kept only to redirect any old links to the dashboard.
 */
import { Navigate } from "react-router-dom";
import { ROUTES } from "@/routes/paths";

export function LeaderboardPage() {
  return <Navigate to={ROUTES.DASHBOARD} replace />;
}
