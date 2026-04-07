import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";
import { Card } from "@/components/ui";

function IconDoc({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function IconExam({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
      />
    </svg>
  );
}

function IconLive({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

function IconChatGrades({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V4.5c0-1.036-.84-1.875-1.875-1.875h-8.25c-1.036 0-1.875.84-1.875 1.875v11.25c0 1.035.84 1.875 1.875 1.875h.75m0 0H21m-1.5 0H18m-9.75 0a2.25 2.25 0 01-.75-.183m10.5 0a2.25 2.25 0 00-.75-.183M9.75 9.75h.008v.008H9.75V9.75zm0 3h.008v.008H9.75v-.008zm0 3h.008v.008H9.75v-.008z"
      />
    </svg>
  );
}

const FEATURES = [
  {
    icon: IconDoc,
    title: "محتوى داخل المنصة",
    body: "عرض ملفات PDF مباشرة دون مغادرة الواجهة التدريبية.",
  },
  {
    icon: IconExam,
    title: "اختبارات قبلية وبعدية",
    body: "قياس الأداء بمدد زمنية واضحة وتسليم منظم.",
  },
  {
    icon: IconLive,
    title: "جلسات مباشرة",
    body: "روابط وتنظيم للجلسات الحضورية عن بُعد.",
  },
  {
    icon: IconChatGrades,
    title: "تواصل ودرجات",
    body: "محادثات رسمية داخل الدورة ومتابعة للدرجات والملاحظات.",
  },
] as const;

const STEPS = [
  { n: 1, title: "سجّل حسابك", body: "أنشئ حساباً عبر نموذج التسجيل ببياناتك الأساسية." },
  { n: 2, title: "اعتماد الحساب", body: "بعد موافقة الإدارة يصبح بإمكانك الوصول إلى دوراتك." },
  { n: 3, title: "ابدأ التعلم", body: "تصفح المحتوى، الاختبارات، الجلسات، والمحادثات من مكان واحد." },
] as const;

export function LandingHome() {
  const year = new Date().getFullYear();

  return (
    <div className="page-wrap">
      <div className="flex w-full flex-col gap-16 md:gap-20">
      <section className="nk-landing-hero border border-[var(--border-muted-edge)] bg-[var(--surface)]/80 shadow-[var(--shadow-sm)] backdrop-blur-sm">
        <div className="nk-landing-hero-glow" aria-hidden />
        <div className="relative flex flex-col items-center gap-6 text-center md:gap-8">
          <SiteLogo variant="hero" priority />
          <h1 className="page-title nk-brand-gradient-text nk-slide-in max-w-[min(100%,36rem)] text-balance md:max-w-3xl">
            منصة العلم الجديد
          </h1>
          <p className="page-subtitle nk-slide-in nk-stagger-1 max-w-2xl text-balance">
            بيئة تدريب متكاملة لإدارة المحتوى، الاختبارات، والتواصل الرسمي.
          </p>
          <div className="nk-slide-in nk-stagger-1 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className="nk-btn nk-btn-primary !px-6 !py-2.5">
              تسجيل الدخول
            </Link>
            <Link href="/signup" className="nk-btn nk-btn-secondary !px-6 !py-2.5">
              إنشاء حساب
            </Link>
          </div>
          <p className="nk-slide-in nk-stagger-1 max-w-md text-sm text-[var(--text-muted)]">
            لا تحتاج إلى تثبيت برامج . كل شيء يعمل من المتصفح.
          </p>
        </div>
      </section>

      <section className="nk-section !my-0 !mb-0 flex flex-col gap-4">
        <h2 className="nk-section-title text-lg md:text-xl">ما الذي تقدمه المنصة؟</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            const muted = i % 2 === 1;
            return (
              <Card
                key={f.title}
                interactive={false}
                elevated={!muted}
                variant={muted ? "muted" : "default"}
                className="flex flex-col gap-3 p-5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary-strong)]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-[var(--foreground)]">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">{f.body}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="nk-section !my-0 flex flex-col gap-6">
        <h2 className="nk-section-title text-lg md:text-xl">كيف تعمل المنصة؟</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n}>
              <Card interactive={false} className="flex h-full flex-col gap-2 p-5 md:flex-row md:items-start md:gap-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-bold text-[var(--primary-strong)]"
                  aria-hidden
                >
                  {step.n}
                </span>
                <div className="min-w-0 text-start">
                  <h3 className="text-base font-bold text-[var(--foreground)]">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{step.body}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="nk-landing-cta-band px-6 py-10 md:px-10 md:py-12">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <h2 className="text-xl font-bold text-[var(--foreground)] md:text-2xl">
            جاهز للانضمام إلى تجربة تدريب منظمة؟
          </h2>
          <p className="text-[var(--text-muted)]">
            سجّل الدخول إن كان لديك حساب، أو أنشئ حساباً جديداً لبدء رحلتك.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className="nk-btn nk-btn-primary !px-6 !py-2.5">
              تسجيل الدخول
            </Link>
            <Link href="/signup" className="nk-btn nk-btn-secondary !px-6 !py-2.5">
              إنشاء حساب
            </Link>
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-[var(--text-muted)]">
        منصة العلم الجديد — {year} — جميع الحقوق محفوظة
      </p>
      </div>
    </div>
  );
}
