"use client";

import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Download, Home, Plus, Save, ScrollText, WalletCards } from "lucide-react";
import {
  Apartment,
  ApartmentStatus,
  AmountType,
  DidPay,
  Expense,
  ExpenseType,
  PageKey,
  PaymentMethod,
  PaymentSource,
  RecurringType,
  createExpenseFromTemplate,
  calculateExpenseTotal,
  exportRows,
  expenseTemplates,
  formatSar,
  initialState,
  sectionOrder,
  summarizeApartment,
  summarizePortfolio,
  toCsv,
} from "@/lib/expense-recovery";

const storageKey = "ouja-arabic-recovery-v2";

const navItems: { key: PageKey; label: string; icon: typeof Home }[] = [
  { key: "dashboard", label: "لوحة التحكم", icon: Home },
  { key: "apartments", label: "الشقق", icon: WalletCards },
  { key: "rebuild", label: "إعادة بناء", icon: ScrollText },
  { key: "export", label: "التصدير", icon: Download },
];

const didPayOptions: DidPay[] = ["نعم", "لا", "لا أتذكر"];
const expenseTypeOptions: ExpenseType[] = ["مرة واحدة", "متكرر", "لا أتذكر"];
const recurringOptions: RecurringType[] = ["شهري", "أسبوعي", "لكل حجز", "عند الحاجة", "لا أتذكر"];
const amountTypeOptions: AmountType[] = ["مؤكد", "تقديري", "نطاق تقريبي", "لا أتذكر"];
const paymentSourceOptions: PaymentSource[] = ["حساب المؤسس الشخصي", "حساب الشركة", "كاش", "لا أتذكر", "أخرى"];
const paymentMethodOptions: PaymentMethod[] = ["مدى", "بطاقة ائتمانية", "Apple Pay", "تحويل بنكي", "كاش", "لا أتذكر", "أخرى"];
const apartmentStatusOptions: ApartmentStatus[] = ["لم تبدأ", "جاري الإدخال", "شبه مكتملة", "مكتملة"];

