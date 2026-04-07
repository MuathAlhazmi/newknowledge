export const arCopy = {
  glossary: {
    accountApproval: "اعتماد الحساب",
    enrollmentApproval: "اعتماد التسجيل",
    chatModule: "المحادثات",
    feedback: "التغذية الراجعة",
    courseMaterials: "مواد الدورة (PDF)",
    gradesSection: "الدرجات",
    finalGrade: "الدرجة النهائية",
  },
  status: {
    pendingReview: "قيد المراجعة",
    approved: "معتمد",
    noPendingRequests: "لا توجد طلبات معلقة.",
  },
  buttons: {
    send: "إرسال",
    save: "حفظ",
    add: "إضافة",
    start: "بدء",
    go: "انتقال",
  },
  templates: {
    success: (action: string) => `تم ${action} بنجاح.`,
    validation: (action: string) => `يرجى ${action}.`,
    failure: (action: string) => `تعذر ${action}. يرجى المحاولة مرة أخرى.`,
    pending: (action: string) => `جارٍ ${action}...`,
    empty: (subject: string) => `لا يوجد ${subject} حاليًا.`,
    emptyPlural: (subject: string) => `لا توجد ${subject} حاليًا.`,
  },
  /** Admin: إضافة مادة PDF */
  materialUpload: {
    titleLabel: "عنوان المادة",
    titlePlaceholder: "مثال: الوحدة الأولى",
    pdfLabel: "ملف PDF",
    uploadButton: "رفع الملف",
    uploadPending: "جارٍ رفع الملف...",
    saveMaterial: "حفظ المادة",
    afterUpload: "تم رفع الملف بنجاح. يمكنك الآن حفظ المادة.",
    errors: {
      notPdf: "يرجى اختيار ملف بصيغة PDF.",
      tooLarge: "حجم الملف يتجاوز الحد المسموح (٢٥ ميغابايت).",
      invalidPdf: "الملف المحدد ليس مستند PDF صالحًا.",
      generic: "تعذر رفع الملف. يرجى المحاولة مرة أخرى.",
    },
  },
  /** صفحات إدارة الدورة: الدرجات */
  adminGrades: {
    title: "إدارة النتائج",
    subtitle: "مراجعة الدرجات، إعادة الاحتساب، أو تعديل الدرجة النهائية يدويًا عند الحاجة.",
    criteriaSummaryTitle: "معايير التقييم المعتمدة",
    criteriaSummaryHint: "تُحدَّث من صفحة اختبارات الدورة وتُستخدم في احتساب الدرجة النهائية وحالة الاجتياز.",
    noConfigWarning:
      "لم تُضبط معايير التقييم لهذه الدورة بعد. يُرجى تعريف أوزان القبلي والبعدي ودرجة الاجتياز من صفحة الاختبارات.",
    approvedSection: "المتدربون المعتمدون",
    emptyLearners: "لا يوجد متدرب معتمد",
    emptyLearnersHint: "ستُعرض الدرجات هنا بعد اعتماد تسجيلات المتدربين في الدورة.",
    linkCourseHub: "إدارة الدورة",
    linkExams: "الاختبارات",
    finalScoreField: "الدرجة النهائية",
    recalc: "إعادة احتساب",
    saveEdit: "حفظ التعديل",
    manualFromAdmin: "تم التعديل يدويًا من الإدارة",
    computedAuto: "محسوبة تلقائيًا",
  },
  /** صفحات إدارة الدورة: تغذية راجعة */
  adminFeedback: {
    linkHub: "إدارة الدورة",
  },
  /** صفحات إدارة الدورة: اختبارات */
  adminExams: {
    configHelper: "يجب أن يبلغ مجموع وزن القبلي والبعدي ١٠٠٪. بعد الحفظ تُعاد احتساب درجات جميع المتدربين المعتمدين.",
    participantsSection: "المتدربون واعتماد الاختبار البعدي",
    editorSectionTitle: "بناء الاختبارات",
    editorSectionHint: "يُسمح باختبار قبلي واحد واختبار بعدي واحد لكل دورة؛ يُستخدمان في الدرجة وفتح البعدي.",
    editPreQuiz: "تعديل الاختبار القبلي",
    editPostQuiz: "تعديل الاختبار البعدي",
    editorPageTitlePre: "الاختبار القبلي",
    editorPageTitlePost: "الاختبار البعدي",
    editorSubtitle: "العنوان والمدة والأسئلة وخيارات الإجابة (إجابة صحيحة واحدة لكل سؤال).",
    backToExams: "العودة إلى الاختبارات",
    examTitleLabel: "عنوان الاختبار",
    durationLabel: "المدة (دقائق)",
    activeLabel: "الاختبار مفعّل للمتدربين",
    questionsTitle: "الأسئلة",
    addQuestion: "إضافة سؤال",
    removeQuestion: "حذف السؤال",
    questionLabel: "نص السؤال",
    choicesTitle: "الخيارات",
    addChoice: "إضافة خيار",
    removeChoice: "حذف",
    correctLabel: "صحيح",
    saveQuiz: "حفظ الاختبار",
    savingQuiz: "جارٍ الحفظ...",
    saveSuccess: "تم حفظ الاختبار بنجاح.",
    editorErrors: {
      invalidPayload: "بيانات النموذج غير صالحة.",
      invalidExamType: "نوع الاختبار غير معروف.",
      courseNotFound: "الدورة غير موجودة.",
      jsonParse: "تعذر قراءة البيانات المرسلة.",
      questions: "يرجى إضافة سؤال واحد على الأقل مع خيارين على الأقل لكل سؤال وإجابة صحيحة واحدة فقط.",
      generic: "تعذر حفظ الاختبار. يرجى المحاولة مرة أخرى.",
    },
  },
  /** صفحات إدارة الدورة: تسجيلات */
  adminEnrollments: {
    emptyTitle: "لا تسجيلات بعد",
    emptyText: "لم يُضف أي متدرب إلى هذه الدورة. استخدم النموذج أعلاه لإضافة متدرب معتمد.",
  },
  /** مركز إدارة المنصة (/admin) — حسابات وتسجيلات خفيفة */
  adminUserHub: {
    eyebrow: "إدارة المنصة",
    title: "مركز المستخدمين والدعم",
    subtitle: "اعتماد الحسابات، إنشاء أدوار، ومتابعة طلبات التسجيل. إدارة محتوى الدورات من لوحة المدرب.",
    pendingAccountsTitle: "حسابات بانتظار اعتماد المنصة",
    pendingAccountsHint: "متدربون سجّلوا ذاتيًا ولم يُفعَّل حسابهم بعد.",
    createUserTitle: "إنشاء حساب (إداري / مدرب / متدرب)",
    pendingEnrollmentsTitle: "طلبات تسجيل معلّقة (جميع الدورات)",
    pendingEnrollmentsHint: "اعتماد تسجيل المتدرب في الدورة من هنا للدعم الفني.",
    minimalEnrollTitle: "إضافة متدرب معتمد إلى دورة",
    userCreatedSuccess: (displayName: string, email: string, roleLabel: string) =>
      `تم إنشاء حساب ${roleLabel}: ${displayName} (${email}). يمكنه تسجيل الدخول الآن.`,
    enrollmentAddedSuccess: (courseTitle: string, learnerName: string) =>
      `تمت إضافة المتدرب «${learnerName}» إلى الدورة «${courseTitle}» باعتماد فوري.`,
    userDirectoryTitle: "دليل المستخدمين",
    userDirectoryHint:
      "جميع الحسابات مرتبة حسب تاريخ الإنشاء. صفِّ حسب الدور عند الحاجة. لا يتضمن تعديل الحسابات من هنا.",
    filterAll: "الكل",
    filterRoleLabel: "تصفية الدور",
    participantPendingPlatform: "بانتظار اعتماد المنصة",
    participantPlatformApproved: "معتمد على المنصة",
    staffPlatformNote: "—",
    userUpdatedSuccess: "تم حفظ تغييرات المستخدم.",
    userDeletedAuthWarning:
      "تم حذف المستخدم من قاعدة البيانات. إن بقي حسابه في Supabase، احذفه يدويًا من لوحة Supabase إن لزم.",
    updateRequiresAuthUser:
      "لا يوجد حساب مصادقة مرتبط بهذا البريد في Supabase؛ لا يمكن تغيير البريد أو كلمة المرور من هنا.",
    editUser: "تعديل",
    deleteUser: "حذف",
    saveUserChanges: "حفظ التغييرات",
    cancelEdit: "إلغاء",
    newPasswordOptional: "كلمة مرور جديدة (اختياري، ٨ أحرف على الأقل)",
    confirmDeleteUser: "حذف هذا المستخدم نهائيًا؟ لا يمكن التراجع. سيتم حذف سجلاته المرتبطة في المنصة.",
    platformApprovedLabel: "اعتماد الحساب على المنصة (متدرب)",
  },
  roleLabels: {
    ADMIN: "إدارة المنصة",
    INSTRUCTOR: "مدرب",
    PARTICIPANT: "متدرب",
  },
  /** إشعارات منبثقة (نفس الأسلوب الرسمي لبقية الواجهة) */
  snackbar: {
    passwordUpdated: "تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.",
    authCallbackFailed:
      "تعذر إكمال المصادقة. يرجى محاولة تسجيل الدخول مرة أخرى أو إعادة طلب رابط الاستعادة.",
    signupVerifyEmail:
      "تم إنشاء طلب التسجيل بنجاح. يرجى التحقق من البريد الإلكتروني واتباع رابط التأكيد إن وُجد، ثم تسجيل الدخول. بعد اعتماد الحساب ستُتاح لك الدورات.",
    forgotPasswordSent:
      "إن وُجد حساب مرتبط بهذا البريد، ستصلك رسالة قريبًا. يرجى مراجعة صندوق الوارد أو البريد غير المرغوب.",
    enrollmentAddedPending: (courseTitle: string, learnerName: string) =>
      `تمت إضافة المتدرب «${learnerName}» إلى الدورة «${courseTitle}». حالة التسجيل: قيد اعتماد التسجيل.`,
    userDeleted: "تم حذف المستخدم من قاعدة بيانات المنصة.",
  },
} as const;

