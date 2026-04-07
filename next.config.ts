import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Force Turbopack root to this app when another lockfile exists higher in the tree (e.g. ~/package-lock.json). */
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: turbopackRoot,
  },
};

export default nextConfig;
