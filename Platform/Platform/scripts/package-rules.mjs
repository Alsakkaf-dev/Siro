// قواعد تحويل مجلدات الفصول الحالية إلى حزم SEM-X (Semester Package v1).
// كل رمز ومادة وساعات ونتيجة هنا منقول حرفيًا من كشوف التسجيل والنتائج الرسمية في <SEM>/00-Semester-Records:
//   SEM 1 → 2024-2025-Sem-1-Course-Registration.pdf + 2024-2025-Sem-1-Exam-Results.pdf
//   SEM 2 → 2024-2025-Sem-2-*.pdf   SEM 3 → 2025-2026-Sem-1-*.pdf   SEM 4 → 2025-2026-Sem-2-*.pdf
// تواريخ البداية من التقويم الأكاديمي (المصدر مذكور في note). لا شيء مُخمَّن بدون وسم.

export const COLORS = ['#4CC9F0', '#F72585', '#7209B7', '#3A86FF', '#FB8500', '#06D6A0', '#EF476F', '#8338EC'];

/** تصنيف مجلد المستوى الأول داخل المادة → مجلد التصنيف القياسي */
export const CATEGORY_RULES = [
  [/^0?1[-_ ]|course.?info|cource.?info|^ci_?$/i, '01-Course-Information'],
  [/^0?2[-_ ]|lecture|slide|e-learning/i, '02-Lectures'],
  [/^0?3[-_ ]|\blab/i, '03-Labs'],
  [/^0?4[-_ ]|assign|assing/i, '04-Assignments'],
  [/^0?5[-_ ]|project|proposal/i, '05-Projects'],
  [/^0?6[-_ ]|exam|final|fainal|test|quiz|mid.?term/i, '06-Exams'],
  [/^0?7[-_ ]|note|summary|study/i, '07-Study-Notes'],
  [/^0?8[-_ ]|record|video/i, '08-Recordings'],
  [/tutorial|problem.?solv|activit|in-class/i, '09-Tutorials'],
  [/reference|textbook|book/i, '10-References'],
];

const R = (grade, points, credits, status = null) => ({ grade, points, credits, status });
const REPEAT = 'UM — إعادة المادة (حسب كشف النتائج)';

