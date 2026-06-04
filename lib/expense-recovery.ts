export type Role = "founder" | "finance" | "viewer";
export type LocaleCode = "en" | "ar";

export type ApartmentStatus =
  | "Not started"
  | "Started"
  | "Needs memory"
  | "Needs evidence"
  | "Ready for finance"
  | "Reviewed";

export type EvidenceStatus = "none" | "memory" | "receipt" | "bank" | "invoice" | "requested";
export type AmountConfidence = "exact" | "estimated" | "range" | "unknown";
export type Recurrence = "one-time" | "monthly" | "weekly" | "per booking" | "every time needed" | "not sure";
export type ReviewStatus = "draft" | "ready" | "approved" | "rejected" | "needs evidence";

export type Apartment = {
  id: string;
  code: string;
  district: string;
  status: ApartmentStatus;
  archived: boolean;
  startedAt?: string;
  startDateConfidence: "exact" | "approximate month" | "unknown";
  furnishing: "empty" | "partially furnished" | "fully furnished" | "unknown";
  operationState: "operating" | "under setup" | "not sure";
  notes: string;
  lastUpdated: string;
};

export type Expense = {
  id: string;
  apartmentId: string;
  category: string;
  group: "setup" | "recurring" | "repair" | "consumable";
  amount: number | null;
  amountMin?: number | null;
  amountMax?: number | null;
  amountConfidence: AmountConfidence;
  recurrence: Recurrence;
  startDate?: string;
  endDate?: string;
  paymentMethod: string;
  paidBy: string;
  evidenceStatus: EvidenceStatus;
  confidence: 1 | 2 | 3 | 4 | 5;
  notes: string;
  reviewStatus: ReviewStatus;
  evidenceFiles: string[];
  createdAt: string;
  updatedAt: string;
};

export type RecoveryState = {
  role: Role;
  locale: LocaleCode;
  activeApartmentId: string;
  apartments: Apartment[];
  expenses: Expense[];
};

export const setupCategories = [
  "Rent / first payment",
  "Security deposit",
  "Broker commission",
  "Contract fees",
  "Smart lock",
  "Deep cleaning before launch",
  "Photography",
  "Furniture",
  "Appliances",
  "Maintenance before launch",
  "Transport",
  "Installation labor",
  "Internet setup",
  "Electricity setup",
  "Water setup",
];

export const recurringCategories = [
  "Cleaning",
  "Electricity",
  "Water",
  "Internet",
  "Laundry",
  "Consumables",
  "Maintenance",
  "Platform fees",
  "Software subscriptions",
  "Labor",
  "Other",
];

const seedCodes = ["6B HTN", "15C HTN", "3BMJ", "6BMJ", "MS5 202", "MS6 202", "MS 113", "9B HTN", "12B HTN", "101 QUR"];

const now = "2026-06-04";

export const initialState: RecoveryState = {
  role: "founder",
  locale: "en",
  activeApartmentId: "apt-6b-htn",
  apartments: seedCodes.map((code, index) => ({
    id: `apt-${code.toLowerCase().replaceAll(" ", "-")}`,
    code,
    district: code.includes("HTN") ? "HTN" : code.includes("QUR") ? "QUR" : "BMJ / MS",
    status: index < 2 ? "Started" : "Not started",
    archived: false,
    startedAt: index === 0 ? "2025-12-01" : undefined,
    startDateConfidence: index === 0 ? "approximate month" : "unknown",
    furnishing: "unknown",
    operationState: "not sure",
    notes: "",
    lastUpdated: now,
  })),
  expenses: [
    {
      id: "exp-cleaning-6b",
      apartmentId: "apt-6b-htn",
      category: "Cleaning",
      group: "recurring",
      amount: 180,
      amountConfidence: "estimated",
      recurrence: "monthly",
      startDate: "2025-12-01",
      paymentMethod: "Card",
      paidBy: "Founder",
      evidenceStatus: "memory",
      confidence: 3,
      notes: "Probably paid monthly during launch period.",
      reviewStatus: "draft",
      evidenceFiles: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "exp-lock-15c",
      apartmentId: "apt-15c-htn",
      category: "Smart lock",
      group: "setup",
      amount: 650,
      amountConfidence: "exact",
      recurrence: "one-time",
      paymentMethod: "Card",
      paidBy: "Founder",
      evidenceStatus: "receipt",
      confidence: 5,
      notes: "Receipt remembered from supplier chat.",
      reviewStatus: "ready",
      evidenceFiles: ["smart-lock-receipt.jpg"],
      createdAt: now,
      updatedAt: now,
    },
  ],
};

