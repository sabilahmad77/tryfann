/**
 * DATA-01 client contract check (no test framework required).
 *
 * Proves the client half of the "one source of truth" fix: every endpoint the
 * dashboard reads on mount points at the /qualification/* namespace, and the
 * retired /market_final/dashboard_stats* handlers are referenced nowhere as an
 * active query URL. CRUD mutations (create/update/delete/{id}) legitimately
 * stay on /market_final/* — those are user actions, not mount reads — so this
 * check asserts on the specific mount-read endpoints by name.
 *
 * Run:  node scripts/contract-data01.mjs   (exit 0 = pass, 1 = fail)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const api = (f) => readFileSync(join(here, "..", "src", "services", "api", f), "utf8");

const dashboard = api("dashboardApi.ts");
const artwork = api("artworkApi.ts");

/** Extract the first `url:` string literal inside a named endpoint's block. */
function urlFor(source, endpointName) {
  const start = source.indexOf(`${endpointName}:`);
  if (start === -1) throw new Error(`endpoint ${endpointName} not found`);
  // The block runs until the next endpoint declaration or end of file.
  const rest = source.slice(start);
  const m = rest.match(/url:\s*[`"']([^`"'\n]*)[`"']/) ||
    rest.match(/url:\s*`([^`]*)`/);
  if (!m) throw new Error(`no url literal in ${endpointName}`);
  return m[1];
}

// The endpoints the dashboard fires on mount, per role.
const MOUNT_READS = {
  "dashboardApi.getDashboardStats": urlFor(dashboard, "getDashboardStats"),
  "dashboardApi.getDashboardStatsGallery": urlFor(dashboard, "getDashboardStatsGallery"),
  "dashboardApi.getDashboardStatsAmbassador": urlFor(dashboard, "getDashboardStatsAmbassador"),
  "dashboardApi.getArtistRoaster": urlFor(dashboard, "getArtistRoaster"),
  "dashboardApi.getArtworkCollection": urlFor(dashboard, "getArtworkCollection"),
  "artworkApi.getMyArtworks": urlFor(artwork, "getMyArtworks"),
};

const failures = [];
for (const [name, url] of Object.entries(MOUNT_READS)) {
  if (!url.startsWith("/qualification/")) {
    failures.push(`${name} reads "${url}" — expected a /qualification/* URL`);
  }
  if (url.includes("/market_final/")) {
    failures.push(`${name} still points at /market_final/* ("${url}")`);
  }
}

// The retired stat handlers must not appear as an active query URL anywhere.
for (const retired of [
  "/market_final/dashboard_stats_gallery",
  "/market_final/dashboard_stats_ambassador",
  "/market_final/dashboard_stats",
]) {
  if (dashboard.includes(`url: \`${retired}`) || dashboard.includes(`url: "${retired}`)) {
    failures.push(`retired endpoint ${retired} is still used as a query url`);
  }
}

console.log("DATA-01 client mount-read contract:");
for (const [name, url] of Object.entries(MOUNT_READS)) {
  console.log(`  ${failures.some((f) => f.startsWith(name)) ? "FAIL" : "ok  "} ${name} -> ${url}`);
}

if (failures.length) {
  console.error("\nCONTRACT FAILED:");
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log("\nAll dashboard mount reads use /qualification/* — zero /market_final/* (DATA-01).");
process.exit(0);
