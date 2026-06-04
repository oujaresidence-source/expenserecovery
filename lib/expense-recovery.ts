export type PageKey = "dashboard" | "apartments" | "rebuild" | "export";

export type ApartmentStatus = "لم تبدأ" | "جاري الإدخال" | "شبه مكتملة" | "مكتملة";
export type DidPay = "نعم" | "لا" | "لا أتذكر";
export type ExpenseType = "مرة واحدة" | "متكرر" | "لا أتذكر";
export type RecurringType = "شهري" | "أسبوعي" | "لكل حجز" | "عند الحاجة" | "لا أتذكر";
export type AmountType = "مؤكد" | "تقديري" | "نطاق تقريبي" | "لا أتذكر";
export type PaymentSource = "حساب المؤسس الشخصي" | "حساب الشركة" | "كاش" | "لا أتذكر" | "أخرى";
export type PaymentMethod = "مدى" | "بطاقة ائتمانية" | "Apple Pay" | "تحويل بنكي" | "كاش" | "لا أتذكر" | "أخرى";

export type Apartment = {
  id: string;
  code: string;
  district: string;
  project: string;
  startDate: string;
  startDateCertainty: "تاريخ مؤكد" | "شهر تقريبي" | "لا أتذكر";
  furnishedStatus: "فاضية" | "مفروشة جزئياً" | "مفروشة بالكامل" | "لا أتذكر";
  status: ApartmentStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type Expense = {
  id: string;
  apartmentId: string;
  section: string;
  itemName: string;
  description: string;
  didPay: DidPay;
  expenseType: ExpenseType;
  recurringType: RecurringType;
  startDate: string;
  startDateCertainty: "تاريخ مؤكد" | "شهر تقريبي" | "لا أتذكر";
  endDate: string;
  endDateCertainty: "تاريخ مؤكد" | "شهر تقريبي" | "لا أتذكر";
  isStillActive: boolean;
  amountSar: number | null;
  amountType: AmountType;
  minAmountSar: number | null;
  maxAmountSar: number | null;
  numberOfPeriods: number | null;
  totalCalculatedAmountSar: number;
  paymentSource: PaymentSource;
  paymentSourceOther: string;
  paymentMethod: PaymentMethod;
  paymentMethodOther: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type RecoveryState = {
  activePage: PageKey;
  activeApartmentId: string;
  saveStatus: "تم الحفظ" | "جاري الحفظ" | "لم يتم الحفظ";
  apartments: Apartment[];
  expenses: Expense[];
};

export type ExpenseTemplate = {
  section: string;
  itemName: string;
  defaultExpenseType: ExpenseType;
  defaultRecurringType?: RecurringType;
  suggestions?: PriceSuggestion[];
  extraFields?: "tv";
};

export type PriceSuggestion = {
  label: string;
  min: number;
  max: number;
};

const today = "2026-06-04";
const seedCodes = ["6B HTN", "15C HTN", "3BMJ", "6BMJ", "MS5 202", "MS6 202", "MS 113", "9B HTN", "12B HTN", "101 QUR"];

export const priceSuggestions = {
  furniture: [
    { label: "كنب بسيط: 1,500 - 3,500 ريال", min: 1500, max: 3500 },
    { label: "كنب جودة أعلى: 3,500 - 7,000 ريال", min: 3500, max: 7000 },
    { label: "سرير: 800 - 2,500 ريال", min: 800, max: 2500 },
    { label: "مرتبة: 800 - 3,000 ريال", min: 800, max: 3000 },
    { label: "طاولة تلفزيون: 300 - 1,500 ريال", min: 300, max: 1500 },
    { label: "طاولة قهوة: 250 - 1,200 ريال", min: 250, max: 1200 },
    { label: "ستائر: 500 - 2,500 ريال", min: 500, max: 2500 },
    { label: "سجاد: 300 - 2,000 ريال", min: 300, max: 2000 },
    { label: "ديكور ومرايا: 300 - 2,000 ريال", min: 300, max: 2000 },
  ],
  appliances: [
    { label: "تلفزيون 65 بوصة: 2,000 - 4,000 ريال", min: 2000, max: 4000 },
    { label: "تلفزيون 85 بوصة: 4,500 - 9,000 ريال", min: 4500, max: 9000 },
    { label: "ثلاجة: 900 - 2,500 ريال", min: 900, max: 2500 },
    { label: "مايكرويف: 250 - 800 ريال", min: 250, max: 800 },
    { label: "غلاية: 80 - 300 ريال", min: 80, max: 300 },
    { label: "مكينة قهوة: 200 - 1,500 ريال", min: 200, max: 1500 },
    { label: "راوتر: 150 - 600 ريال", min: 150, max: 600 },
  ],
  operation: [
    { label: "تنظيف عميق: 250 - 800 ريال", min: 250, max: 800 },
    { label: "تنظيف شهري: 300 - 1,200 ريال شهرياً", min: 300, max: 1200 },
    { label: "تنظيف لكل حجز: 80 - 250 ريال", min: 80, max: 250 },
    { label: "غسيل مفارش: 100 - 600 ريال شهرياً", min: 100, max: 600 },
    { label: "تصوير: 300 - 1,500 ريال", min: 300, max: 1500 },
    { label: "نقل أثاث: 200 - 1,500 ريال", min: 200, max: 1500 },
    { label: "تركيب أثاث: 150 - 1,000 ريال", min: 150, max: 1000 },
    { label: "قفل ذكي: 250 - 1,200 ريال", min: 250, max: 1200 },
    { label: "إنترنت: 200 - 400 ريال شهرياً", min: 200, max: 400 },
    { label: "كهرباء: 150 - 800 ريال شهرياً", min: 150, max: 800 },
    { label: "ماء: 50 - 300 ريال شهرياً", min: 50, max: 300 },
    { label: "مستهلكات: 100 - 700 ريال شهرياً", min: 100, max: 700 },
  ],
  maintenance: [
    { label: "صيانة مكيف: 150 - 700 ريال", min: 150, max: 700 },
    { label: "سباكة: 150 - 800 ريال", min: 150, max: 800 },
    { label: "كهرباء: 150 - 800 ريال", min: 150, max: 800 },
    { label: "نجارة: 200 - 1,500 ريال", min: 200, max: 1500 },
    { label: "دهان: 300 - 2,000 ريال", min: 300, max: 2000 },
    { label: "قفل / باب: 100 - 700 ريال", min: 100, max: 700 },
  ],
};

const setupItems = ["إيجار / دفعة أولى", "تأمين", "عمولة وسيط", "رسوم عقد", "رسوم منصة / مكتب", "تأسيس كهرباء", "تأسيس ماء", "تأسيس إنترنت", "قفل ذكي", "مفاتيح / دخول ذاتي"];
const furnitureItems = ["سرير", "مرتبة", "كنب", "طاولة تلفزيون", "طاولة قهوة", "طاولات جانبية", "طاولة طعام", "كراسي", "دولاب", "مرايا", "سجاد", "ستائر", "ديكور", "إضاءات", "نباتات", "أثاث آخر"];
const applianceItems = ["تلفزيون", "ثلاجة", "مايكرويف", "غلاية", "مكينة قهوة", "مكواة", "استشوار", "راوتر", "أجهزة أخرى"];
const kitchenBathItems = ["صحون وأكواب", "ملاعق وسكاكين", "قدور ومقالي", "سلة نفايات", "أدوات تنظيف", "مناشف", "مفارش", "مخدات", "شامبو وصابون", "مناديل", "فرش أسنان", "مستلزمات حمام أخرى", "مستلزمات مطبخ أخرى"];
const launchItems = ["تنظيف عميق", "تصوير", "كتابة إعلان", "نقل أثاث", "تركيب أثاث", "عامل / فني", "دهان", "كهربائي", "سباك", "نجار", "صيانة مكيف", "مصاريف أخرى قبل التشغيل"];
const recurringItems = ["تنظيف شهري", "تنظيف لكل حجز", "كهرباء", "ماء", "إنترنت", "غسيل مفارش", "مستهلكات ضيافة", "صيانة دورية", "اشتراكات برامج", "عمولات منصات", "عمالة", "مصاريف متكررة أخرى"];
const maintenanceItems = ["صيانة مكيف", "سباكة", "كهرباء", "نجارة", "دهان", "قفل / باب", "كسر أثاث", "ضرر من ضيف", "صيانة أخرى"];
const generalItems = ["بنزين ومشاوير", "مواقف", "توصيل", "مشتريات متفرقة", "ساكو", "إيكيا", "نون", "أمازون", "جرير", "إكسترا", "أخرى"];

export const expenseTemplates: ExpenseTemplate[] = [
  ...setupItems.map((itemName) => ({ section: "دفعات البداية", itemName, defaultExpenseType: "مرة واحدة" as ExpenseType, suggestions: priceSuggestions.operation })),
  ...furnitureItems.map((itemName) => ({ section: "الأثاث", itemName, defaultExpenseType: "مرة واحدة" as ExpenseType, suggestions: priceSuggestions.furniture })),
  ...applianceItems.map((itemName) => ({ section: "الأجهزة", itemName, defaultExpenseType: "مرة واحدة" as ExpenseType, suggestions: priceSuggestions.appliances, extraFields: itemName === "تلفزيون" ? "tv" as const : undefined })),
  ...kitchenBathItems.map((itemName) => ({ section: "المطبخ والحمام", itemName, defaultExpenseType: "مرة واحدة" as ExpenseType, suggestions: priceSuggestions.operation })),
  ...launchItems.map((itemName) => ({ section: "التجهيز قبل أول ضيف", itemName, defaultExpenseType: "مرة واحدة" as ExpenseType, suggestions: priceSuggestions.operation })),
  ...recurringItems.map((itemName) => ({ section: "المصاريف الشهرية والمتكررة", itemName, defaultExpenseType: "متكرر" as ExpenseType, defaultRecurringType: itemName.includes("لكل حجز") ? "لكل حجز" as RecurringType : "شهري" as RecurringType, suggestions: priceSuggestions.operation })),
  ...maintenanceItems.map((itemName) => ({ section: "الصيانة والأضرار", itemName, defaultExpenseType: "مرة واحدة" as ExpenseType, suggestions: priceSuggestions.maintenance })),
  ...generalItems.map((itemName) => ({ section: "مصاريف عامة", itemName, defaultExpenseType: "مرة واحدة" as ExpenseType })),
];

export const sectionOrder = [
  "دفعات البداية",
  "الأثاث",
  "الأجهزة",
  "المطبخ والحمام",
  "التجهيز قبل أول ضيف",
  "المصاريف الشهرية والمتكررة",
  "الصيانة والأضرار",
  "مصاريف عامة",
];

export const initialState: RecoveryState = {
  activePage: "dashboard",
  activeApartmentId: "apt-6b-htn",
  saveStatus: "تم الحفظ",
  apartments: seedCodes.map((code, index) => ({
    id: `apt-${code.toLowerCase().replaceAll(" ", "-")}`,
    code,
    district: code.includes("HTN") ? "HTN" : code.includes("QUR") ? "QUR" : "BMJ / MS",
    project: "",
    startDate: "",
    startDateCertainty: "لا أتذكر",
    furnishedStatus: "لا أتذكر",
    status: index < 2 ? "جاري الإدخال" : "لم تبدأ",
    notes: "",
    createdAt: today,
    updatedAt: today,
    archivedAt: null,
  })),
  expenses: seedCodes.flatMap((code) => {
    const apartmentId = `apt-${code.toLowerCase().replaceAll(" ", "-")}`;
    return expenseTemplates.map((template) => createExpenseFromTemplate(apartmentId, template));
  }),
};

export function createExpenseFromTemplate(apartmentId: string, template: ExpenseTemplate): Expense {
  return {
    id: `exp-${apartmentId}-${slugify(template.section)}-${slugify(template.itemName)}`,
    apartmentId,
    section: template.section,
    itemName: template.itemName,
    description: template.extraFields === "tv" ? "الحجم: لا أتذكر، الماركة: لا أتذكر" : "",
    didPay: "لا أتذكر",
    expenseType: template.defaultExpenseType,
    recurringType: template.defaultRecurringType ?? "لا أتذكر",
    startDate: "",
    startDateCertainty: "لا أتذكر",
    endDate: "",
    endDateCertainty: "لا أتذكر",
    isStillActive: false,
    amountSar: null,
    amountType: "لا أتذكر",
    minAmountSar: null,
    maxAmountSar: null,
    numberOfPeriods: null,
    totalCalculatedAmountSar: 0,
    paymentSource: "لا أتذكر",
    paymentSourceOther: "",
    paymentMethod: "لا أتذكر",
    paymentMethodOther: "",
    notes: "",
    createdAt: today,
    updatedAt: today,
    archivedAt: null,
  };
}

export function ensureExpensesForApartments(apartments: Apartment[], expenses: Expense[]) {
  const existingById = new Map(expenses.map((expense) => [expense.id, expense]));
  const complete = [...expenses];

  for (const apartment of apartments) {
    for (const template of expenseTemplates) {
      const seeded = createExpenseFromTemplate(apartment.id, template);
      if (!existingById.has(seeded.id)) {
        complete.push(seeded);
        existingById.set(seeded.id, seeded);
      }
    }
  }

  return complete;
}

export function formatSar(value: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function calculateExpenseTotal(expense: Expense) {
  const base = expense.amountSar ?? averageRange(expense);
  const periods = expense.expenseType === "متكرر" ? expense.numberOfPeriods || 1 : 1;
  return base * periods;
}

export function averageRange(expense: Expense) {
  if (typeof expense.minAmountSar === "number" && typeof expense.maxAmountSar === "number") {
    return Math.round((expense.minAmountSar + expense.maxAmountSar) / 2);
  }
  return 0;
}

export function summarizeApartment(apartment: Apartment, expenses: Expense[]) {
  const items = expenses.filter((expense) => expense.apartmentId === apartment.id && !expense.archivedAt);
  const answered = items.filter((expense) => expense.didPay !== "لا أتذكر" || expense.amountSar || expense.minAmountSar || expense.notes.trim()).length;
  const paid = items.filter((expense) => expense.didPay === "نعم");
  const completion = items.length ? Math.round((answered / items.length) * 100) : 0;
  const total = paid.reduce((sum, expense) => sum + calculateExpenseTotal(expense), 0);
  const exact = paid.filter((expense) => expense.amountType === "مؤكد").reduce((sum, expense) => sum + calculateExpenseTotal(expense), 0);
  const estimated = paid.filter((expense) => expense.amountType === "تقديري" || expense.amountType === "نطاق تقريبي").reduce((sum, expense) => sum + calculateExpenseTotal(expense), 0);
  const recurring = paid.filter((expense) => expense.expenseType === "متكرر").reduce((sum, expense) => sum + calculateExpenseTotal(expense), 0);
  const unknownAmount = paid.filter((expense) => expense.amountType === "لا أتذكر").length;

  return { items, paid, answered, completion, total, exact, estimated, recurring, unknownAmount };
}

export function summarizePortfolio(state: RecoveryState) {
  const apartments = state.apartments.filter((apartment) => !apartment.archivedAt);
  const summaries = apartments.map((apartment) => summarizeApartment(apartment, state.expenses));
  return {
    total: summaries.reduce((sum, summary) => sum + summary.total, 0),
    exact: summaries.reduce((sum, summary) => sum + summary.exact, 0),
    estimated: summaries.reduce((sum, summary) => sum + summary.estimated, 0),
    recurring: summaries.reduce((sum, summary) => sum + summary.recurring, 0),
    apartments: apartments.length,
    completed: summaries.filter((summary) => summary.completion >= 90).length,
    lastUpdated: state.apartments.reduce((latest, apartment) => apartment.updatedAt > latest ? apartment.updatedAt : latest, today),
  };
}

export function exportRows(state: RecoveryState, apartmentId = "all") {
  return state.expenses
    .filter((expense) => !expense.archivedAt)
    .filter((expense) => apartmentId === "all" || expense.apartmentId === apartmentId)
    .map((expense) => {
      const apartment = state.apartments.find((item) => item.id === expense.apartmentId);
      return {
        "رمز الشقة": apartment?.code ?? "",
        "الحي / المشروع": [apartment?.district, apartment?.project].filter(Boolean).join(" / "),
        "القسم": expense.section,
        "البند": expense.itemName,
        "الوصف": expense.description,
        "نوع المصروف": expense.expenseType,
        "نوع التكرار": expense.recurringType,
        "تاريخ البداية": expense.startDate,
        "تاريخ النهاية": expense.isStillActive ? "ما زال مستمر" : expense.endDate,
        "عدد الأشهر / المرات": expense.numberOfPeriods ?? "",
        "المبلغ": expense.amountSar ?? "",
        "أقل مبلغ": expense.minAmountSar ?? "",
        "أعلى مبلغ": expense.maxAmountSar ?? "",
        "الإجمالي المحسوب": calculateExpenseTotal(expense),
        "نوع المبلغ": expense.amountType,
        "من وين اندفع": expense.paymentSource === "أخرى" ? expense.paymentSourceOther : expense.paymentSource,
        "طريقة الدفع": expense.paymentMethod === "أخرى" ? expense.paymentMethodOther : expense.paymentMethod,
        "ملاحظات": expense.notes,
        "تاريخ الإدخال": expense.createdAt,
        "آخر تحديث": expense.updatedAt,
      };
    });
}

export function toCsv(rows: Record<string, string | number>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}
