import { useEffect, useState } from "react";
import { Link } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { api } from "../../lib/api";
import type { OrderList, OrderStatus } from "../../lib/types";
import { Button, Card, ErrorBox, PageHeader, Spinner, cx } from "../../components/ui";
import { OrderStatusBadge, PaymentStatusBadge, useMoney } from "./orderUi";

const PAGE_SIZE = 25;
const TABS: (OrderStatus | "all")[] = ["all", "transfer_review", "paid", "awaiting_transfer", "awaiting_payment", "cancelled"];

export function OrdersPage() {
  const { t, fmt, dir, formatDate } = useI18n();
  const money = useMoney();
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);
  useEffect(() => setPage(1), [status, debounced]);

  const params = new URLSearchParams({ status, page: String(page), pageSize: String(PAGE_SIZE) });
  if (debounced) params.set("search", debounced);
  const list = useQuery({
    queryKey: ["orders", "list", params.toString()],
    queryFn: () => api.get<OrderList>(`/orders?${params}`),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });

  const counts = list.data?.counts ?? {};
  const allCount = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  const pages = list.data ? Math.max(1, Math.ceil(list.data.total / PAGE_SIZE)) : 1;
  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <>
      <PageHeader title={t.orders.title} />

      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {TABS.map((s) => {
          const n = s === "all" ? allCount : (counts[s] ?? 0);
          return (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={status === s}
              onClick={() => setStatus(s)}
              className={cx(
                "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                status === s ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand/40",
                s === "transfer_review" && n > 0 && status !== s && "border-amber-300 bg-amber-50",
              )}
            >
              {s === "all" ? t.common.all : t.orders.status[s]}
              <span className={cx("ltr rounded-full px-1.5 text-xs", status === s ? "bg-white/20" : "bg-cream")}>{n}</span>
            </button>
          );
        })}
      </div>

      <Card className="mb-4">
        <label className="relative block">
          <span className="sr-only">{t.common.search}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.orders.searchPlaceholder}
            className="w-full rounded-lg border border-line bg-white py-2 ps-9 pe-3 text-sm focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none"
          />
        </label>
      </Card>

      {list.isError && <ErrorBox error={list.error} onRetry={() => void list.refetch()} />}
      {list.isPending && <Spinner />}

      {list.data && (
        <Card className="overflow-hidden p-0">
          {list.data.items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">{t.orders.empty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className={cx("w-full min-w-[820px] text-sm", list.isFetching && "opacity-60")}>
                <thead className="bg-cream/60 text-xs text-muted">
                  <tr>
                    {(["order", "customer", "total", "payment", "status", "date"] as const).map((c) => (
                      <th key={c} className="px-4 py-3 text-start font-semibold">
                        {t.orders.columns[c]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {list.data.items.map((o) => (
                    <tr key={o.id} className="hover:bg-surface">
                      <td className="px-4 py-3">
                        <Link to={`/orders/${o.id}`} className="ltr font-bold text-brand hover:underline">
                          {o.number}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{o.contact.companyName || o.contact.name}</div>
                        <div className="ltr text-xs text-muted">{o.contact.phone}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">
                        <span className="ltr">{money(o.total)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {o.payment && (
                          <div className="space-y-1">
                            <div className="text-xs text-muted">{t.orders.method[o.payment.method]}</div>
                            <PaymentStatusBadge status={o.payment.status} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-muted">{formatDate(o.createdAt)}</td>
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
