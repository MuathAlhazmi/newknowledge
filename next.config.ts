import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Force Turbopack root to this app when another lockfile exists higher in the tree (e.g. ~/package-lock.json). */
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

/** Comma-separated hostnames for Next dev (e.g. phone on LAN hitting http://192.168.x.x:3000). See next.config allowedDevOrigins. */
const allowedDevOrigins =
  process.env.NODE_ENV === "development" && process.env.NEXT_ALLOWED_DEV_ORIGINS?.trim()
    ? process.env.NEXT_ALLOWED_DEV_ORIGINS.split(",")
        .map((h) => h.trim())
        .filter(Boolean)
    : undefined;

const nextConfig: NextConfig = {
  turbopack: {
    root: turbopackRoot,
  },
  ...(allowedDevOrigins?.length ? { allowedDevOrigins } : {}),
  async redirects() {
    return [
      { source: "/courses/:courseId/zoom", destination: "/courses/:courseId/teams", permanent: false },
      { source: "/admin/courses/:courseId/zoom", destination: "/admin/courses/:courseId/teams", permanent: false },
    ];
  },
};

export default nextConfig;
