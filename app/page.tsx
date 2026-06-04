"use client";

import {
  Archive,
  Banknote,
  Check,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  Home,
  Languages,
  Menu,
  Plus,
  ReceiptText,
  Save,
  SearchCheck,
  Settings,
  Sparkles,
  Upload,
  WalletCards,
} from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Apartment,
  ApartmentStatus,
  AmountConfidence,
  EvidenceStatus,
  Expense,
  LocaleCode,
  RecoveryState,
  Recurrence,
  ReviewStatus,
  Role,
  expenseRows,
  formatSar,
  initialState,
  recurringCategories,
  setupCategories,
  summarizeApartment,
  summarizePortfolio,
  toCsv,
} from "@/lib/expense-recovery";

type Section = "Dashboard" | "Apartments" | "Rebuild" | "Monthly Costs" | "Evidence" | "Finance Review" | "Export" | "Settings";

const storageKey = "ouja-founder-expense-recovery-v1";

const nav: { label: Section; icon: typeof Home }[] = [
  { label: "Dashboard", icon: Home },
  { label: "Apartments", icon: WalletCards },
  { label: "Rebuild", icon: Sparkles },
  { label: "Monthly Costs", icon: Banknote },
  { label: "Evidence", icon: Upload },
  { label: "Finance Review", icon: ClipboardCheck },
  { label: "Export", icon: FileSpreadsheet },
  { label: "Settings", icon: Settings },
];

const statusOptions: ApartmentStatus[] = ["Not started", "Started", "Needs memory", "Needs evidence", "Ready for finance", "Reviewed"];
const evidenceOptions: EvidenceStatus[] = ["none", "memory", "receipt", "bank", "invoice", "requested"];
const amountConfidenceOptions: AmountConfidence[] = ["exact", "estimated", "range", "unknown"];
const recurrenceOptions: Recurrence[] = ["one-time", "monthly", "weekly", "per booking", "every time needed", "not sure"];
const reviewOptions: ReviewStatus[] = ["draft", "ready", "approved", "rejected", "needs evidence"];

const copy = {
  en: {
    appName: "Ouja Founder Expense Recovery",
    subtitle: "Rebuild the first six months from memory, estimates, proof, and finance review.",
    quickAdd: "Quick add",
    save: "Save changes",
    rebuild: "Rebuild this apartment",
    emptyHint: "No worries, estimate it for now. You can come back later.",
  },
  ar: {
    appName: "استعادة مصاريف مؤسس أوجا",
    subtitle: "إعادة بناء أول ستة أشهر من الذاكرة والتقدير والمرفقات ومراجعة المالية.",
    quickAdd: "إضافة سريعة",
    save: "حفظ التغييرات",
    rebuild: "ابدأ إعادة البناء",
    emptyHint: "لا بأس، قدّرها الآن ويمكنك تعديلها لاحقا.",
  },
};

