import { Link } from "react-router";
import { useI18n } from "../../i18n/I18nProvider";
import type { MessageListItem } from "../../lib/types";
import { Card, ErrorBox, PageHeader, Spinner, cx } from "../../components/ui";
import { CaptchaBadge, Pager, RequestStatusBadge, SearchBox, StatusTabs, useRequestList } from "./requestUi";

export function MessagesPage() {
  const { t, formatDate } = useI18n();
  const { list, status, setStatus, search, setSearch, page, setPage, pages } = useRequestList<MessageListItem>("messages");

  return (
    <>
      <PageHeader title={t.requests.messagesTitle} subtitle={t.requests.messagesSubtitle} />
      <StatusTabs value={status} onChange={setStatus} counts={list.data?.counts ?? {}} />
      <SearchBox value={search} onChange={setSearch} placeholder={t.requests.messagesSearch} />

      {list.isError && <ErrorBox error={list.error} onRetry={() => void list.refetch()} />}
      {list.isPending && <Spinner />}

      {list.data && (
        <Card className="overflow-hidden p-0">
          {list.data.items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">{t.requests.emptyMessages}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className={cx("w-full min-w-[820px] text-sm", list.isFetching && "opacity-60")}>
                <thead className="bg-cream/60 text-xs text-muted">
                  <tr>
                    {(["reference", "sender", "message", "status", "date"] as const).map((c) => (
                      <th key={c} className="px-4 py-3 text-start font-semibold">
                        {t.requests.columns[c]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {list.data.items.map((m) => (
                    <tr key={m.id} className={cx("hover:bg-surface", m.status === "new" && "font-semibold")}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link to={`/messages/${m.id}`} className="ltr font-bold text-brand hover:underline">
                          {m.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div>{m.name}</div>
                        <div className="ltr text-xs font-normal text-muted">{m.phone}</div>
                      </td>
                      <td className="max-w-[360px] px-4 py-3 font-normal">
                        <p className="line-clamp-2 text-muted">{m.preview}</p>
                        {m.captchaUnverified && (
                          <div className="mt-1">
                            <CaptchaBadge />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <RequestStatusBadge status={m.status} />
                      </td>
                      <td className="px-4 py-3 text-xs font-normal whitespace-nowrap text-muted">{formatDate(m.submittedAt)}</td>
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