export const SEMESTERS = {
  'SEM-1': {
    src: 'Year 1/SEM 1',
    semester: {
      id: 'sem1', code: 'SEM 1', name: 'Semester I 2024/2025', year_no: 1, sem_no: 1, start_date: '2024-10-06', weeks: 16, break_weeks: [], exam_start: null, exam_end: null,
      note: 'تاريخ البداية من التقويم الأكاديمي الرسمي لجامعة UTM 2024/2025 (بداية محاضرات الفصل الأول 6 Oct 2024). عدد الأسابيع 16 [افتراض]. المعدل الفصلي GPA 2.28 · التراكمي CGPA 2.28 (كشف النتائج).',
    },
    courses: [
      { dir: 'FPS', code: 'SCSE1013', section: '02', name: 'Fundamental Programming Concepts', credits: 3, result: R('C', 2.0, 3) },
      { dir: 'DG', code: 'SCSR1013', section: '01', name: 'Digital Logic', credits: 3, result: R('C+', 2.33, 3) },
      { dir: 'MS', code: 'SCST1123', section: '01', name: 'Mathematics for Software Engineer', credits: 3, result: R('D+', 1.33, 3) },
      { dir: 'DB', code: 'SCST1143', section: '02', name: 'Database Engineering', credits: 3, result: R('C+', 2.33, 3) },
      { dir: null, code: 'UHLB1112', section: '18', name: 'English Communication Skills', credits: 2, result: R('HL', 0, 2, 'HL (حسب كشف النتائج)') },
      { dir: 'INT', code: 'ULRS1032', section: '08', name: 'Integrity and Anti-Corruption Course', credits: 2, result: R('A+', 4.0, 2) },
    ],
  },
  'SEM-2': {
    src: 'Year 1/SEM 2',
    semester: {
      id: 'sem2', code: 'SEM 2', name: 'Semester II 2024/2025', year_no: 1, sem_no: 2, start_date: '2025-03-17', weeks: 16, break_weeks: [], exam_start: null, exam_end: null,
      note: 'تاريخ البداية من التقويم الأكاديمي الرسمي لجامعة UTM 2024/2025 (الفصل الثاني يبدأ 17 Mar 2025). عدد الأسابيع 16 [افتراض]. GPA 2.15 · CGPA 2.21 (كشف النتائج).',
    },
    courses: [
      { dir: 'SEP', code: 'SCSE1203', section: '03', name: 'Software Engineering Principles', credits: 3, result: R('B', 3.0, 3) },
      { dir: 'AP', code: 'SCSE1224', section: '02', name: 'Advanced Programming', credits: 4, result: R('C+', 2.33, 4) },
      { dir: 'COA', code: 'SCSR1033', section: '04', name: 'Computer Organization and Architecture', credits: 3, result: R('C+', 2.33, 3) },
      { dir: null, code: 'SCSR2213', section: '05', name: 'Network Communications', credits: 3, result: R('D', 1.0, 3, REPEAT), note: 'أُعيدت في SEM 4 — ملفاتها في حزمة SEM-4.' },
      { dir: null, code: 'SCST1223', section: '05', name: 'Probability and Statistical Data Analysis', credits: 3, result: R('D', 1.0, 3, REPEAT), note: 'أُعيدت في SEM 4 — ملفاتها في حزمة SEM-4.' },
      { dir: 'MLY', code: 'UHLM1012', section: '03', name: 'Malay Language for Communication 2', credits: 2, result: R('A-', 3.67, 2) },
    ],
  },
  'SEM-3': {
    src: 'Year 2/SEM 3',
    semester: {
      id: 'sem3', code: 'SEM 3', name: 'Semester I 2025/2026', year_no: 2, sem_no: 3, start_date: '2025-10-06', weeks: 16, break_weeks: [], exam_start: null, exam_end: null,
      note: 'تاريخ البداية من جدول عمل الفصل الأول 2025/2026 الرسمي (AMD UTM): المحاضرات من 6 Oct 2025. عدد الأسابيع 16 [افتراض]. GPA 3.00 · CGPA 2.48 (كشف النتائج).',
    },
    courses: [
      { dir: 'DSA SCSE2103-03', code: 'SCSE2103', section: '03', name: 'Data Structure and Algorithm', credits: 3, result: R('B', 3.0, 3) },
      { dir: 'SRE SCSE2123-02', code: 'SCSE2123', section: '02', name: 'Software Requirements Engineering', credits: 3, result: R('C+', 2.33, 3) },
      { dir: ' SPM SCSE2133-03', code: 'SCSE2133', section: '03', name: 'Software Process and Project Management', credits: 3, result: R('B-', 2.67, 3) },
      { dir: 'HCIF SCSM2113-01', code: 'SCSM2113', section: '01', name: 'Human Computer Interaction Fundamentals', credits: 3, result: R('B-', 2.67, 3) },
      { dir: 'OS SCSR2043-01', code: 'SCSR2043', section: '01', name: 'Operating Systems', credits: 3, result: R('A-', 3.67, 3) },
      { dir: null, code: 'ULRF2622', section: '01', name: 'Football', credits: 2, result: R('A', 4.0, 2) },
    ],
  },
  'SEM-4': {
    src: 'Year 2/SEM 4',
    semester: {
      id: 'sem4', code: 'SEM 4', name: 'Semester II 2025/2026', year_no: 2, sem_no: 4, start_date: '2026-03-09', weeks: 16, break_weeks: [], exam_start: null, exam_end: null,
      note: 'تاريخ البداية 9 Mar 2026 [افتراض] — من مصدر غير رسمي، لم يُعثر على التقويم الرسمي؛ صحّحه إن عرفت التاريخ. عدد الأسابيع 16 [افتراض]. GPA 2.22 · CGPA 2.55 (كشف النتائج).',
    },
    courses: [
      { dir: 'SDA', code: 'SCSE2233', section: '03', name: 'Software Design and Architecture', credits: 3, result: R('D', 1.0, 3, REPEAT) },
      { dir: 'ADP-1', code: 'SCSE2243', section: '01', name: 'Application Development Project I', credits: 3, result: R('A', 4.0, 3) },
      { dir: 'Cross', code: 'SCSM2223', section: '02', name: 'Cross-Platform Application Development', credits: 3, result: R('B', 3.0, 3) },
      { dir: 'BI', code: 'SCSP3213', section: '02', name: 'Business Intelligence', credits: 3, result: R('D', 1.0, 3, REPEAT) },
      { dir: 'NC', code: 'SCSR2213', section: '01', name: 'Network Communications', credits: 3, result: R('B-', 2.67, 3), note: 'إعادة (UK) — المحاولة الأولى في SEM 2.' },
      { dir: 'PSDA', code: 'SCST1223', section: '01', name: 'Probability and Statistical Data Analysis', credits: 3, result: R('C-', 1.67, 3), note: 'إعادة (UK) — المحاولة الأولى في SEM 2.' },
    ],
  },
  'SEM-5': {
    src: 'Year 3/SEM 5',
    seed: 'seed/sem5-dashboard.json', // بيانات الفصل الحالي كما هي في الموقع
    courses: [
      { dir: 'CC SCSE3103-05', code: 'SCSE3103' },
      { dir: 'UC SCSE3143-05', code: 'SCSE3143' },
      { dir: 'ST SCSE3203-03', code: 'SCSE3203' },
      { dir: 'SKEX2123 - Instrumentation & Measurement', code: 'SKEX2123' },
      { dir: 'UHLB2122-37', code: 'UHLB2122' },
      { dir: 'UHLF1112-07 - French', code: 'UHLF1112' },
    ],
  },
};
