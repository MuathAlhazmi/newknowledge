منصة تدريب MVP مبنية على [Next.js](https://nextjs.org) (واجهة عربية RTL) تشمل:

- **ثلاثة أدوار:** إدارة المنصة (Admin)، مدرب (Instructor)، متدرب (Learner — `PARTICIPANT` في قاعدة البيانات)
- اعتماد حساب المتدرب الذاتي على المنصة
- اعتماد التسجيل في الدورات (من لوحة المدرب؛ وعرض عالمي خفيف لدعم المنصة في `/admin`)
- عرض PDF داخل المنصة
- اختبارات قبلي/بعدي بوقت محدد
- موافقة قبل فتح الاختبار البعدي
- جلسات Zoom مجدولة
- محادثة رسمية للدورة (متدرب ↔ فريق المنصة: إداري أو مدرب)
- تغذية راجعة نصية
- درجة عامة (وزن قبلي/بعدي + حد نجاح)

## أين يذهب كل دور بعد تسجيل الدخول؟

| الدور | الوجهة الافتراضية |
|--------|-------------------|
| إدارة المنصة | `/admin` — مركز المستخدمين، اعتماد الحسابات، طلبات التسجيل المعلّقة، إضافة متدرب لدورة (دعم فني) |
| مدرب | `/admin/courses` — قائمة الدورات ثم إدارة كل دورة (مواد، اختبارات، تسجيلات، محادثات، …) |
| متدرب | `/courses` أو دورة واحدة مباشرة إن وُجد تسجيل واحد فقط |

المدرب **لا** يصل إلى `/admin`. إدارة المنصة **لا** تصل إلى `/admin/courses` (تُوجَّه إلى `/admin`).

## تشغيل المشروع

```bash
npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

ثم افتح [http://localhost:3000](http://localhost:3000)

## قاعدة البيانات

المشروع يستخدم **PostgreSQL** مع Prisma (راجع `prisma/schema.prisma` ومجلد `prisma/migrations/`). عرّف `DATABASE_URL` في `.env`.

بعد تغيير الأدوار، طبّق الهجرات بما فيها إضافة قيمة `INSTRUCTOR` إلى نوع `UserRole` (مثال: `20260406120000_add_instructor_role`).

## أول حساب إدارة ومدرب (Supabase + Prisma)

يتطلب إنشاء المستخدمين من السطر أوامر: `DATABASE_URL`، `NEXT_PUBLIC_SUPABASE_URL`، `SUPABASE_SERVICE_ROLE_KEY`.

```bash
# أول إداري
npm run create-admin -- --email=you@example.com --password='YourPass123' --name='المدير' --phone='+966500000001'

# أول مدرب (اختصار لنفس السكربت بدور INSTRUCTOR)
npm run create-instructor -- --email=instructor@example.com --password='YourPass123' --name='المدرب' --phone='+966500000099'
```

يمكن لإدارة المنصة أيضًا إنشاء حسابات إداري/مدرب/متدرب من واجهة `/admin` بعد تسجيل الدخول.

## حسابات تجريبية (بعد `prisma:seed` — صفوف Prisma فقط)

> تسجيل الدخول الفعلي عبر Supabase يتطلب إنشاء نفس المستخدمين في Auth (مثلاً بأوامر `create-admin` / `create-instructor` أعلاه) أو من لوحة Supabase.

- إدارة: `admin@newknowledge.local`
- مدرب: `instructor@newknowledge.local`
- متدربون: `participant1@newknowledge.local` … `participant5@newknowledge.local`

## أوامر مهمة

- `npm run lint`
- `npm run build`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:seed`
- `npm run create-admin` / `npm run create-instructor`

## روابط قديمة

`/admin/approvals` و`/admin/users` يعيدان التوجيه إلى `/admin`.