/** Admin/UI: عدد + اسم معدود بصياغة عربية سليمة (مفرد / تثنية / جمع). */
export function arCountMaterials(n: number): string {
  if (n === 0) return "لا مواد";
  if (n === 1) return "مادة واحدة";
  if (n === 2) return "مادتان";
  return `${n} مواد`;
}

export function arCountExams(n: number): string {
  if (n === 0) return "لا اختبارات";
  if (n === 1) return "اختبار واحد";
  if (n === 2) return "اختباران";
  return `${n} اختبارات`;
}

export function arCountEnrollments(n: number): string {
  if (n === 0) return "لا تسجيلات";
  if (n === 1) return "تسجيل واحد";
  if (n === 2) return "تسجيلان";
  return `${n} تسجيلات`;
}

export function arCountZoomSessions(n: number): string {
  if (n === 0) return "لا جلسات";
  if (n === 1) return "جلسة واحدة";
  if (n === 2) return "جلستان";
  return `${n} جلسات`;
}

export function arCountFeedbackReplies(n: number): string {
  if (n === 0) return "لا ردود";
  if (n === 1) return "رد واحد";
  if (n === 2) return "ردّان";
  return `${n} ردود`;
}

/** عدد المتدربين المعتمدين في الدورة. */
export function arCountApprovedTrainees(n: number): string {
  if (n === 0) return "لا متدربين";
  if (n === 1) return "متدرب واحد";
  if (n === 2) return "متدربان";
  return `${n} متدربين`;
}

/** طلبات تسجيل بانتظار الاعتماد (يُعرض عندما n أكبر من صفر). */
export function arCountPendingEnrollments(n: number): string {
  if (n === 1) return "تسجيل واحد بانتظار الاعتماد";
  if (n === 2) return "تسجيلان بانتظار الاعتماد";
  return `${n} تسجيلات بانتظار الاعتماد`;
}
