import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Mail, MessageCircle } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { api } from "../../lib/api";
import type { MessageDetail } from "../../lib/types";
import { Card, ErrorBox, PageHeader, Spinner } from "../../components/ui";
import { CaptchaBadge, FollowUpCard, RequestStatusBadge, Row, whatsappUrl } from "./requestUi";

export function MessageDetailPage() {
  const { id } = useParams();
  const { t, dir, formatDate } = useI18n();
  const q = useQuery({ queryKey: ["messages", "one", id], queryFn: () => api.get<MessageDetail>(`/messages/${id}`) });

  if (q.isPending) return <Spinner />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => void q.refetch()} />;
  const m = q.data;
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <>
      <Link to="/messages" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand">
        <Back className="size-4" />
        {t.nav.messages}
      </Link>
      <PageHeader
        title={m.name}
        subtitle={
          <span>
            <span className="ltr">{m.reference}</span> · {formatDate(m.submittedAt)}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {m.captchaUnverified && <CaptchaBadge />}
            <RequestStatusBadge status={m.status} />
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {m.captchaUnverified && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{t.requests.captchaUnverifiedHint}</p>}
          <Card title={t.requests.message}>
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap" dir="auto">
              {m.message}
            </p>
          </Card>
          <FollowUpCard key={`${m.id}-${m.handledAt ?? ""}`} kind="messages" id={m.id} status={m.status} staffNote={m.staffNote} handledBy={m.handledBy} handledAt={m.handledAt} />
        </div>

        <div className="space-y-4">
          <Card title={t.requests.sender}>
            <dl>
              <Row label={t.requests.name}>{m.name}</Row>
              <Row label={t.requests.phone}>
                <a className="ltr hover:text-brand" href={`tel:${m.phone}`}>
                  {m.phone}
                </a>
              </Row>
              {m.email && (
                <Row label={t.requests.email}>
                  <a className="ltr break-all hover:text-brand" href={`mailto:${m.email}`}>
                    {m.email}
                  </a>
                </Row>
              )}
              <Row label={t.requests.language}>{t.requests.languages[m.locale]}</Row>
              <Row label={t.requests.submittedAt}>{formatDate(m.submittedAt)}</Row>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={whatsappUrl(m.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:border-brand/40 hover:bg-brand-subtle">
                <MessageCircle className="size-4" />
                {t.requests.whatsapp}
              </a>
              {m.email && (
                <a href={`mailto:${m.email}?subject=${encodeURIComponent(m.reference)}`} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:border-brand/40 hover:bg-brand-subtle">
                  <Mail className="size-4" />
                  {t.requests.replyEmail}
                </a>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
