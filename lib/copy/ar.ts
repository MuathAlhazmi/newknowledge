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
  profile: {
    title: "الملف الشخصي",
    subtitle: "تحديث بياناتك الشخصية الأساسية المستخدمة داخل المنصة.",
    nameLabel: "الاسم الكامل",
    phoneLabel: "رقم الجوال",
    phonePlaceholder: "+9665xxxxxxxx",
    save: "حفظ البيانات",
    saving: "جارٍ الحفظ...",
    saved: "تم تحديث بيانات الملف الشخصي بنجاح.",
    errors: {
      notAllowed: "هذه الصفحة مخصصة للمدرب والمتدرب فقط.",
      nameRequired: "يرجى إدخال الاسم الكامل.",
      phoneInvalid: "يرجى إدخال رقم جوال صالح (8 أحرف على الأقل).",
      phoneTaken: "رقم الجوال مسجّل مسبقًا.",
    },
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
    saveMaterial: "حفظ المادة في الدورة",
    savePending: "جارٍ حفظ المادة...",
    saveSuccess: "تمت إضافة المادة إلى الدورة.",
    afterUpload: "تم رفع الملف بنجاح. يمكنك الآن حفظ المادة في الدورة.",
    sectionTitle: "إضافة مادة جديدة",
    step1: "الرفع",
    step2: "مراجعة",
    step3: "التأكيد",
    dropHint: "اسحب ملف PDF هنا، أو اختر ملفًا",
    dropActiveHint: "وأفلته هنا…",
    browseFiles: "اختيار ملف",
    removeFile: "إزالة",
    fileReady: "جاهز للرفع",
    uploadedBadge: "تم الرفع",
    needTitle: "أدخل عنوان المادة أولًا.",
    needFile: "اختر ملف PDF أولًا.",
    resetAddAnother: "إضافة مادة أخرى",
    errors: {
      notPdf: "يرجى اختيار ملف بصيغة PDF.",
      tooLarge: "حجم الملف يتجاوز الحد المسموح (٢٥ ميغابايت).",
      invalidPdf: "الملف المحدد ليس مستند PDF صالحًا.",
      generic: "تعذر رفع الملف. يرجى المحاولة مرة أخرى.",
      saveFailed: "تعذر حفظ المادة. حاول مرة أخرى.",
      saveValidation: "يرجى إدخال عنوان المادة وإكمال رفع الملف.",
    },
  },
  materialsAdmin: {
    listTitle: "المواد الحالية",
    listSubtitle: "المحتوى المتاح للمتدربين في هذه الدورة.",
    listSubtitleEditor: "يمكنك تعديل العنوان أو استبدال ملف PDF أو حذف المادة من الأزرار أدناه.",
    openFile: "فتح PDF",
    editTitle: "تعديل العنوان",
    saveTitle: "حفظ",
    cancel: "إلغاء",
    replacePdf: "استبدال PDF",
    delete: "حذف",
    confirmDelete: "حذف هذه المادة من الدورة وإزالة الملف من التخزين؟ لا يمكن التراجع.",
    titleSaved: "تم تحديث العنوان.",
    replaced: "تم استبدال ملف PDF.",
    deleted: "تم حذف المادة.",
    replaceModalTitle: "استبدال ملف PDF",
    replaceModalHint: "ارفع ملف PDF جديدًا. سيُستبدل الملف السابق في التخزين بعد الحفظ.",
    applyReplace: "تطبيق الاستبدال",
    replacing: "جارٍ الاستبدال…",
    errors: {
      titleUpdate: "تعذر تحديث العنوان.",
      replace: "تعذر استبدال الملف.",
      delete: "تعذر حذف المادة.",
      notFound: "المادة غير موجودة.",
    },
  },
  announcements: {
    learnerTitle: "الإعلانات والتنبيهات",
    learnerSubtitle: "آخر التحديثات داخل الدورة مرتبة من الأحدث للأقدم.",
    emptyLearner: "لا توجد إعلانات أو تحديثات في الوقت الحالي.",
    previewSectionTitle: "الإعلانات",
    viewAll: "عرض كل الإعلانات",
    adminTitle: "إعلانات الدورة",
    adminSubtitle: "أنشئ ونشّر تنبيهات تظهر للمتدربين داخل صندوق الإعلانات.",
    emptyAdmin: "لا توجد إعلانات بعد.",
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
    import: {
      title: "استيراد الأسئلة من CSV/Excel",
      hint: "ارفع ملفًا، اربط الأعمدة بالحقول، ثم استورد لاستبدال أسئلة هذا الاختبار.",
      uploadLabel: "ملف الاستيراد",
      mappingTitle: "ربط الأعمدة",
      previewTitle: "معاينة قبل الاستيراد",
      importButton: "استيراد واستبدال الأسئلة",
      importing: "جارٍ الاستيراد...",
      sampleColumnsHint: "صيغة مقترحة: question, choice1, choice2, choice3, choice4, correct, order",
      fields: {
        question: "نص السؤال",
        choice1: "الخيار A",
        choice2: "الخيار B",
        choice3: "الخيار C",
        choice4: "الخيار D",
        correct: "الإجابة الصحيحة (A-D أو 1-4)",
        order: "الترتيب (اختياري)",
      },
      noMappingYet: "اختر ملفًا أولًا لعرض الأعمدة وربطها.",
      success: "تم استيراد الأسئلة بنجاح واستبدال الأسئلة السابقة.",
      errors: {
        invalidPayload: "بيانات الاستيراد غير صالحة.",
        invalidExamType: "نوع الاختبار غير معروف.",
        jsonParse: "تعذر قراءة بيانات الاستيراد.",
        validation:
          "الرجاء التحقق من التعيين: سؤال لكل صف، خياران على الأقل، وإجابة صحيحة واحدة بصيغة A-D أو 1-4.",
        generic: "تعذر تنفيذ الاستيراد. يرجى المحاولة مرة أخرى.",
        emptyFile: "الملف فارغ.",
        unsupportedType: "الملف غير مدعوم. استخدم CSV أو XLSX.",
        parseFailed: "تعذر قراءة الملف. تحقق من تنسيقه.",
        emptySheet: "لم يتم العثور على بيانات صالحة داخل الملف.",
      },
    },
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
    /** تسجيل الدخول — رسائل للمستخدم النهائي (لا تذكر أسماء تقنية أو أوامر) */
    loginInvalidCredentials:
      "البريد الإلكتروني أو كلمة المرور غير صحيحة. راجع البيانات، أو استخدم «نسيت كلمة المرور» إن نسيت كلمة المرور.",
    loginEmailNotConfirmed:
      "لم يُفعّل بريدك بعد. افتح الرسالة الواردة واضغط رابط التأكيد. إن لم تصلك رسالة، تحقق من البريد غير المرغوب أو تواصل مع الدعم.",
    signupCompleteFailed:
      "تعذر إكمال إنشاء الحساب. إذا تكرّر ذلك، تواصل مع فريق الدعم.",
    authCallbackFailed:
      "تعذر إكمال تسجيل الدخول. أعد المحاولة أو اطلب رابط استعادة كلمة مرور جديد من صفحة «نسيت كلمة المرور».",
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
