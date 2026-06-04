import type { Apartment, Expense, RecoveryState } from "@/lib/expense-recovery";
import { ensureExpensesForApartments } from "@/lib/expense-recovery";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type ApartmentRow = {
  id: string;
  code: string;
  district: string;
  project: string;
  start_date: string | null;
  start_date_certainty: Apartment["startDateCertainty"];
  furnished_status: Apartment["furnishedStatus"];
  status: Apartment["status"];
  notes: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type ExpenseRow = {
  id: string;
  apartment_id: string;
  section: string;
  item_name: string;
  description: string;
  did_pay: Expense["didPay"];
  expense_type: Expense["expenseType"];
  recurring_type: Expense["recurringType"];
  start_date: string | null;
  start_date_certainty: Expense["startDateCertainty"];
  end_date: string | null;
  end_date_certainty: Expense["endDateCertainty"];
  is_still_active: boolean;
  amount_sar: number | null;
  amount_type: Expense["amountType"];
  min_amount_sar: number | null;
  max_amount_sar: number | null;
  number_of_periods: number | null;
  total_calculated_amount_sar: number;
  payment_source: Expense["paymentSource"];
  payment_source_other: string;
  payment_method: Expense["paymentMethod"];
  payment_method_other: string;
  notes: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export async function loadRecoveryFromSupabase(seed: RecoveryState) {
  const supabase = getSupabaseBrowserClient();
  const [{ data: apartmentRows, error: apartmentError }, { data: expenseRows, error: expenseError }] = await Promise.all([
    supabase.from("apartments").select("*").order("created_at", { ascending: true }),
    supabase.from("expenses").select("*").order("section", { ascending: true }),
  ]);

  if (apartmentError) throw apartmentError;
  if (expenseError) throw expenseError;

  if (!apartmentRows?.length) {
    await saveRecoveryToSupabase(seed);
    return seed;
  }

  const apartments = (apartmentRows as ApartmentRow[]).map(fromApartmentRow);
  const loadedExpenses = (expenseRows as ExpenseRow[] | null ?? []).map(fromExpenseRow);
  const expenses = ensureExpensesForApartments(apartments, loadedExpenses);

  return {
    ...seed,
    activeApartmentId: apartments[0]?.id ?? seed.activeApartmentId,
    apartments,
    expenses,
    saveStatus: "تم الحفظ" as const,
  };
}

export async function saveRecoveryToSupabase(state: RecoveryState) {
  const supabase = getSupabaseBrowserClient();
  const { error: apartmentError } = await supabase.from("apartments").upsert(state.apartments.map(toApartmentRow), { onConflict: "id" });
  if (apartmentError) throw apartmentError;

  const { error: expenseError } = await supabase.from("expenses").upsert(state.expenses.map(toExpenseRow), { onConflict: "id" });
  if (expenseError) throw expenseError;
}

function emptyToNull(value: string) {
  return value.trim() ? value : null;
}

function nullToEmpty(value: string | null) {
  return value ?? "";
}

function toApartmentRow(apartment: Apartment): ApartmentRow {
  return {
    id: apartment.id,
    code: apartment.code,
    district: apartment.district,
    project: apartment.project,
    start_date: emptyToNull(apartment.startDate),
    start_date_certainty: apartment.startDateCertainty,
    furnished_status: apartment.furnishedStatus,
    status: apartment.status,
    notes: apartment.notes,
    created_at: apartment.createdAt,
    updated_at: apartment.updatedAt,
    archived_at: apartment.archivedAt,
  };
}

function fromApartmentRow(row: ApartmentRow): Apartment {
  return {
    id: row.id,
    code: row.code,
    district: row.district,
    project: row.project,
    startDate: nullToEmpty(row.start_date),
    startDateCertainty: row.start_date_certainty,
    furnishedStatus: row.furnished_status,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at.slice(0, 10),
    updatedAt: row.updated_at.slice(0, 10),
    archivedAt: row.archived_at ? row.archived_at.slice(0, 10) : null,
  };
}

function toExpenseRow(expense: Expense): ExpenseRow {
  return {
    id: expense.id,
    apartment_id: expense.apartmentId,
    section: expense.section,
    item_name: expense.itemName,
    description: expense.description,
    did_pay: expense.didPay,
    expense_type: expense.expenseType,
    recurring_type: expense.recurringType,
    start_date: emptyToNull(expense.startDate),
    start_date_certainty: expense.startDateCertainty,
    end_date: emptyToNull(expense.endDate),
    end_date_certainty: expense.endDateCertainty,
    is_still_active: expense.isStillActive,
    amount_sar: expense.amountSar,
    amount_type: expense.amountType,
    min_amount_sar: expense.minAmountSar,
    max_amount_sar: expense.maxAmountSar,
    number_of_periods: expense.numberOfPeriods,
    total_calculated_amount_sar: expense.totalCalculatedAmountSar,
    payment_source: expense.paymentSource,
    payment_source_other: expense.paymentSourceOther,
    payment_method: expense.paymentMethod,
    payment_method_other: expense.paymentMethodOther,
    notes: expense.notes,
    created_at: expense.createdAt,
    updated_at: expense.updatedAt,
    archived_at: expense.archivedAt,
  };
}

function fromExpenseRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    apartmentId: row.apartment_id,
    section: row.section,
    itemName: row.item_name,
    description: row.description,
    didPay: row.did_pay,
    expenseType: row.expense_type,
    recurringType: row.recurring_type,
    startDate: nullToEmpty(row.start_date),
    startDateCertainty: row.start_date_certainty,
    endDate: nullToEmpty(row.end_date),
    endDateCertainty: row.end_date_certainty,
    isStillActive: row.is_still_active,
    amountSar: row.amount_sar,
    amountType: row.amount_type,
    minAmountSar: row.min_amount_sar,
    maxAmountSar: row.max_amount_sar,
    numberOfPeriods: row.number_of_periods,
    totalCalculatedAmountSar: row.total_calculated_amount_sar,
    paymentSource: row.payment_source,
    paymentSourceOther: row.payment_source_other,
    paymentMethod: row.payment_method,
    paymentMethodOther: row.payment_method_other,
    notes: row.notes,
    createdAt: row.created_at.slice(0, 10),
    updatedAt: row.updated_at.slice(0, 10),
    archivedAt: row.archived_at ? row.archived_at.slice(0, 10) : null,
  };
}
