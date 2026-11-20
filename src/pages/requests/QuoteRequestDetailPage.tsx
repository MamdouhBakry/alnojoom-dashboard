import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Mail, MessageCircle } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { api } from "../../lib/api";
import type { QuoteRequestDetail } from "../../lib/types";
import { Card, ErrorBox, PageHeader, Spinner } from "../../components/ui";
import { CaptchaBadge, FollowUpCard, RequestStatusBadge, Row, whatsappUrl } from "./requestUi";

export function QuoteRequestDetailPage() {
  const { id } = useParams();
  const { t, dir, formatDate } = useI18n();
  const q = useQuery({ queryKey: ["quote-requests", "one", id], queryFn: () => api.get<QuoteRequestDetail>(`/quote-requests/${id}`) });

  if (q.isPending) return <Spinner />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => void q.refetch()} />;
  const r = q.data;
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;
  const unit = (u: "kg" | "ton") => (u === "kg" ? t.requests.unitKg : t.requests.unitTon);
  const qty = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 });

  return (
    <>
      <Link to="/quote-requests" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand">
        <Back className="size-4" />
        {t.nav.quoteRequests}
      </Link>
      <PageHeader
        title={r.companyName}
        subtitle={
          <span>
            <span className="ltr">{r.reference}</span> · {t.requests.mode[r.mode]} · {formatDate(r.submittedAt)}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {r.captchaUnverified && <CaptchaBadge />}
            <RequestStatusBadge status={r.status} />
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {r.captchaUnverified && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{t.requests.captchaUnverifiedHint}</p>}
          <Card title={t.requests.items}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="text-xs text-muted">
                  <tr className="border-b border-line/60">
                    <th className="py-2 text-start font-semibold">{t.requests.product}</th>
                    <th className="py-2 text-end font-semibold">{t.requests.quantity}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {r.items.map((i) => (
                    <tr key={i.id}>
                      <td className="py-2.5">
                        <div className="font-semibold">{i.productName}</div>
                        <div className="text-xs text-muted">
                          <bdi className="ltr">{i.productSlug}</bdi>
                        </div>
                      </td>
                      <td className="py-2.5 text-end whitespace-nowrap">
                        <span className="ltr font-semibold">{qty.format(i.quantity)}</span> {unit(i.unit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <FollowUpCard key={`${r.id}-${r.handledAt ?? ""}`} kind="quote-requests" id={r.id} status={r.status} staffNote={r.staffNote} handledBy={r.handledBy} handledAt={r.handledAt} />
        </div>

        <div className="space-y-4">
          <Card title={t.requests.sender}>
            <dl>
              <Row label={t.requests.company}>{r.companyName}</Row>
              <Row label={t.requests.phone}>
                <a className="ltr hover:text-brand" href={`tel:${r.phone}`}>
                  {r.phone}
                </a>
              </Row>
              <Row label={t.requests.email}>
                <a className="ltr break-all hover:text-brand" href={`mailto:${r.email}`}>
                  {r.email}
                </a>
              </Row>
              <Row label={t.requests.language}>{t.requests.languages[r.locale]}</Row>
              <Row label={t.requests.submittedAt}>{formatDate(r.submittedAt)}</Row>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={whatsappUrl(r.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:border-brand/40 hover:bg-brand-subtle">
                <MessageCircle className="size-4" />
                {t.requests.whatsapp}
              </a>
              <a href={`mailto:${r.email}?subject=${encodeURIComponent(r.reference)}`} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:border-brand/40 hover:bg-brand-subtle">
                <Mail className="size-4" />
                {t.requests.replyEmail}
              </a>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
