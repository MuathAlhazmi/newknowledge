import Link from "next/link";
import { AnnouncementKind } from "@prisma/client";
import { CourseAnnouncementItem } from "@/lib/course-announcements";
import { Card, EmptyState, StatusBadge } from "@/components/ui";

function kindBadge(kind: AnnouncementKind): { text: string; tone: "info" | "muted" | "warning" } {
  switch (kind) {
    case AnnouncementKind.CONTENT:
      return { text: "محتوى", tone: "info" };
    case AnnouncementKind.QUIZ:
      return { text: "اختبار", tone: "warning" };
    case AnnouncementKind.TEAMS:
      return { text: "Teams", tone: "info" };
    default:
      return { text: "إعلان", tone: "muted" };
  }
}

export function CourseAnnouncementsList({
  items,
  emptyText,
}: {
  items: CourseAnnouncementItem[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <ul className="nk-stagger-list grid gap-3">
      {items.map((item) => {
        const badge = kindBadge(item.kind);
        return (
          <li key={item.id}>
            <Card elevated interactive={false} className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusBadge text={badge.text} tone={badge.tone} />
                <span className="text-xs text-[var(--text-muted)]">{item.publishedAt.toLocaleString("ar-SA")}</span>
              </div>
              <p className="font-semibold text-[var(--foreground)]">{item.title}</p>
              {item.body ? <p className="text-sm text-[var(--text-muted)]">{item.body}</p> : null}
              <div>
                <Link href={item.href} className="nk-btn nk-btn-secondary text-xs">
                  عرض التفاصيل
                </Link>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
