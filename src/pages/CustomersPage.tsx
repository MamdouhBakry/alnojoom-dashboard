import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import type { CustomerRow, Paged } from "../lib/types";
import { Badge, Button, Card, ErrorBox, PageHeader, Spinner, cx, useErrorText } from "../components/ui";
import { useFeedback } from "../components/feedback";
import { useMoney } from "./orders/orderUi";

const PAGE_SIZE = 25;
type Consent = "all" | "yes" | "no";

export function CustomersPage() {
  const { t, fmt, dir, lang, formatDate } = useI18n();
  const { can } = useAuth();
  const { toast } = useFeedback();
  const errorText = useErrorText();
  const money = useMoney();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [consent, setConsent] = useState<Consent>("all");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);
  useEffect(() => setPage(1), [debounced, consent]);

  const params = new URLSearchParams({ consent, page: String(page), pageSize: String(PAGE_SIZE) });
  if (debounced) params.set("search", debounced);
  const list = useQuery({
    queryKey: ["customers", params.toString()],
    queryFn: () => api.get<Paged<CustomerRow>>(`/customers?${params}`),
    placeholderData: keepPreviousData,
  });

  async function exportCsv() {
    const p = new URLSearchParams({ consent, lang });
    if (debounced) p.set("search", debounced);
    setExporting(true);
    try {
      const name = await api.download(`/customers/export?${p}`, "customers.csv");
      toast(fmt(t.reports.downloaded, { name }));
    } catch (err) {
      toast(errorText(err), "error");
    } finally {
      setExporting(false);
    }
  }

  const pages = list.data ? Math.max(1, Math.ceil(list.data.total / PAGE_SIZE)) : 1;
  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <>
      <PageHeader
        title={t.customers.title}
        subtitle={t.customers.subtitle}
        actions={
          can("reports.export") && (
            <Button variant="secondary" busy={exporting} onClick={() => void exportCsv()} icon={<Download className="size-4" />}>
              {t.customers.export}
            </Button>
          )
        }
      />

      <Card className="mb-4">
        <div className="grid gap-3 md:grid-cols-[1fr_200px]">
          <label className="relative block">
            <span className="sr-only">{t.common.search}</span>
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.customers.searchPlaceholder}
              className="w-full rounded-lg border border-line bg-white py-2 ps-9 pe-3 text-sm focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none"
            />
          </label>
          <select aria-label={t.customers.consent} value={consent} onChange={(e) => setConsent(e.target.value as Consent)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
            <option value="all">{`${t.customers.consent}: ${t.common.all}`}</option>
            <option value="yes">{t.customers.consentYes}</option>
            <option value="no">{t.customers.consentNo}</option>
          </select>
        </div>
      </Card>

      {list.isError && <ErrorBox error={list.error} onRetry={() => void list.refetch()} />}
      {list.isPending && <Spinner />}
      {list.data && (
        <Card className="overflow-hidden p-0">
          {list.data.items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">{t.customers.empty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className={cx("w-full min-w-[820px] text-sm", list.isFetching && "opacity-60")}>
                <thead className="bg-cream/60 text-xs text-muted">
                  <tr>
                    <th className="px-4 py-3 text-start font-semibold">{t.orders.customer}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t.orders.phone}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t.customers.consent}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t.customers.paid}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t.customers.registered}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {list.data.items.map((c) => (
                    <tr key={c.id} className="hover:bg-surface">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{c.companyName || c.name}</div>
                        {c.companyName && <div className="text-xs text-muted">{c.name}</div>}
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="ltr text-xs text-muted">{c.email}</span>
                          {c.emailVerified ? <Badge tone="success">{t.customers.verified}</Badge> : <Badge>{t.customers.unverified}</Badge>}
                          {c.googleLinked && <Badge tone="brand">{t.customers.google}</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="ltr">{c.phone ?? t.common.none}</span>
                      </td>
                      <td className="px-4 py-3">
                        {c.marketingConsent ? <Badge tone="success">{t.customers.consentYes}</Badge> : <Badge>{t.customers.consentNo}</Badge>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="ltr font-semibold">{money(c.paidTotal)}</span>
                        <div className="text-xs text-muted">
                          <span className="ltr">{c.paidOrders}</span> {t.home.paidOrders}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-muted">{formatDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pages > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-line/50 px-4 py-3 text-sm">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((n) => n - 1)} icon={<Prev className="size-4" />}>
                {t.common.previous}
              </Button>
              <span className="text-muted">{fmt(t.common.pageOf, { page, pages })}</span>
              <Button variant="secondary" disabled={page >= pages} onClick={() => setPage((n) => n + 1)}>
                {t.common.next}
                <Next className="size-4" />
              </Button>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
