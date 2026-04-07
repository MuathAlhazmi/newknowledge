import { PrismaClient, EnrollmentStatus, ExamType, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

/** أربع خيارات لكل سؤال؛ خيار واحد صحيح وثلاثة مشتتات معقولة (للبيانات التجريبية). */
function q(text, order, correct, d1, d2, d3) {
  return {
    text,
    order,
    choices: {
      create: [
        { text: correct, isCorrect: true },
        { text: d1, isCorrect: false },
        { text: d2, isCorrect: false },
        { text: d3, isCorrect: false },
      ],
    },
  };
}

async function main() {
  await prisma.chatMessage.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.postExamApproval.deleteMany();
  await prisma.examAttempt.deleteMany();
  await prisma.choice.deleteMany();
  await prisma.question.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.material.deleteMany();
  await prisma.zoomSession.deleteMany();
  await prisma.courseGrade.deleteMany();
  await prisma.gradingConfig.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "مدير المنصة",
      email: "admin@newknowledge.local",
      phone: "+966500000001",
      role: UserRole.ADMIN,
      platformApproved: true,
    },
  });

  const instructor = await prisma.user.create({
    data: {
      name: "مدرب تجريبي",
      email: "instructor@newknowledge.local",
      phone: "+966500000099",
      role: UserRole.INSTRUCTOR,
      platformApproved: true,
    },
  });

  const participants = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.user.create({
        data: {
          name: `متدرب ${i + 1}`,
          email: `participant${i + 1}@newknowledge.local`,
          phone: `+9665000000${String(i + 2).padStart(2, "0")}`,
          role: UserRole.PARTICIPANT,
          platformApproved: true,
        },
      }),
    ),
  );

  const course = await prisma.course.create({
    data: {
      title: "أساسيات التعلم عبر المنصات (تجريبي)",
      description:
        "بيئة تدريب متكاملة لإدارة المحتوى، الاختبارات، والتواصل الرسمي — دورة تجريبية للعرض داخل المنصة؛ المحتوى توضيحي وليس برنامجًا تدريبيًا معتمدًا.",
    },
  });

  await prisma.gradingConfig.create({
    data: {
      courseId: course.id,
      preWeight: 30,
      postWeight: 70,
      passThreshold: 60,
    },
  });

  await prisma.zoomSession.createMany({
    data: [
      {
        courseId: course.id,
        title: "جلسة تعريفية بالمنصة (رابط تجريبي)",
        meetingUrl: "https://zoom.us/j/demo-newknowledge",
        startsAt: new Date(Date.now() + 86400000),
      },
      {
        courseId: course.id,
        title: "جلسة أسئلة وإجابات (رابط تجريبي)",
        meetingUrl: "https://zoom.us/j/demo-newknowledge-2",
        startsAt: new Date(Date.now() + 172800000),
      },
    ],
  });

  const preQuestions = [
    q(
      "ما المقصود بالتعلم الإلكتروني في أغلب التعاريف التربوية؟",
      1,
      "استخدام الشبكات والوسائط الرقمية لدعم عملية التعلم والتعليم",
      "الاكتفاء بمشاهدة فيديوهات ترفيهية دون أهداف تعليمية",
      "استبدال المعلم بالكامل ببرامج آلية دون تدخل بشري",
      "الدراسة الحضورية فقط داخل القاعة الدراسية",
    ),
    q(
      "أي مما يلي يُعد من مزايا التدريب عبر منصة موحدة للمتدرب والمدرب؟",
      2,
      "تتبع التقدم وتنظيم المواد والاختبارات في مكان واحد",
      "إلغاء الحاجة إلى أي تخطيط مسبق للدورة",
      "ضمان النجاح لجميع المتدربين دون معايير تقييم",
      "استغناء المنظمة عن أي تواصل رسمي مع المتدربين",
    ),
    q(
      "ماذا تعني «التغذية الراجعة» في سياق التعلم؟",
      3,
      "معلومات تساعد المتعلم على معرفة أدائه وتحسينه",
      "إعادة تقديم نفس الدرس دون تغيير",
      "تقييم نهائي لا يُشرح للمتعلم",
      "اقتصار الرد على علامة رقمية فقط دون توضيح",
    ),
    q(
      "أي سلوك يدعم الاستفادة من دورة إلكترونية بشكل أفضل؟",
      4,
      "الالتزام بخطة زمنية ومراجعة المطلوب قبل الاختبارات",
      "تأجيل جميع المهام حتى اليوم الأخير دون استثناء",
      "تجاهل تعليمات المدرب إذا بدت المادة سهلة",
      "عدم قراءة التعليمات الخاصة بالاختبار الموقوت",
    ),
    q(
      "ما الغرض المعتاد من الاختبار القبلي في مسار تدريبي؟",
      5,
      "قياس نقطة انطلاق المعرفة قبل تغطية محتوى الدورة",
      "إصدار شهادة نهائية قبل بدء التدريب",
      "استبدال حضور المتدرب طوال الدورة",
      "إلغاء الحاجة إلى اختبار لاحق",
    ),
    q(
      "عند وجود جدول زمني للدورة على المنصة، فالمتوقع من المتدرب المعتمد هو:",
      6,
      "الاطلاع على المواعيد والالتزام بما نصت عليه الإدارة",
      "تجاهل الجدول إذا كان لديه خبرة سابقة",
      "طلب تمديد تلقائي دون مراجعة الإدارة",
      "إكمال المحتوى دون تسليم أي نشاط مطلوب",
    ),
  ];

  const postQuestions = [
    q(
      "بعد استكمال محتوى الدورة التجريبية، ما أقرب وصف لدور المتدرب في إدارة وقته؟",
      1,
      "مواءمة الجهد مع الجدول المعلن والمهام المحددة",
      "الاعتماد فقط على الذاكرة دون مراجعة",
      "تأجيل القراءة حتى انتهاء صلاحية الوصول",
      "تجاهل الاختبار البعدي إذا نجح في القبلي",
    ),
    q(
      "لماذا تُستخدم أوزان مختلفة للاختبار القبلي والبعدي في احتساب الدرجة النهائية؟",
      2,
      "لأن الأداء بعد التدريب يعكس غالبًا استيعابًا أعمق للمحتوى",
      "لأن الاختبار القبلي لا قيمة له مطلقًا",
      "لأن الدرجة النهائية تُحسب عشوائيًا",
      "لإلغاء أثر أي من الاختبارين",
    ),
    q(
      "عند تلقي ملاحظة من المدرب عبر قناة رسمية في المنصة، فالأسلوب المناسب هو:",
      3,
      "الرد باحترام والالتزام بأسلوب التواصل المعلن",
      "نشر المحتوى خارج المنصة دون إذن",
      "تجاهل الرسالة إذا لم تُذكر فيها علامة",
      "الرد بلغة غير لائقة عند الاختلاف",
    ),
    q(
      "ما الذي يميّز سؤال اختيار من متعدد «صالحًا تقنيًا» في تقييم المعرفة؟",
      4,
      "صياغة واضحة وخيارات مشتتة معقولة مع إجابة واحدة أفضل وفق المنهج",
      "صياغة غامضة بحيث لا يمكن الخطأ",
      "وجود أكثر من إجابة صحيحة دون إشارة لذلك",
      "اقتصار الخيارات على «نعم» و«لا» دائمًا",
    ),
    q(
      "إذا طُلب منك إكمال الاختبار البعدي وفق سياسة المنصة، فالمعنى المعتاد لاعتماد الإدارة لفتحه هو:",
      5,
      "تحقق شروط مسبقة (مثل إتمام قبلي أو موافقة) قبل السماح بالدخول",
      "فتح الاختبار لجميع زوار الموقع دون حساب",
      "إلغاء الاختبار القبلي من السجل",
      "تخطي متطلبات التسجيل في الدورة",
    ),
    q(
      "أي عبارة تصف بشكل أدق «بيئة تدريب إلكترونية متكاملة» كما في هذه المنصة التجريبية؟",
      6,
      "تجمع بين محتوى منظم واختبارات وتتبع وقنوات تواصل رسمية",
      "تقتصر على رفع ملفات فقط دون تفاعل",
      "تستبدل سياسات المؤسسة دون إشراف",
      "تمنع المتدرب من معرفة درجته",
    ),
  ];

  const preExam = await prisma.exam.create({
    data: {
      courseId: course.id,
      type: ExamType.PRE,
      title: "الاختبار القبلي (بيانات تجريبية للعرض)",
      durationMinutes: 25,
      isActive: true,
      questions: { create: preQuestions },
    },
  });

  await prisma.exam.create({
    data: {
      courseId: course.id,
      type: ExamType.POST,
      title: "الاختبار البعدي (بيانات تجريبية للعرض)",
      durationMinutes: 30,
      isActive: true,
      questions: { create: postQuestions },
    },
  });

  await prisma.enrollment.createMany({
    data: participants.map((p, index) => ({
      userId: p.id,
      courseId: course.id,
      status: index < 3 ? EnrollmentStatus.APPROVED : EnrollmentStatus.PENDING,
    })),
  });

  await prisma.courseGrade.createMany({
    data: participants.map((p) => ({
      courseId: course.id,
      userId: p.id,
    })),
  });

  console.log("Seeded demo data successfully.", {
    adminEmail: admin.email,
    instructorEmail: instructor.email,
    courseId: course.id,
    preExamId: preExam.id,
    note: "الاختبارات والدورة للعرض التجريبي؛ أعد تشغيل البذرة لإعادة التعيين.",
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