export default function HomePage() {
  const [state, setState] = useState<RecoveryState>(initialState);
  const [section, setSection] = useState<Section>("Dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [draftExpense, setDraftExpense] = useState(() => createExpense(initialState.activeApartmentId, "Furniture", "setup"));
  const [newApartmentCode, setNewApartmentCode] = useState("");
  const t = copy[state.locale];

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) setState(JSON.parse(saved) as RecoveryState);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const activeApartment = state.apartments.find((apartment) => apartment.id === state.activeApartmentId) ?? state.apartments[0];
  const activeSummary = summarizeApartment(activeApartment, state.expenses);
  const portfolio = useMemo(() => summarizePortfolio(state), [state]);
  const rows = useMemo(() => expenseRows(state), [state]);
  const canEdit = state.role === "founder";
  const canReview = state.role === "finance" || state.role === "founder";

  function updateState(mutator: (current: RecoveryState) => RecoveryState) {
    setState((current) => mutator(current));
  }

  function updateApartment(id: string, patch: Partial<Apartment>) {
    updateState((current) => ({
      ...current,
      apartments: current.apartments.map((apartment) =>
        apartment.id === id ? { ...apartment, ...patch, lastUpdated: new Date().toISOString().slice(0, 10) } : apartment,
      ),
    }));
  }

  function addApartment() {
    const code = newApartmentCode.trim();
    if (!code || !canEdit) return;
    const id = `apt-${code.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    updateState((current) => ({
      ...current,
      activeApartmentId: id,
      apartments: [
        ...current.apartments,
        {
          id,
          code,
          district: "New",
          status: "Not started",
          archived: false,
          startDateConfidence: "unknown",
          furnishing: "unknown",
          operationState: "not sure",
          notes: "",
          lastUpdated: new Date().toISOString().slice(0, 10),
        },
      ],
    }));
    setNewApartmentCode("");
  }

  function saveExpense(expense: Expense) {
    if (!canEdit) return;
    updateState((current) => ({
      ...current,
      expenses: current.expenses.some((item) => item.id === expense.id)
        ? current.expenses.map((item) => (item.id === expense.id ? { ...expense, updatedAt: new Date().toISOString().slice(0, 10) } : item))
        : [...current.expenses, { ...expense, updatedAt: new Date().toISOString().slice(0, 10) }],
    }));
    setDraftExpense(createExpense(activeApartment.id, expense.group === "recurring" ? "Cleaning" : "Furniture", expense.group));
  }

  function updateReview(expenseId: string, reviewStatus: ReviewStatus) {
    if (!canReview) return;
    updateState((current) => ({
      ...current,
      expenses: current.expenses.map((expense) => (expense.id === expenseId ? { ...expense, reviewStatus, updatedAt: new Date().toISOString().slice(0, 10) } : expense)),
    }));
  }

  function attachFiles(expenseId: string, event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).map((file) => file.name);
    if (!files.length || !canEdit) return;
    updateState((current) => ({
      ...current,
      expenses: current.expenses.map((expense) =>
        expense.id === expenseId
          ? {
              ...expense,
              evidenceFiles: Array.from(new Set([...expense.evidenceFiles, ...files])),
              evidenceStatus: expense.evidenceStatus === "none" ? "receipt" : expense.evidenceStatus,
            }
          : expense,
      ),
    }));
  }

  function downloadCsv() {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, "ouja-founder-expense-recovery.csv");
  }

  async function downloadXlsx() {
    const xlsx = await import("xlsx");
    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Finance Review");
    const output = xlsx.write(workbook, { type: "array", bookType: "xlsx" });
    downloadBlob(new Blob([output], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "ouja-founder-expense-recovery.xlsx");
  }

  return (
    <main className={state.locale === "ar" ? "arabic min-h-screen" : "min-h-screen"}>
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col lg:flex-row">
        <aside className="sticky top-0 z-30 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur lg:h-screen lg:w-72 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="flex items-center justify-between gap-3">
            <button className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white lg:hidden" onClick={() => setMobileNavOpen((value) => !value)} aria-label="Open navigation">
              <Menu size={22} />
            </button>
            <div>
              <p className="text-lg font-black leading-tight text-ink">{t.appName}</p>
              <p className="mt-1 max-w-[28ch] text-sm leading-snug text-muted">{t.subtitle}</p>
            </div>
          </div>

          <nav className={`${mobileNavOpen ? "grid" : "hidden"} mt-5 gap-2 lg:grid`}>
            {nav.map((item) => {
              const Icon = item.icon;
              const active = section === item.label;
              return (
                <button
                  key={item.label}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${active ? "bg-brand text-white shadow-soft" : "text-ink hover:bg-canvas"}`}
                  onClick={() => {
                    setSection(item.label);
                    setMobileNavOpen(false);
                  }}
                >
                  <Icon size={19} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-6 hidden rounded-2xl border border-line bg-canvas p-4 lg:block">
            <p className="text-sm font-black">Source of truth</p>
            <p className="mt-2 text-sm leading-6 text-muted">Database first. CSV, XLSX, and Google Sheets are exports for finance review only.</p>
          </div>
        </aside>

        <section className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-brand">Founder memory recovery</p>
              <h1 className="mt-1 text-3xl font-black tracking-normal text-ink sm:text-4xl">{section}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented
                value={state.role}
                options={["founder", "finance", "viewer"]}
                onChange={(role) => updateState((current) => ({ ...current, role: role as Role }))}
              />
              <button className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-bold text-ink" onClick={() => updateState((current) => ({ ...current, locale: current.locale === "en" ? "ar" : "en" as LocaleCode }))}>
                <Languages size={17} /> {state.locale.toUpperCase()}
              </button>
            </div>
          </header>

          {section === "Dashboard" && (
            <Dashboard portfolio={portfolio} state={state} setSection={setSection} downloadCsv={downloadCsv} downloadXlsx={downloadXlsx} />
          )}

          {section === "Apartments" && (
            <ApartmentsView
              state={state}
              activeApartment={activeApartment}
              canEdit={canEdit}
              setActive={(id) => updateState((current) => ({ ...current, activeApartmentId: id }))}
              updateApartment={updateApartment}
              addApartment={addApartment}
              newApartmentCode={newApartmentCode}
              setNewApartmentCode={setNewApartmentCode}
              setSection={setSection}
            />
          )}

          {section === "Rebuild" && (
            <RebuildView
              activeApartment={activeApartment}
              summary={activeSummary}
              expenses={state.expenses.filter((expense) => expense.apartmentId === activeApartment.id)}
              canEdit={canEdit}
              updateApartment={updateApartment}
              draftExpense={draftExpense}
              setDraftExpense={setDraftExpense}
              saveExpense={saveExpense}
              microcopy={t.emptyHint}
            />
          )}

          {section === "Monthly Costs" && (
            <ExpenseBuilder
              title="Monthly and recurring costs"
              description="This looks like a monthly cost. Should we calculate the total?"
              categories={recurringCategories}
              group="recurring"
              activeApartment={activeApartment}
              draftExpense={draftExpense.group === "recurring" ? draftExpense : createExpense(activeApartment.id, "Cleaning", "recurring")}
              setDraftExpense={setDraftExpense}
              saveExpense={saveExpense}
              canEdit={canEdit}
            />
          )}

          {section === "Evidence" && (
            <EvidenceView expenses={state.expenses} apartments={state.apartments} canEdit={canEdit} attachFiles={attachFiles} updateReview={updateReview} />
          )}

          {section === "Finance Review" && (
            <FinanceView expenses={state.expenses} apartments={state.apartments} canReview={canReview} updateReview={updateReview} />
          )}

          {section === "Export" && <ExportView rows={rows} downloadCsv={downloadCsv} downloadXlsx={downloadXlsx} />}

          {section === "Settings" && <SettingsView />}
        </section>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/96 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl gap-3">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-black text-white" onClick={() => setSection("Rebuild")} disabled={!canEdit}>
            <Plus size={18} /> {t.quickAdd}
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-canvas px-4 py-3 text-sm font-black text-ink" onClick={() => window.localStorage.setItem(storageKey, JSON.stringify(state))}>
            <Save size={18} /> {t.save}
          </button>
        </div>
      </div>
    </main>
  );
}