export function formatSar(value: number) {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function expenseAmount(expense: Expense) {
  if (typeof expense.amount === "number") return expense.amount;
  if (typeof expense.amountMin === "number" && typeof expense.amountMax === "number") {
    return Math.round((expense.amountMin + expense.amountMax) / 2);
  }
  return 0;
}

export function recurringMultiplier(expense: Expense) {
  if (expense.recurrence === "monthly") return 6;
  if (expense.recurrence === "weekly") return 26;
  if (expense.recurrence === "per booking") return 12;
  return 1;
}

export function calculatedExpenseTotal(expense: Expense) {
  return expenseAmount(expense) * recurringMultiplier(expense);
}

export function summarizeApartment(apartment: Apartment, expenses: Expense[]) {
  const owned = expenses.filter((expense) => expense.apartmentId === apartment.id);
  const total = owned.reduce((sum, expense) => sum + calculatedExpenseTotal(expense), 0);
  const exact = owned.filter((expense) => expense.amountConfidence === "exact").reduce((sum, expense) => sum + calculatedExpenseTotal(expense), 0);
  const estimated = owned.filter((expense) => expense.amountConfidence === "estimated" || expense.amountConfidence === "range").reduce((sum, expense) => sum + calculatedExpenseTotal(expense), 0);
  const unknown = owned.filter((expense) => expense.amountConfidence === "unknown").length;
  const missingEvidence = owned.filter((expense) => expense.evidenceStatus === "none" || expense.evidenceStatus === "memory").length;
  const lowConfidence = owned.filter((expense) => expense.confidence <= 2).length;
  const ready = owned.filter((expense) => expense.reviewStatus === "ready" || expense.reviewStatus === "approved").length;
  const categoryCount = new Set(owned.map((expense) => expense.category)).size;
  const completion = Math.min(100, Math.round(((categoryCount / 20) * 55) + (owned.length ? 20 : 0) + (apartment.startedAt ? 15 : 0) + (ready ? 10 : 0)));

  return { owned, total, exact, estimated, unknown, missingEvidence, lowConfidence, ready, completion };
}

export function summarizePortfolio(state: RecoveryState) {
  const activeApartments = state.apartments.filter((apartment) => !apartment.archived);
  const summaries = activeApartments.map((apartment) => summarizeApartment(apartment, state.expenses));
  return {
    apartments: activeApartments.length,
    total: summaries.reduce((sum, item) => sum + item.total, 0),
    exact: summaries.reduce((sum, item) => sum + item.exact, 0),
    estimated: summaries.reduce((sum, item) => sum + item.estimated, 0),
    recurring: state.expenses.filter((expense) => expense.recurrence !== "one-time").reduce((sum, item) => sum + calculatedExpenseTotal(item), 0),
    unknown: summaries.reduce((sum, item) => sum + item.unknown, 0),
    missingEvidence: summaries.reduce((sum, item) => sum + item.missingEvidence, 0),
    lowConfidence: summaries.reduce((sum, item) => sum + item.lowConfidence, 0),
    ready: summaries.reduce((sum, item) => sum + item.ready, 0),
    completion: activeApartments.length ? Math.round(summaries.reduce((sum, item) => sum + item.completion, 0) / activeApartments.length) : 0,
  };
}

export function expenseRows(state: RecoveryState) {
  return state.expenses.map((expense) => {
    const apartment = state.apartments.find((item) => item.id === expense.apartmentId);
    return {
      apartment_code: apartment?.code ?? "Unknown",
      district: apartment?.district ?? "",
      category: expense.category,
      group: expense.group,
      amount_sar: expenseAmount(expense),
      calculated_total_sar: calculatedExpenseTotal(expense),
      amount_confidence: expense.amountConfidence,
      recurrence: expense.recurrence,
      payment_method: expense.paymentMethod,
      paid_by: expense.paidBy,
      evidence_status: expense.evidenceStatus,
      memory_confidence: expense.confidence,
      review_status: expense.reviewStatus,
      notes: expense.notes,
      evidence_files: expense.evidenceFiles.join("; "),
    };
  });
}

export function toCsv(rows: Record<string, string | number>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}
