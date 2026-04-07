import Link from "next/link";
import { getCurrentUser, resolveRoleHomePath } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardNavGate } from "@/components/dashboard-nav-gate";
import { HeaderGuestNav, HeaderRoleNav } from "@/components/header-primary-nav";
import { HeaderUserCluster } from "@/components/header-user-cluster";
import { SiteLogo } from "@/components/site-logo";

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
  const brandHref = user ? resolveRoleHomePath(user) : "/";

  return (
    <header className="sticky top-0 z-40 bg-transparent">
      <div className="mx-auto max-w-6xl px-4 pt-3 pb-2 md:px-6 md:pt-3.5 md:pb-3">
        <div className="nk-header-inner flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 px-4 py-3 md:px-5 md:py-3.5">
          <Link
            href={brandHref}
            className="nk-header-link nk-header-brand flex w-fit max-w-full shrink-0 items-center gap-2.5 self-start rounded-xl px-2 py-1.5 -mx-2 text-lg font-bold tracking-tight sm:self-auto md:gap-3 md:text-xl"
            aria-label={user ? "الرجوع إلى لوحة العمل" : "الصفحة الرئيسية"}
          >
            <SiteLogo variant="header" />
            <span className="nk-brand-gradient-text hidden min-[380px]:inline">العلم الجديد</span>
          </Link>
          <nav
            aria-label="القائمة الرئيسية"
            dir="rtl"
            className="flex w-full min-w-0 flex-col gap-2 text-sm sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-start sm:gap-3"
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
                  <Link href="/profile" className="nk-btn nk-btn-secondary text-sm !px-3 !py-2">
                    الملف الشخصي
                  </Link>
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
