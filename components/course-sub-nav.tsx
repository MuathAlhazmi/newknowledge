import { HeaderNavLink } from "@/components/header-nav-link";
import {
  instructorCourseNavItems,
  participantCourseNavItems,
} from "@/lib/course-nav";

export function CourseSubNav({
  variant,
  courseId,
}: {
  variant: "participant" | "instructor";
  courseId: string;
}) {
  const items =
    variant === "participant" ? participantCourseNavItems(courseId) : instructorCourseNavItems(courseId);

  return (
    <nav aria-label="تنقل الدورة" className="nk-course-subnav w-full" dir="rtl">
      <ul>
        {items.map((item) => (
          <li key={item.href} className="shrink-0">
            <HeaderNavLink
              href={item.href}
              prefixMatch={item.prefixMatch}
              className="!px-3 !py-2 text-xs sm:!py-1.5 sm:text-sm whitespace-nowrap max-md:min-h-[2.75rem] max-md:items-center max-md:inline-flex"
            >
              {item.label}
            </HeaderNavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