function Dashboard({ portfolio, state, setSection, downloadCsv, downloadXlsx }: { portfolio: ReturnType<typeof summarizePortfolio>; state: RecoveryState; setSection: (section: Section) => void; downloadCsv: () => void; downloadXlsx: () => void }) {
  const metrics = [
    ["Total expenses entered", formatSar(portfolio.total)],
    ["Total exact expenses", formatSar(portfolio.exact)],
    ["Total estimated expenses", formatSar(portfolio.estimated)],
    ["Recurring calculated", formatSar(portfolio.recurring)],
    ["Unknown expenses", String(portfolio.unknown)],
    ["Apartments", String(portfolio.apartments)],
    ["Missing evidence", String(portfolio.missingEvidence)],
    ["Low confidence", String(portfolio.lowConfidence)],
    ["Ready for finance", String(portfolio.ready)],
  ];

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl bg-ink p-5 text-white shadow-soft md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-white/72">Overall completion</p>
            <p className="mt-2 text-5xl font-black">{portfolio.completion}%</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/78">Let’s rebuild each apartment step by step. Pick the closest range, mark what is not sure, and let finance review it later.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-ink" onClick={() => setSection("Rebuild")}>
              <Sparkles size={18} /> Rebuild next apartment
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-mint px-4 py-3 text-sm font-black text-ink" onClick={downloadXlsx}>
              <Download size={18} /> Export XLSX
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm font-black text-white" onClick={downloadCsv}>
              <Download size={18} /> CSV
            </button>
          </div>
        </div>
        <Progress value={portfolio.completion} tone="light" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(([label, value]) => (
          <div className="rounded-2xl border border-line bg-surface p-4" key={label}>
            <p className="text-sm font-bold text-muted">{label}</p>
            <p className="mt-2 text-2xl font-black text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {state.apartments.filter((apartment) => !apartment.archived).map((apartment) => {
          const summary = summarizeApartment(apartment, state.expenses);
          return (
            <ApartmentCard key={apartment.id} apartment={apartment} summary={summary} onOpen={() => setSection("Rebuild")} />
          );
        })}
      </div>
    </div>
  );
}

