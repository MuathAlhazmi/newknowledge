import { execSync } from "node:child_process";

const opts = { stdio: "inherit", env: process.env };

if (process.env.VERCEL === "1") {
  console.log(
    "[build] VERCEL=1: skipping prisma migrate deploy (Supabase direct DB is often unreachable from Vercel builders).",
  );
  console.log(
    "[build] Apply migrations via .github/workflows/prisma-migrate.yml on push to main, or run `npx prisma migrate deploy` locally.",
  );
  execSync("npx next build", opts);
} else {
  execSync("npx prisma migrate deploy", opts);
  execSync("npx next build", opts);
}