export default function ArabicRecoveryApp() {
  const [state, setState] = useState(initialState);
  const [newApartmentCode, setNewApartmentCode] = useState("");
  const [exportApartmentId, setExportApartmentId] = useState("all");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) setState(JSON.parse(saved));
  }, []);

  useEffect(() => {
    setState((current) => ({ ...current, saveStatus: "جاري الحفظ" }));
    const timeout = window.setTimeout(() => {
      setState((current) => {
        window.localStorage.setItem(storageKey, JSON.stringify({ ...current, saveStatus: "تم الحفظ" }));
        return { ...current, saveStatus: "تم الحفظ" };
      });
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [state.apartments, state.expenses, state.activeApartmentId, state.activePage]);

  const activeApartment = state.apartments.find((apartment) => apartment.id === state.activeApartmentId) ?? state.apartments[0];
  const activeSummary = summarizeApartment(activeApartment, state.expenses);
  const portfolio = useMemo(() => summarizePortfolio(state), [state]);
  const filteredRows = useMemo(() => exportRows(state, exportApartmentId), [state, exportApartmentId]);

  function setPage(activePage: PageKey) {
    setState((current) => ({ ...current, activePage }));
  }

  function updateApartment(apartmentId: string, patch: Partial<Apartment>) {
    setState((current) => ({
      ...current,
      apartments: current.apartments.map((apartment) =>
        apartment.id === apartmentId ? { ...apartment, ...patch, updatedAt: new Date().toISOString().slice(0, 10) } : apartment,
      ),
    }));
  }

  function updateExpense(expenseId: string, patch: Partial<Expense>) {
    setState((current) => ({
      ...current,
      expenses: current.expenses.map((expense) => {
        if (expense.id !== expenseId) return expense;
        const next = { ...expense, ...patch, updatedAt: new Date().toISOString().slice(0, 10) };
        return { ...next, totalCalculatedAmountSar: calculateExpenseTotal(next) };
      }),
    }));
  }

  function addApartment() {
    const code = newApartmentCode.trim();
    if (!code) return;
    const id = `apt-${code.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    const date = new Date().toISOString().slice(0, 10);
    const apartment: Apartment = {
      id,
      code,
      district: "",
      project: "",
      startDate: "",
      startDateCertainty: "لا أتذكر",
      furnishedStatus: "لا أتذكر",
      status: "لم تبدأ",
      notes: "",
      createdAt: date,
      updatedAt: date,
      archivedAt: null,
    };
    const expenses = expenseTemplates.map((template) => ({ ...createExpenseFromTemplate(id, template), createdAt: date, updatedAt: date }));
    setState((current) => ({ ...current, apartments: [...current.apartments, apartment], expenses: [...current.expenses, ...expenses], activeApartmentId: id, activePage: "rebuild" }));
    setNewApartmentCode("");
  }

  function downloadCsv() {
    downloadBlob(new Blob(["\uFEFF" + toCsv(filteredRows)], { type: "text/csv;charset=utf-8" }), "تصدير-مصاريف-الشقق.csv");
  }

  async function downloadXlsx() {
    const xlsx = await import("xlsx");
    const worksheet = xlsx.utils.json_to_sheet(filteredRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "تصدير المصاريف");
    const output = xlsx.write(workbook, { type: "array", bookType: "xlsx" });
    downloadBlob(new Blob([output], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "تصدير-مصاريف-الشقق.xlsx");
  }

  return (
    <main dir="rtl" className="min-h-screen text-right">
      <div className="mx-auto flex min-h-screen max-w-[1540px] flex-col lg:flex-row-reverse">
        <aside className="hidden w-72 border-l border-line bg-surface/94 p-5 lg:block">
          <div className="sticky top-5">
            <h1 className="text-2xl font-black leading-tight text-ink">استعادة مصاريف الشقق</h1>
            <p className="mt-2 text-sm leading-6 text-muted">نموذج عربي طويل يساعدك تتذكر المصاريف بدون تعقيد.</p>
            <nav className="mt-7 grid gap-2">
              {navItems.map((item) => <NavButton key={item.key} item={item} active={state.activePage === item.key} onClick={() => setPage(item.key)} />)}
            </nav>
            <div className="mt-7 rounded-2xl border border-line bg-canvas p-4">
              <p className="text-sm font-black">الحفظ التلقائي</p>
              <p className="mt-2 text-lg font-black text-brand">{state.saveStatus}</p>
            </div>
          </div>
        </aside>

        <section className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black text-brand">Google Form على steroids</p>
              <h2 className="mt-1 text-3xl font-black text-ink">{navItems.find((item) => item.key === state.activePage)?.label}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-muted w-auto" onClick={() => setState((current) => ({ ...current, saveStatus: "تم الحفظ" }))}>
                <Save size={18} /> حفظ
              </button>
              <button className="btn-primary w-auto" onClick={() => setPage("rebuild")}>
                <Plus size={18} /> إضافة مصروف سريع
              </button>
            </div>
          </header>

          {state.activePage === "dashboard" && (
            <Dashboard state={state} portfolio={portfolio} setPage={setPage} setActiveApartment={(id) => setState((current) => ({ ...current, activeApartmentId: id }))} />
          )}
          {state.activePage === "apartments" && (
            <ApartmentsPage
              state={state}
              newApartmentCode={newApartmentCode}
              setNewApartmentCode={setNewApartmentCode}
              addApartment={addApartment}
              updateApartment={updateApartment}
              openApartment={(id) => setState((current) => ({ ...current, activeApartmentId: id, activePage: "rebuild" }))}
            />
          )}
          {state.activePage === "rebuild" && (
            <RebuildPage
              state={state}
              apartment={activeApartment}
              summary={activeSummary}
              updateApartment={updateApartment}
              updateExpense={updateExpense}
              setActiveApartment={(id) => setState((current) => ({ ...current, activeApartmentId: id }))}
              goApartments={() => setPage("apartments")}
              exportApartment={() => {
                setExportApartmentId(activeApartment.id);
                setPage("export");
              }}
            />
          )}
          {state.activePage === "export" && (
            <ExportPage state={state} rows={filteredRows} exportApartmentId={exportApartmentId} setExportApartmentId={setExportApartmentId} downloadCsv={downloadCsv} downloadXlsx={downloadXlsx} />
          )}
        </section>
      </div>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-line bg-surface/96 px-2 py-2 backdrop-blur lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = state.activePage === item.key;
          return (
            <button key={item.key} className={`grid place-items-center gap-1 rounded-xl px-1 py-2 text-xs font-black ${active ? "bg-brand text-white" : "text-muted"}`} onClick={() => setPage(item.key)}>
              <Icon size={19} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </main>
  );
}

function Dashboard({ state, portfolio, setPage, setActiveApartment }: { state: typeof initialState; portfolio: ReturnType<typeof summarizePortfolio>; setPage: (page: PageKey) => void; setActiveApartment: (id: string) => void }) {
  const metrics = [
    ["إجمالي المصاريف", formatSar(portfolio.total)],
    ["المصاريف المؤكدة", formatSar(portfolio.exact)],
    ["المصاريف التقديرية", formatSar(portfolio.estimated)],
    ["المصاريف المتكررة", formatSar(portfolio.recurring)],
    ["عدد الشقق", String(portfolio.apartments)],
    ["الشقق المكتملة", String(portfolio.completed)],
    ["آخر تحديث", portfolio.lastUpdated],
  ];

  return (
    <div className="mt-5 space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-sm font-black text-muted">{label}</p>
            <p className="mt-2 text-2xl font-black text-ink">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {state.apartments.filter((apartment) => !apartment.archivedAt).map((apartment) => {
          const summary = summarizeApartment(apartment, state.expenses);
          return <ApartmentCard key={apartment.id} apartment={apartment} summary={summary} onOpen={() => { setActiveApartment(apartment.id); setPage("rebuild"); }} />;
        })}
      </div>
    </div>
  );
}

function ApartmentsPage(props: {
  state: typeof initialState;
  newApartmentCode: string;
  setNewApartmentCode: (value: string) => void;
  addApartment: () => void;
  updateApartment: (id: string, patch: Partial<Apartment>) => void;
  openApartment: (id: string) => void;
}) {
  return (
    <div className="mt-5 space-y-4">
      <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4 md:grid-cols-[1fr_auto] md:items-end">
        <Field label="إضافة شقة">
          <input className="input" value={props.newApartmentCode} onChange={(event) => props.setNewApartmentCode(event.target.value)} placeholder="مثال: 14A HTN" />
        </Field>
        <button className="btn-primary md:w-auto" onClick={props.addApartment}><Plus size={18} /> إضافة شقة</button>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {props.state.apartments.map((apartment) => {
          const summary = summarizeApartment(apartment, props.state.expenses);
          return (
            <div key={apartment.id} className={apartment.archivedAt ? "opacity-50" : ""}>
              <ApartmentCard apartment={apartment} summary={summary} onOpen={() => props.openApartment(apartment.id)} />
              <div className="mt-2 grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2">
                <Field label="تعديل اسم الشقة">
                  <input className="input" value={apartment.code} onChange={(event) => props.updateApartment(apartment.id, { code: event.target.value })} />
                </Field>
                <Field label="حالة الإدخال">
                  <select className="input" value={apartment.status} onChange={(event) => props.updateApartment(apartment.id, { status: event.target.value as ApartmentStatus })}>
                    {apartmentStatusOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
                <Field label="الحي / المشروع">
                  <input className="input" value={apartment.district} onChange={(event) => props.updateApartment(apartment.id, { district: event.target.value })} />
                </Field>
                <button className="btn-muted self-end" onClick={() => props.updateApartment(apartment.id, { archivedAt: apartment.archivedAt ? null : new Date().toISOString().slice(0, 10) })}>
                  {apartment.archivedAt ? "استرجاع الشقة" : "أرشفة شقة"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RebuildPage(props: {
  state: typeof initialState;
  apartment: Apartment;
  summary: ReturnType<typeof summarizeApartment>;
  updateApartment: (id: string, patch: Partial<Apartment>) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  setActiveApartment: (id: string) => void;
  goApartments: () => void;
  exportApartment: () => void;
}) {
  const expenses = props.state.expenses.filter((expense) => expense.apartmentId === props.apartment.id && !expense.archivedAt);

  return (
    <div className="mt-5 space-y-5">
      <div className="sticky top-3 z-30 rounded-2xl border border-line bg-ink p-4 text-white shadow-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-white/70">نموذج الشقة الطويل</p>
            <h2 className="text-3xl font-black">{props.apartment.code}</h2>
            <p className="mt-1 text-sm text-white/76">تم الحفظ تلقائياً. جاوب نعم / لا / لا أتذكر واترك الباقي فاضي.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-xl bg-white px-4 py-3 text-sm font-black text-ink"><Save size={18} className="inline" /> حفظ</button>
            <button className="rounded-xl bg-mint px-4 py-3 text-sm font-black text-ink"><Plus size={18} className="inline" /> إضافة مصروف سريع</button>
          </div>
        </div>
        <Progress value={props.summary.completion} light />
      </div>

      <section className="rounded-2xl border border-line bg-surface p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="اختر الشقة">
            <select className="input" value={props.apartment.id} onChange={(event) => props.setActiveApartment(event.target.value)}>
              {props.state.apartments.filter((apartment) => !apartment.archivedAt).map((apartment) => <option key={apartment.id} value={apartment.id}>{apartment.code}</option>)}
            </select>
          </Field>
          <Field label="رمز الشقة">
            <input className="input" value={props.apartment.code} onChange={(event) => props.updateApartment(props.apartment.id, { code: event.target.value })} />
          </Field>
          <Field label="الحي / المشروع">
            <input className="input" value={props.apartment.district} onChange={(event) => props.updateApartment(props.apartment.id, { district: event.target.value })} />
          </Field>
          <Field label="تاريخ بداية الشقة">
            <input className="input" type="date" value={props.apartment.startDate} onChange={(event) => props.updateApartment(props.apartment.id, { startDate: event.target.value })} />
          </Field>
          <Choice label="دقة التاريخ" value={props.apartment.startDateCertainty} options={["تاريخ مؤكد", "شهر تقريبي", "لا أتذكر"]} onChange={(value) => props.updateApartment(props.apartment.id, { startDateCertainty: value as Apartment["startDateCertainty"] })} />
          <Choice label="حالة الشقة عند الاستلام" value={props.apartment.furnishedStatus} options={["فاضية", "مفروشة جزئياً", "مفروشة بالكامل", "لا أتذكر"]} onChange={(value) => props.updateApartment(props.apartment.id, { furnishedStatus: value as Apartment["furnishedStatus"] })} />
          <Field label="ملاحظات عامة">
            <textarea className="input min-h-28" value={props.apartment.notes} onChange={(event) => props.updateApartment(props.apartment.id, { notes: event.target.value })} placeholder="أي شيء تتذكره عن الشقة..." />
          </Field>
        </div>
      </section>

      {sectionOrder.map((section) => (
        <section key={section} className="space-y-3">
          <div className="rounded-2xl bg-brand p-4 text-white">
            <h3 className="text-2xl font-black">{section}</h3>
            <p className="mt-1 text-sm text-white/78">كل الكروت موجودة قدامك. لا تحتاج تضيف تصنيفات بنفسك.</p>
          </div>
          <div className="grid gap-3">
            {expenses.filter((expense) => expense.section === section).map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} updateExpense={props.updateExpense} />
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="text-2xl font-black">ملخص الشقة</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Mini label="إجمالي مصاريف الشقة" value={formatSar(props.summary.total)} />
          <Mini label="إجمالي المصاريف المؤكدة" value={formatSar(props.summary.exact)} />
          <Mini label="إجمالي المصاريف التقديرية" value={formatSar(props.summary.estimated)} />
          <Mini label="إجمالي الشهرية المحسوبة" value={formatSar(props.summary.recurring)} />
          <Mini label="لا أتذكر مبلغها" value={String(props.summary.unknownAmount)} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-primary w-auto"><Save size={18} /> حفظ</button>
          <button className="btn-muted w-auto" onClick={props.exportApartment}><Download size={18} /> تصدير هذه الشقة</button>
          <button className="btn-muted w-auto" onClick={props.goApartments}>الرجوع للشقق</button>
        </div>
      </section>
    </div>
  );
}

function ExpenseCard({ expense, updateExpense }: { expense: Expense; updateExpense: (id: string, patch: Partial<Expense>) => void }) {
  const template = expenseTemplates.find((item) => item.section === expense.section && item.itemName === expense.itemName);
  const shouldShowRanges = expense.didPay === "لا أتذكر" || expense.amountType === "تقديري" || expense.amountType === "نطاق تقريبي";
  const total = calculateExpenseTotal(expense);

  function handleNumber(event: ChangeEvent<HTMLInputElement>, key: "amountSar" | "minAmountSar" | "maxAmountSar" | "numberOfPeriods") {
    updateExpense(expense.id, { [key]: event.target.value ? Number(event.target.value) : null });
  }

  return (
    <article className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-black text-muted">{expense.section}</p>
          <h4 className="mt-1 text-2xl font-black text-ink">{expense.itemName}</h4>
        </div>
        <p className="rounded-full bg-canvas px-3 py-1 text-sm font-black text-ink">{formatSar(total)}</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Choice label={expense.section === "المصاريف الشهرية والمتكررة" ? "هل هذا المصروف موجود؟" : expense.section === "الأثاث" ? "هل اشتريته؟" : "هل دفعت هذا المصروف؟"} value={expense.didPay} options={didPayOptions} onChange={(value) => updateExpense(expense.id, { didPay: value as DidPay })} />
        <Choice label="نوع المصروف" value={expense.expenseType} options={expenseTypeOptions} onChange={(value) => updateExpense(expense.id, { expenseType: value as ExpenseType })} />
        <Field label="المبلغ">
          <input className="input" type="number" min="0" value={expense.amountSar ?? ""} onChange={(event) => handleNumber(event, "amountSar")} placeholder="ريال" />
        </Field>
        <Choice label="نوع المبلغ" value={expense.amountType} options={amountTypeOptions} onChange={(value) => updateExpense(expense.id, { amountType: value as AmountType })} />
        <Field label="أقل مبلغ">
          <input className="input" type="number" min="0" value={expense.minAmountSar ?? ""} onChange={(event) => handleNumber(event, "minAmountSar")} placeholder="إذا كان نطاق" />
        </Field>
        <Field label="أعلى مبلغ">
          <input className="input" type="number" min="0" value={expense.maxAmountSar ?? ""} onChange={(event) => handleNumber(event, "maxAmountSar")} placeholder="إذا كان نطاق" />
        </Field>

        {expense.expenseType === "متكرر" && (
          <>
            <Choice label="هل هو" value={expense.recurringType} options={recurringOptions} onChange={(value) => updateExpense(expense.id, { recurringType: value as RecurringType })} />
            <Field label="متى بدأ؟">
              <input className="input" type="date" value={expense.startDate} onChange={(event) => updateExpense(expense.id, { startDate: event.target.value })} />
            </Field>
            <Field label="متى انتهى؟">
              <input className="input" type="date" value={expense.endDate} onChange={(event) => updateExpense(expense.id, { endDate: event.target.value, isStillActive: false })} disabled={expense.isStillActive} />
            </Field>
            <Choice label="حالة النهاية" value={expense.isStillActive ? "ما زال مستمر" : expense.endDateCertainty} options={["ما زال مستمر", "انتهى بتاريخ", "لا أتذكر"]} onChange={(value) => updateExpense(expense.id, { isStillActive: value === "ما زال مستمر", endDateCertainty: value === "انتهى بتاريخ" ? "تاريخ مؤكد" : "لا أتذكر" })} />
            <Field label="عدد الأشهر أو المرات">
              <input className="input" type="number" min="0" value={expense.numberOfPeriods ?? ""} onChange={(event) => handleNumber(event, "numberOfPeriods")} />
            </Field>
            <div className="rounded-xl bg-canvas p-3">
              <p className="text-sm font-black text-muted">الإجمالي المحسوب</p>
              <p className="mt-1 text-xl font-black">{formatSar(total)}</p>
              <p className="mt-1 text-sm text-muted">مثال: {formatSar(expense.amountSar ?? 0)} × {expense.numberOfPeriods || 1} أشهر = {formatSar(total)}</p>
            </div>
          </>
        )}

        <Choice label="من وين اندفع؟" value={expense.paymentSource} options={paymentSourceOptions} onChange={(value) => updateExpense(expense.id, { paymentSource: value as PaymentSource })} />
        {expense.paymentSource === "أخرى" && (
          <Field label="اكتب مصدر الدفع">
            <input className="input" value={expense.paymentSourceOther} onChange={(event) => updateExpense(expense.id, { paymentSourceOther: event.target.value })} />
          </Field>
        )}
        <Choice label="طريقة الدفع" value={expense.paymentMethod} options={paymentMethodOptions} onChange={(value) => updateExpense(expense.id, { paymentMethod: value as PaymentMethod })} />
        {expense.paymentMethod === "أخرى" && (
          <Field label="اكتب طريقة الدفع">
            <input className="input" value={expense.paymentMethodOther} onChange={(event) => updateExpense(expense.id, { paymentMethodOther: event.target.value })} />
          </Field>
        )}

        {expense.itemName === "تلفزيون" && (
          <>
            <Field label="حجم التلفزيون">
              <select className="input" value={extractTvValue(expense.description, "الحجم")} onChange={(event) => updateExpense(expense.id, { description: setTvValue(expense.description, "الحجم", event.target.value) })}>
                {["65 بوصة", "85 بوصة", "لا أتذكر", "أخرى"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="الماركة">
              <select className="input" value={extractTvValue(expense.description, "الماركة")} onChange={(event) => updateExpense(expense.id, { description: setTvValue(expense.description, "الماركة", event.target.value) })}>
                {["Samsung", "LG", "TCL", "لا أتذكر", "أخرى"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
          </>
        )}

        <Field label="ملاحظات">
          <textarea className="input min-h-24" value={expense.notes} onChange={(event) => updateExpense(expense.id, { notes: event.target.value })} placeholder="اكتب أي شيء يساعدك تتذكر..." />
        </Field>
      </div>

      {shouldShowRanges && template?.suggestions?.length ? (
        <div className="mt-4 rounded-2xl bg-canvas p-3">
          <p className="font-black text-ink">اختر أقرب نطاق تقريبي</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {template.suggestions.slice(0, 8).map((range) => (
              <button key={range.label} className="rounded-xl border border-line bg-surface px-3 py-2 text-sm font-black text-ink" onClick={() => updateExpense(expense.id, { minAmountSar: range.min, maxAmountSar: range.max, amountSar: null, amountType: "نطاق تقريبي", didPay: "نعم" })}>
                {range.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ExportPage(props: { state: typeof initialState; rows: Record<string, string | number>[]; exportApartmentId: string; setExportApartmentId: (id: string) => void; downloadCsv: () => void; downloadXlsx: () => void }) {
  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="text-2xl font-black">تصدير بسيط</h3>
        <p className="mt-2 text-sm leading-6 text-muted">اختر كل الشقق أو شقة محددة، ثم صدّر Excel أو CSV.</p>
        <div className="mt-4 grid gap-3">
          <Field label="كل الشقق / شقة محددة">
            <select className="input" value={props.exportApartmentId} onChange={(event) => props.setExportApartmentId(event.target.value)}>
              <option value="all">كل الشقق</option>
              {props.state.apartments.map((apartment) => <option key={apartment.id} value={apartment.id}>{apartment.code}</option>)}
            </select>
          </Field>
          <Field label="من تاريخ">
            <input className="input" type="date" />
          </Field>
          <Field label="إلى تاريخ">
            <input className="input" type="date" />
          </Field>
          <Field label="نوع المصروف">
            <select className="input">
              {["كل المصاريف", "مرة واحدة", "متكرر", "شهري"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <button className="btn-primary" onClick={props.downloadXlsx}><Download size={18} /> تصدير Excel</button>
          <button className="btn-muted" onClick={props.downloadCsv}><Download size={18} /> تصدير CSV</button>
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-right text-sm">
            <thead className="bg-canvas">
              <tr>{Object.keys(props.rows[0] ?? { "لا يوجد": "" }).map((header) => <th key={header} className="p-3 font-black">{header}</th>)}</tr>
            </thead>
            <tbody>
              {props.rows.map((row, index) => (
                <tr key={index} className="border-t border-line">
                  {Object.values(row).map((value, cellIndex) => <td key={cellIndex} className="p-3">{value}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ApartmentCard({ apartment, summary, onOpen }: { apartment: Apartment; summary: ReturnType<typeof summarizeApartment>; onOpen: () => void }) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-muted">رمز الشقة</p>
          <h3 className="text-3xl font-black text-ink">{apartment.code}</h3>
          <p className="mt-1 text-sm text-muted">{apartment.district || "بدون حي"} {apartment.project ? `/ ${apartment.project}` : ""}</p>
        </div>
        <span className="rounded-full bg-canvas px-3 py-1 text-xs font-black text-ink">{apartment.status}</span>
      </div>
      <Progress value={summary.completion} />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Mini label="إجمالي المصاريف" value={formatSar(summary.total)} />
        <Mini label="آخر تعديل" value={apartment.updatedAt} />
      </div>
      <button className="btn-primary mt-4" onClick={onOpen}>إعادة بناء الشقة</button>
    </article>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-black text-ink">
      {label}
      {children}
    </label>
  );
}

function Choice({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div>
      <p className="text-sm font-black text-ink">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button key={option} className={`rounded-xl px-3 py-2 text-sm font-black ${value === option ? "bg-brand text-white" : "border border-line bg-canvas text-ink"}`} onClick={() => onChange(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function NavButton({ item, active, onClick }: { item: { label: string; icon: typeof Home }; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-black ${active ? "bg-brand text-white" : "text-ink hover:bg-canvas"}`} onClick={onClick}>
      <Icon size={19} />
      {item.label}
    </button>
  );
}

function Progress({ value, light = false }: { value: number; light?: boolean }) {
  return (
    <div className="mt-4">
      <div className={`mb-2 flex items-center justify-between text-sm font-black ${light ? "text-white" : "text-ink"}`}>
        <span>نسبة الاكتمال</span>
        <span>{value}%</span>
      </div>
      <div className={`h-3 overflow-hidden rounded-full ${light ? "bg-white/18" : "bg-canvas"}`}>
        <div className={`h-full rounded-full ${light ? "bg-mint" : "bg-brand"}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-canvas p-3">
      <p className="text-xs font-black text-muted">{label}</p>
      <p className="mt-1 text-lg font-black text-ink">{value}</p>
    </div>
  );
}

function extractTvValue(description: string, key: "الحجم" | "الماركة") {
  const match = description.match(new RegExp(`${key}: ([^،]+)`));
  return match?.[1] ?? "لا أتذكر";
}

function setTvValue(description: string, key: "الحجم" | "الماركة", value: string) {
  const size = key === "الحجم" ? value : extractTvValue(description, "الحجم");
  const brand = key === "الماركة" ? value : extractTvValue(description, "الماركة");
  return `الحجم: ${size}، الماركة: ${brand}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
