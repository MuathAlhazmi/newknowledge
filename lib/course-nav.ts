/** Section links for course workspace — keep in sync with course hub tiles. */

export type CourseNavItem = {
  href: string;
  label: string;
  /** Hub uses exact match; section roots use prefix for nested routes (e.g. material PDF). */
  prefixMatch: boolean;
};

export function participantCourseNavItems(courseId: string): CourseNavItem[] {
  const base = `/courses/${courseId}`;
  return [
    { href: "/courses", label: "دوراتي", prefixMatch: false },
    { href: base, label: "مركز الدورة", prefixMatch: false },
    { href: `${base}/materials`, label: "المحتوى", prefixMatch: true },
    { href: `${base}/exams`, label: "الاختبارات", prefixMatch: true },
    { href: `${base}/grades`, label: "الدرجات", prefixMatch: true },
    { href: `${base}/zoom`, label: "جلسات Zoom", prefixMatch: true },
    { href: `${base}/announcements`, label: "الإعلانات", prefixMatch: true },
    { href: `${base}/chat`, label: "المحادثة", prefixMatch: true },
    { href: `${base}/feedback`, label: "التغذية الراجعة", prefixMatch: true },
  ];
}

export function instructorCourseNavItems(courseId: string): CourseNavItem[] {
  const base = `/admin/courses/${courseId}`;
  return [
    { href: "/admin/courses", label: "لوحة الدورات", prefixMatch: false },
    { href: base, label: "مركز الدورة", prefixMatch: false },
    { href: `${base}/materials`, label: "المحتوى", prefixMatch: true },
    { href: `${base}/exams`, label: "الاختبارات", prefixMatch: true },
    { href: `${base}/grades`, label: "الدرجات", prefixMatch: true },
    { href: `${base}/enrollments`, label: "التسجيلات", prefixMatch: true },
    { href: `${base}/zoom`, label: "جلسات Zoom", prefixMatch: true },
    { href: `${base}/announcements`, label: "الإعلانات", prefixMatch: true },
    { href: `${base}/chat`, label: "المحادثات", prefixMatch: true },
    { href: `${base}/feedback`, label: "التغذية الراجعة", prefixMatch: true },
  ];
}
