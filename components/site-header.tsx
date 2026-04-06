import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardNavGate } from "@/components/dashboard-nav-gate";
import { HeaderGuestNav, HeaderRoleNav } from "@/components/header-primary-nav";
import { HeaderUserCluster } from "@/components/header-user-cluster";

async function logoutAction() {
  "use server";
  const hasKey =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) ||
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && hasKey) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
}

export async function SiteHeader({
  userPromise,
}: {
  userPromise: ReturnType<typeof getCurrentUser>;
}) {
  const user = await userPromise;

  return (
    <header className="sticky top-0 z-40 bg-transparent">
      <div className="mx-auto max-w-6xl px-4 pt-3 pb-2 md:px-6 md:pt-3.5 md:pb-3">
        <div className="nk-header-inner flex items-center justify-between gap-3 px-4 py-3 md:px-5 md:py-3.5">
          <Link
            href="/"
            className="nk-header-link shrink-0 rounded-xl px-2 py-1 -mx-2 text-xl font-bold tracking-tight transition-colors duration-200 hover:bg-[var(--surface-muted)]/60"
            style={{
              backgroundImage: `linear-gradient(135deg, var(--primary-strong), var(--primary))`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            العلم الجديد
          </Link>
          <nav
            aria-label="القائمة الرئيسية"
            className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3 text-sm"
          >
            {user ? (
              <>
                <DashboardNavGate>
                  <HeaderRoleNav role={user.role} platformApproved={user.platformApproved} />
                </DashboardNavGate>
                <HeaderUserCluster>
                  <span className="nk-badge nk-badge-muted max-w-[10rem] truncate" title={user.name}>
                    {user.name}
                  </span>
                  <form action={logoutAction}>
                    <button className="nk-btn nk-btn-secondary text-sm !px-3 !py-2" type="submit">
                      تسجيل الخروج
                    </button>
                  </form>
                </HeaderUserCluster>
              </>
            ) : (
              <HeaderGuestNav />
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
