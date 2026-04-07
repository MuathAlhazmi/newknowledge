import Image from "next/image";

const VARIANTS = {
  header: {
    className: "h-12 w-12 shrink-0 object-contain md:h-14 md:w-14",
    width: 112,
    height: 112,
  },
  hero: {
    className: "h-20 w-20 shrink-0 object-contain md:h-24 md:w-24",
    width: 192,
    height: 192,
  },
  auth: {
    className: "mx-auto h-12 w-auto max-w-[220px] object-contain",
    width: 180,
    height: 180,
  },
} as const;

export function SiteLogo({
  variant = "header",
  className = "",
  priority = false,
}: {
  variant?: keyof typeof VARIANTS;
  className?: string;
  priority?: boolean;
}) {
  const v = VARIANTS[variant];
  return (
    <Image
      src="/brand/newknowledge.svg"
      alt="شعار منصة العلم الجديد"
      width={v.width}
      height={v.height}
      className={[v.className, className].filter(Boolean).join(" ")}
      priority={priority}
    />
  );
}
