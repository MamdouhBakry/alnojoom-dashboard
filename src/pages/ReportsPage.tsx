import { useState, type ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Download, Users, ShoppingBasket, FileQuestion, UserPlus, FileText, BadgeCheck, Wallet, Percent, Megaphone } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import type { ReportSummary } from "../lib/types";
import { Button, Card, Checkbox, ErrorBox, PageHeader, Spinner, cx, useErrorText } from "../components/ui";
import { useFeedback } from "../components/feedback";
import { useMoney } from "./orders/orderUi";

const PERIODS = [7, 30, 90] as const;
const HOURS = [24, 48, 72, 168] as const;

function Kpi({ icon, value, label, hint }: { icon: ReactNode; value: ReactNode; label: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line/70 bg-white p-5">
      <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand-subtle text-brand">{icon}</div>
      <div className="ltr text-2xl font-extrabold">{value}</div>
      <div className="text-sm text-muted">{label}</div>
      {hint && <div className="mt-1 text-xs text-muted/80">{hint}</div>}
    </div>
  );
}

export function ReportsPage() {
  const { t } = useI18n();
  const money = useMoney();
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);

  const summary = useQuery({
    queryKey: ["reports", "summary", days],
    queryFn: () => api.get<ReportSummary>(`/reports/summary?days=${days}`),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title={t.reports.title} subtitle={t.reports.subtitle} />

      <div className="mb-4 flex flex-wrap items-center gap-2" role="radiogroup" aria-label={t.reports.period}>
        {PERIODS.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={days === n}
            onClick={() => setDays(n)}
            className={cx(
              "rounded-full border px-4 py-1.5 text-sm font-semibold",
              days === n ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand/40",
            )}
          >
            {t.reports.days[n]}
          </button>
        ))}
      </div>

      {summary.isError && <ErrorBox error={summary.error} onRetry={() => void summary.refetch()} />}
      {summary.isPending && <Spinner />}
      {summary.data && (
        <div className={cx("mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4", summary.isFetching && "opacity-60")}>
          <Kpi icon={<UserPlus className="size-5" />} value={summary.data.newCustomers} label={t.reports.newCustomers} />
          <Kpi icon={<FileText className="size-5" />} value={summary.data.quotes} label={t.reports.quotes} />
          <Kpi icon={<BadgeCheck className="size-5" />} value={summary.data.paidOrders} label={t.reports.paidOrders} />
          <Kpi icon={<Wallet className="size-5" />} value={money(summary.data.paidTotal)} label={t.reports.paidTotal} hint={t.reports.paidTotalHint} />
          <Kpi icon={<Percent className="size-5" />} value={`${summary.data.conversionRate}%`} label={t.reports.conversion} />
          <Kpi icon={<ShoppingBasket className="size-5" />} value={summary.data.abandonedCarts} label={t.reports.abandonedCarts} />
          <Kpi icon={<Megaphone className="size-5" />} value={summary.data.marketingContacts} label={t.reports.marketingContacts} />
        </div>
      )}

      <h2 className="mb-1 text-lg font-extrabold">{t.reports.exportTitle}</h2>
      <p className="mb-4 max-w-3xl text-sm text-muted">{t.reports.exportHint}</p>
      <div className="grid gap-4 lg:grid-cols-3">
        <ExportCard report="contacts" title={t.reports.contacts} description={t.reports.contactsDesc} icon={<Users className="size-5" />} days={days} />
        <ExportCard report="abandoned-carts" title={t.reports.abandoned} description={t.reports.abandonedDesc} icon={<ShoppingBasket className="size-5" />} days={days} withHours />
        <ExportCard report="non-purchasers" title={t.reports.nonPurchasers} description={t.reports.nonPurchasersDesc} icon={<FileQuestion className="size-5" />} days={days} />
      </div>
    </>
  );
}

function ExportCard({
  report,
  title,
  description,
  icon,
  days,
  withHours,
}: {
  report: string;
  title: string;
  description: string;
  icon: ReactNode;
  days: number;
  withHours?: boolean;
}) {
  const { t, fmt, lang } = useI18n();
  const { toast } = useFeedback();
  const errorText = useErrorText();
  const [consentOnly, setConsentOnly] = useState(true);
  const [inPeriod, setInPeriod] = useState(false);
  const [hours, setHours] = useState<(typeof HOURS)[number]>(24);
  const [busy, setBusy] = useState(false);

  async function download() {
    const p = new URLSearchParams({ lang, consent: consentOnly ? "yes" : "all" });
    if (inPeriod) p.set("days", String(days));
    if (withHours) p.set("abandonedHours", String(hours));
    setBusy(true);
    try {
      const name = await api.download(`/reports/export/${report}?${p}`, `${report}.csv`);
      toast(fmt(t.reports.downloaded, { name }));
    } catch (err) {
      toast(errorText(err), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-subtle text-brand">{icon}</span>
        <h3 className="font-bold">{title}</h3>
      </div>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-muted">{description}</p>
      <div className="mb-4 space-y-2.5">
        <Checkbox label={t.reports.consentOnly} checked={consentOnly} onChange={setConsentOnly} />
        <Checkbox label={`${t.reports.inPeriod} (${t.reports.days[days]})`} checked={inPeriod} onChange={setInPeriod} />
        {withHours && (
          <label className="flex items-center gap-2 text-sm">
            {t.reports.olderThan}
            <select value={hours} onChange={(e) => setHours(Number(e.target.value) as (typeof HOURS)[number])} className="rounded-lg border border-line bg-white px-2 py-1 text-sm">
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {fmt(t.reports.hours, { n: h })}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <Button onClick={() => void download()} busy={busy} icon={<Download className="size-4" />} className="w-full">
        {t.reports.download}
      </Button>
    </Card>
  );
}