function ApartmentsView(props: {
  state: RecoveryState;
  activeApartment: Apartment;
  canEdit: boolean;
  setActive: (id: string) => void;
  updateApartment: (id: string, patch: Partial<Apartment>) => void;
  addApartment: () => void;
  newApartmentCode: string;
  setNewApartmentCode: (value: string) => void;
  setSection: (section: Section) => void;
}) {
  return (
    <div className="mt-6 space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 md:flex-row md:items-end">
        <Field label="Add apartment">
          <input className="input" value={props.newApartmentCode} onChange={(event) => props.setNewApartmentCode(event.target.value)} placeholder="Example: 14A HTN" disabled={!props.canEdit} />
        </Field>
        <button className="btn-primary md:w-auto" onClick={props.addApartment} disabled={!props.canEdit}>
          <Plus size={18} /> Add apartment
        </button>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {props.state.apartments.map((apartment) => {
          const summary = summarizeApartment(apartment, props.state.expenses);
          return (
            <div className={apartment.archived ? "opacity-55" : ""} key={apartment.id}>
              <ApartmentCard apartment={apartment} summary={summary} onOpen={() => { props.setActive(apartment.id); props.setSection("Rebuild"); }} />
              {props.activeApartment.id === apartment.id && (
                <div className="mt-2 grid gap-2 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2">
                  <Field label="Apartment code">
                    <input className="input" value={apartment.code} onChange={(event) => props.updateApartment(apartment.id, { code: event.target.value })} disabled={!props.canEdit} />
                  </Field>
                  <Field label="District / project">
                    <input className="input" value={apartment.district} onChange={(event) => props.updateApartment(apartment.id, { district: event.target.value })} disabled={!props.canEdit} />
                  </Field>
                  <Field label="Status">
                    <select className="input" value={apartment.status} onChange={(event) => props.updateApartment(apartment.id, { status: event.target.value as ApartmentStatus })} disabled={!props.canEdit}>
                      {statusOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </Field>
                  <button className="btn-muted self-end" onClick={() => props.updateApartment(apartment.id, { archived: !apartment.archived })} disabled={!props.canEdit}>
                    <Archive size={18} /> {apartment.archived ? "Restore apartment" : "Archive apartment"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RebuildView(props: {
  activeApartment: Apartment;
  summary: ReturnType<typeof summarizeApartment>;
  expenses: Expense[];
  canEdit: boolean;
  updateApartment: (id: string, patch: Partial<Apartment>) => void;
  draftExpense: Expense;
  setDraftExpense: (expense: Expense) => void;
  saveExpense: (expense: Expense) => void;
  microcopy: string;
}) {
  return (
    <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        <div className="rounded-2xl bg-brand p-5 text-white">
          <p className="text-sm font-bold text-white/80">Active apartment</p>
          <h2 className="mt-1 text-4xl font-black">{props.activeApartment.code}</h2>
          <p className="mt-2 text-sm leading-6 text-white/82">Let’s rebuild this apartment step by step. {props.microcopy}</p>
          <Progress value={props.summary.completion} tone="light" />
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4">
          <h3 className="text-xl font-black">Apartment basics</h3>
          <div className="mt-4 grid gap-3">
            <Field label="When did this apartment start?">
              <input className="input" type="date" value={props.activeApartment.startedAt ?? ""} onChange={(event) => props.updateApartment(props.activeApartment.id, { startedAt: event.target.value })} disabled={!props.canEdit} />
            </Field>
            <Question label="Is the date exact, approximate month, or unknown?" options={["exact", "approximate month", "unknown"]} value={props.activeApartment.startDateConfidence} onChange={(value) => props.updateApartment(props.activeApartment.id, { startDateConfidence: value as Apartment["startDateConfidence"] })} disabled={!props.canEdit} />
            <Question label="Was the apartment furnished?" options={["empty", "partially furnished", "fully furnished", "unknown"]} value={props.activeApartment.furnishing} onChange={(value) => props.updateApartment(props.activeApartment.id, { furnishing: value as Apartment["furnishing"] })} disabled={!props.canEdit} />
            <Question label="Was this operating or under setup?" options={["operating", "under setup", "not sure"]} value={props.activeApartment.operationState} onChange={(value) => props.updateApartment(props.activeApartment.id, { operationState: value as Apartment["operationState"] })} disabled={!props.canEdit} />
            <Field label="Any memory notes?">
              <textarea className="input min-h-28" value={props.activeApartment.notes} onChange={(event) => props.updateApartment(props.activeApartment.id, { notes: event.target.value })} placeholder="Do you remember who helped, which supplier, or what month it happened?" disabled={!props.canEdit} />
            </Field>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <ExpenseBuilder
          title="One-time setup costs"
          description="Did you pay for this? Yes, no, not sure, or skip for now."
          categories={setupCategories}
          group="setup"
          activeApartment={props.activeApartment}
          draftExpense={props.draftExpense.group === "setup" ? props.draftExpense : createExpense(props.activeApartment.id, "Furniture", "setup")}
          setDraftExpense={props.setDraftExpense}
          saveExpense={props.saveExpense}
          canEdit={props.canEdit}
        />
        <div className="rounded-2xl border border-line bg-surface p-4">
          <h3 className="text-xl font-black">Remembered so far</h3>
          <div className="mt-3 grid gap-2">
            {props.expenses.length ? props.expenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} />) : <p className="rounded-xl bg-canvas p-4 text-sm font-bold text-muted">No expenses yet. Skip anything you cannot remember.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpenseBuilder(props: {
  title: string;
  description: string;
  categories: string[];
  group: Expense["group"];
  activeApartment: Apartment;
  draftExpense: Expense;
  setDraftExpense: (expense: Expense) => void;
  saveExpense: (expense: Expense) => void;
  canEdit: boolean;
}) {
  const draft = props.draftExpense.apartmentId === props.activeApartment.id ? props.draftExpense : createExpense(props.activeApartment.id, props.categories[0], props.group);
  const setDraft = (patch: Partial<Expense>) => props.setDraftExpense({ ...draft, apartmentId: props.activeApartment.id, group: props.group, ...patch });
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">{props.title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{props.description}</p>
        </div>
        <ReceiptText className="text-coral" />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {props.categories.map((category) => (
          <button key={category} className={`rounded-xl border px-3 py-3 text-left text-sm font-black ${draft.category === category ? "border-brand bg-brand text-white" : "border-line bg-canvas text-ink"}`} onClick={() => setDraft({ category })}>
            {category}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Question label="Did you pay for this?" options={["Yes", "No", "Not sure", "Skip for now"]} value={draft.notes.includes("Not paid") ? "No" : draft.notes.includes("Not sure") ? "Not sure" : "Yes"} onChange={(value) => setDraft({ notes: value === "No" ? "Not paid by founder." : value === "Not sure" ? "Not sure. Let finance review this later." : "" })} disabled={!props.canEdit} />
        <Field label="Amount">
          <input className="input" type="number" min="0" value={draft.amount ?? ""} onChange={(event) => setDraft({ amount: event.target.value ? Number(event.target.value) : null })} placeholder="SAR" disabled={!props.canEdit} />
        </Field>
        <Field label="Amount type">
          <select className="input" value={draft.amountConfidence} onChange={(event) => setDraft({ amountConfidence: event.target.value as AmountConfidence })} disabled={!props.canEdit}>
            {amountConfidenceOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </Field>
        <Field label="Was this one-time or recurring?">
          <select className="input" value={draft.recurrence} onChange={(event) => setDraft({ recurrence: event.target.value as Recurrence })} disabled={!props.canEdit}>
            {recurrenceOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </Field>
        <Field label="Start date">
          <input className="input" type="date" value={draft.startDate ?? ""} onChange={(event) => setDraft({ startDate: event.target.value })} disabled={!props.canEdit} />
        </Field>
        <Field label="End date">
          <input className="input" type="date" value={draft.endDate ?? ""} onChange={(event) => setDraft({ endDate: event.target.value })} disabled={!props.canEdit} />
        </Field>
        <Field label="Payment method">
          <input className="input" value={draft.paymentMethod} onChange={(event) => setDraft({ paymentMethod: event.target.value })} placeholder="Card, cash, transfer..." disabled={!props.canEdit} />
        </Field>
        <Field label="Paid by">
          <input className="input" value={draft.paidBy} onChange={(event) => setDraft({ paidBy: event.target.value })} disabled={!props.canEdit} />
        </Field>
        <Field label="Evidence status">
          <select className="input" value={draft.evidenceStatus} onChange={(event) => setDraft({ evidenceStatus: event.target.value as EvidenceStatus })} disabled={!props.canEdit}>
            {evidenceOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </Field>
        <Field label="Memory confidence">
          <input className="input" type="range" min="1" max="5" value={draft.confidence} onChange={(event) => setDraft({ confidence: Number(event.target.value) as Expense["confidence"] })} disabled={!props.canEdit} />
        </Field>
        <Field label="Notes">
          <textarea className="input min-h-24" value={draft.notes} onChange={(event) => setDraft({ notes: event.target.value })} placeholder="This is only an estimate until you attach proof." disabled={!props.canEdit} />
        </Field>
        <button className="btn-primary self-end" onClick={() => props.saveExpense(draft)} disabled={!props.canEdit || draft.notes.includes("Not paid")}>
          <Check size={18} /> Save expense
        </button>
      </div>
    </div>
  );
}

function EvidenceView({ expenses, apartments, canEdit, attachFiles, updateReview }: { expenses: Expense[]; apartments: Apartment[]; canEdit: boolean; attachFiles: (expenseId: string, event: ChangeEvent<HTMLInputElement>) => void; updateReview: (expenseId: string, reviewStatus: ReviewStatus) => void }) {
  return (
    <div className="mt-6 space-y-3">
      {expenses.map((expense) => {
        const apartment = apartments.find((item) => item.id === expense.apartmentId);
        return (
          <div key={expense.id} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold text-muted">{apartment?.code} · {expense.group}</p>
                <h3 className="text-xl font-black">{expense.category}</h3>
                <p className="mt-1 text-sm text-muted">Evidence: {expense.evidenceStatus}. Files: {expense.evidenceFiles.length ? expense.evidenceFiles.join(", ") : "No proof attached yet."}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="btn-muted">
                  <Upload size={18} /> Attach proof
                  <input className="sr-only" type="file" multiple onChange={(event) => attachFiles(expense.id, event)} disabled={!canEdit} />
                </label>
                <button className="btn-primary" onClick={() => updateReview(expense.id, "needs evidence")}>
                  <SearchCheck size={18} /> Request evidence
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FinanceView({ expenses, apartments, canReview, updateReview }: { expenses: Expense[]; apartments: Apartment[]; canReview: boolean; updateReview: (expenseId: string, reviewStatus: ReviewStatus) => void }) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid min-w-[760px] grid-cols-[1fr_1fr_1fr_1fr_1.2fr] gap-3 border-b border-line bg-canvas p-4 text-sm font-black">
        <span>Apartment</span><span>Expense</span><span>Amount</span><span>Status</span><span>Review</span>
      </div>
      <div className="overflow-x-auto">
        {expenses.map((expense) => {
          const apartment = apartments.find((item) => item.id === expense.apartmentId);
          return (
            <div key={expense.id} className="grid min-w-[760px] grid-cols-[1fr_1fr_1fr_1fr_1.2fr] gap-3 border-b border-line p-4 text-sm">
              <span className="font-bold">{apartment?.code}</span>
              <span>{expense.category}</span>
              <span>{formatSar(expense.amount ?? 0)}</span>
              <span>{expense.reviewStatus}</span>
              <select className="input py-2" value={expense.reviewStatus} onChange={(event) => updateReview(expense.id, event.target.value as ReviewStatus)} disabled={!canReview}>
                {reviewOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExportView({ rows, downloadCsv, downloadXlsx }: { rows: Record<string, string | number>[]; downloadCsv: () => void; downloadXlsx: () => void }) {
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-2xl font-black">Finance-ready export</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Exports are snapshots. The saved app database remains the source of truth.</p>
        <div className="mt-5 grid gap-2">
          <button className="btn-primary" onClick={downloadXlsx}><FileSpreadsheet size={18} /> Download XLSX</button>
          <button className="btn-muted" onClick={downloadCsv}><Download size={18} /> Download CSV</button>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-canvas">
              <tr>{Object.keys(rows[0] ?? { empty: "No rows yet" }).map((header) => <th className="p-3 font-black" key={header}>{header}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, index) => <tr className="border-t border-line" key={index}>{Object.values(row).map((value, cell) => <td className="p-3" key={cell}>{value}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-2xl font-black">Auth and roles</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Founder, finance, and viewer permissions are represented in the UI. Supabase Auth can enforce the same roles server-side with row-level security.</p>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-2xl font-black">File upload support</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Evidence upload controls capture file names now. In production, wire them to Supabase Storage and store signed file references in the evidence table.</p>
      </div>
    </div>
  );
}

function ApartmentCard({ apartment, summary, onOpen }: { apartment: Apartment; summary: ReturnType<typeof summarizeApartment>; onOpen: () => void }) {
  const missing = setupCategories.filter((category) => !summary.owned.some((expense) => expense.category === category)).slice(0, 3);
  return (
    <article className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-muted">{apartment.district}</p>
          <h3 className="mt-1 text-2xl font-black">{apartment.code}</h3>
        </div>
        <span className="rounded-full bg-canvas px-3 py-1 text-xs font-black text-ink">{apartment.status}</span>
      </div>
      <Progress value={summary.completion} />
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Mini label="Total" value={formatSar(summary.total)} />
        <Mini label="Exact" value={formatSar(summary.exact)} />
        <Mini label="Estimated" value={formatSar(summary.estimated)} />
        <Mini label="Expenses" value={String(summary.owned.length)} />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">Missing: {missing.length ? missing.join(", ") : "Core categories covered"}. Updated {apartment.lastUpdated}</p>
      <button className="btn-primary mt-4" onClick={onOpen}>
        <Sparkles size={18} /> Rebuild this apartment
      </button>
    </article>
  );
}

function ExpenseRow({ expense }: { expense: Expense }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-canvas p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-black">{expense.category}</p>
        <p className="text-sm text-muted">{expense.recurrence} · {expense.amountConfidence} · confidence {expense.confidence}/5</p>
      </div>
      <p className="text-lg font-black">{formatSar(expense.amount ?? 0)}</p>
    </div>
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

function Question({ label, options, value, onChange, disabled }: { label: string; options: string[]; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return (
    <div>
      <p className="text-sm font-black text-ink">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button key={option} className={`rounded-xl px-3 py-2 text-sm font-black ${value === option ? "bg-brand text-white" : "border border-line bg-canvas text-ink"}`} onClick={() => onChange(option)} disabled={disabled}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function Segmented({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div className="flex rounded-xl border border-line bg-surface p-1">
      {options.map((option) => (
        <button key={option} className={`rounded-lg px-3 py-2 text-sm font-black capitalize ${value === option ? "bg-ink text-white" : "text-muted"}`} onClick={() => onChange(option)}>
          {option}
        </button>
      ))}
    </div>
  );
}

function Progress({ value, tone = "dark" }: { value: number; tone?: "dark" | "light" }) {
  return (
    <div className="mt-4">
      <div className={`mb-2 flex items-center justify-between text-sm font-black ${tone === "light" ? "text-white" : "text-ink"}`}>
        <span>Progress</span>
        <span>{value}%</span>
      </div>
      <div className={`h-3 overflow-hidden rounded-full ${tone === "light" ? "bg-white/18" : "bg-canvas"}`}>
        <div className={`h-full rounded-full ${tone === "light" ? "bg-mint" : "bg-brand"}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-canvas p-3">
      <p className="text-xs font-bold text-muted">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function createExpense(apartmentId: string, category: string, group: Expense["group"]): Expense {
  const date = new Date().toISOString().slice(0, 10);
  return {
    id: `exp-${crypto.randomUUID()}`,
    apartmentId,
    category,
    group,
    amount: null,
    amountConfidence: "estimated",
    recurrence: group === "recurring" ? "monthly" : "one-time",
    paymentMethod: "Founder card",
    paidBy: "Founder",
    evidenceStatus: "memory",
    confidence: 3,
    notes: "",
    reviewStatus: "draft",
    evidenceFiles: [],
    createdAt: date,
    updatedAt: date,
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
