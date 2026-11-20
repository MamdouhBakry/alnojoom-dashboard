import { Link } from "react-router";
import { useI18n } from "../../i18n/I18nProvider";
import type { QuoteRequestListItem } from "../../lib/types";
import { Card, ErrorBox, PageHeader, Spinner, cx } from "../../components/ui";
import { CaptchaBadge, Pager, RequestStatusBadge, SearchBox, StatusTabs, useRequestList } from "./requestUi";

export function QuoteRequestsPage() {
  const { t, fmt, formatDate } = useI18n();
  const { list, status, setStatus, search, setSearch, page, setPage, pages } = useRequestList<QuoteRequestListItem>("quote-requests");

  return (
    <>
      <PageHeader title={t.requests.quoteRequestsTitle} subtitle={t.requests.quoteRequestsSubtitle} />
      <StatusTabs value={status} onChange={setStatus} counts={list.data?.counts ?? {}} />
      <SearchBox value={search} onChange={setSearch} placeholder={t.requests.quoteRequestsSearch} />

      {list.isError && <ErrorBox error={list.error} onRetry={() => void list.refetch()} />}
      {list.isPending && <Spinner />}

      {list.data && (
        <Card className="overflow-hidden p-0">
          {list.data.items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">{t.requests.emptyQuoteRequests}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className={cx("w-full min-w-[820px] text-sm", list.isFetching && "opacity-60")}>
                <thead className="bg-cream/60 text-xs text-muted">
                  <tr>
                    {(["reference", "company", "type", "items", "status", "date"] as const).map((c) => (
                      <th key={c} className="px-4 py-3 text-start font-semibold">
                        {t.requests.columns[c]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {list.data.items.map((r) => (
                    <tr key={r.id} className={cx("hover:bg-surface", r.status === "new" && "font-semibold")}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link to={`/quote-requests/${r.id}`} className="ltr font-bold text-brand hover:underline">
                          {r.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div>{r.companyName}</div>
                        <div className="ltr text-xs font-normal text-muted">{r.phone}</div>
                        {r.captchaUnverified && (
                          <div className="mt-1">
                            <CaptchaBadge />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-normal whitespace-nowrap">{t.requests.mode[r.mode]}</td>
                      <td className="px-4 py-3 font-normal whitespace-nowrap">{fmt(t.requests.itemsCount, { n: r.itemCount })}</td>
                      <td className="px-4 py-3">
                        <RequestStatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-xs font-normal whitespace-nowrap text-muted">{formatDate(r.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pager page={page} pages={pages} onPage={setPage} />
        </Card>
      )}
    </>
  );
}
