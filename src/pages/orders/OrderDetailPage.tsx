import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, X, ExternalLink, FileText } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { useI18n } from "../../i18n/I18nProvider";
import { api } from "../../lib/api";
import type { OrderDetail, OrderPayment } from "../../lib/types";
import { Button, Card, ErrorBox, Modal, PageHeader, Spinner, TextInput, useErrorText } from "../../components/ui";
import { useFeedback } from "../../components/feedback";
import { ErpStatusBadge, OrderStatusBadge, PaymentStatusBadge, useMoney } from "./orderUi";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-end font-medium">{children}</dd>
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const { t, pick, dir, formatDate } = useI18n();
  const money = useMoney();
  const order = useQuery({ queryKey: ["orders", "one", id], queryFn: () => api.get<OrderDetail>(`/orders/${id}`) });

  if (order.isPending) return <Spinner />;
  if (order.isError) return <ErrorBox error={order.error} onRetry={() => void order.refetch()} />;
  const o = order.data;
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;
  const unit = (u: "kg" | "ton") => (u === "kg" ? t.orders.unitKg : t.orders.unitTon);

  return (
    <>
      <Link to="/orders" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand">
        <Back className="size-4" />
        {t.nav.orders}
      </Link>
      <PageHeader
        title={o.number}
        subtitle={
          <span>
            {t.orders.quote} <span className="ltr">{o.quoteNumber}</span> · {formatDate(o.createdAt)}
          </span>
        }
        actions={<OrderStatusBadge status={o.status} />}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {o.payments
            .filter((p) => p.method === "bank_transfer" && p.status === "pending_review")
            .map((p) => (
              <TransferReview key={p.id} orderId={o.id} payment={p} total={o.total} />
            ))}

          <Card title={t.orders.items}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-xs text-muted">
                  <tr className="border-b border-line/60">
                    <th className="py-2 text-start font-semibold">{t.orders.product}</th>
                    <th className="py-2 text-start font-semibold">{t.orders.quantity}</th>
                    <th className="py-2 text-start font-semibold">{t.orders.unitPrice}</th>
                    <th className="py-2 text-end font-semibold">{t.orders.lineTotal}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {o.lines.map((l) => (
                    <tr key={l.slug}>
                      <td className="py-2.5">
                        <div className="font-semibold">{pick(l.name)}</div>
                        <div className="text-xs text-muted">
                          {t.orders.erpName}: {l.erpName}
                        </div>
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <span className="ltr">{l.quantity}</span> {unit(l.unit)}
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <span className="ltr">{money(l.unitPrice)}</span>
                      </td>
                      <td className="py-2.5 text-end font-semibold whitespace-nowrap">
                        <span className="ltr">{money(l.lineTotal)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="mt-3 border-t border-line/60 pt-2">
              <Row label={t.orders.delivery}>
                <span className="ltr">{money(o.deliveryFee)}</span>
              </Row>
              <Row label={t.orders.total}>
                <span className="ltr text-base font-extrabold">{money(o.total)}</span>
              </Row>
            </dl>
          </Card>

          <Card title={t.orders.payments}>
            <ul className="divide-y divide-line/50">
              {o.payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{t.orders.method[p.method]}</span>
                      <PaymentStatusBadge status={p.status} />
                    </div>
                    <div className="text-xs text-muted">
                      <bdi>{formatDate(p.createdAt)}</bdi>
                    </div>
                    {p.providerRef && (
                      <div className="text-xs">
                        {t.orders.ref}: <span className="ltr font-mono">{p.providerRef}</span>
                        {p.providerInfo && <span className="ltr text-muted"> ({p.providerInfo})</span>}
                      </div>
                    )}
                    {p.failureReason && (
                      <div className="text-xs text-red-700">
                        {t.orders.failure}: {p.failureReason}
                      </div>
                    )}
                    {p.reviewedBy && (
                      <div className="text-xs">
                        {t.orders.reviewedBy}: <bdi>{p.reviewedBy}</bdi> · <bdi>{formatDate(p.reviewedAt)}</bdi>
                        {p.reviewNote && <span className="text-muted"> — {p.reviewNote}</span>}
                      </div>
                    )}
                  </div>
                  <span className="ltr font-semibold">{money(p.amount)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title={t.orders.customer}>
            <dl>
              <Row label={t.orders.customer}>{o.contact.name}</Row>
              {o.contact.companyName && <Row label={t.orders.company}>{o.contact.companyName}</Row>}
              <Row label={t.orders.phone}>
                <a className="ltr hover:text-brand" href={`tel:${o.contact.phone}`}>
                  {o.contact.phone}
                </a>
              </Row>
              <Row label={t.orders.email}>
                <a className="ltr break-all hover:text-brand" href={`mailto:${o.contact.email}`}>
                  {o.contact.email}
                </a>
              </Row>
            </dl>
          </Card>

          <Card title={t.orders.columns.date}>
            <dl>
              <Row label={t.orders.created}>{formatDate(o.createdAt)}</Row>
              {o.paidAt && <Row label={t.orders.paidAt}>{formatDate(o.paidAt)}</Row>}
              {o.transferDueAt && o.status === "awaiting_transfer" && <Row label={t.orders.transferDue}>{formatDate(o.transferDueAt)}</Row>}
              {o.cancelReason && <Row label={t.orders.cancelReason}>{t.orders.cancelReasons[o.cancelReason] ?? o.cancelReason}</Row>}
            </dl>
          </Card>

          <Card title={t.orders.erp}>
            <dl>
              <Row label={t.orders.columns.status}>
                <ErpStatusBadge status={o.erp.status} />
              </Row>
              {o.erp.attempts > 0 && <Row label={t.orders.erpAttempts}>{o.erp.attempts}</Row>}
              {o.erp.lastError && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">{o.erp.lastError}</p>}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}

/** The receipt next to the amount, with confirm / reject for staff who may confirm payments. */
function TransferReview({ orderId, payment, total }: { orderId: number; payment: OrderPayment; total: number }) {
  const { t, formatDate } = useI18n();
  const { can } = useAuth();
  const { toast } = useFeedback();
  const errorText = useErrorText();
  const money = useMoney();
  const qc = useQueryClient();
  const [url, setUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [dialog, setDialog] = useState<"confirm" | "reject" | null>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    let objectUrl: string | null = null;
    api
      .blob(`/payments/${payment.id}/receipt`)
      .then((b) => {
        objectUrl = URL.createObjectURL(b);
        setUrl(objectUrl);
      })
      .catch(setLoadError);
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [payment.id]);

  const decide = useMutation({
    mutationFn: (kind: "confirm" | "reject") =>
      api.post(`/payments/${payment.id}/${kind}`, kind === "confirm" ? { note: text.trim() || undefined } : { reason: text.trim() }),
    onSuccess: (_d, kind) => {
      toast(kind === "confirm" ? t.orders.confirmed : t.orders.rejected);
      setDialog(null);
      setText("");
      void qc.invalidateQueries({ queryKey: ["orders"] });
      void qc.invalidateQueries({ queryKey: ["orders", "one", String(orderId)] });
    },
    onError: (err) => toast(errorText(err), "error"),
  });

  const isPdf = payment.receiptMime === "application/pdf";

  return (
    <Card
      title={t.orders.receipt}
      className="border-amber-300 ring-2 ring-amber-100"
      actions={
        url && (
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
            <ExternalLink className="size-4" />
            {t.orders.openReceipt}
          </a>
        )
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted">{formatDate(payment.receiptUploadedAt)}</span>
        <span>
          {t.orders.amount}: <strong className="ltr">{money(total)}</strong>
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-cream/40">
        {loadError != null ? (
          <div className="p-4">
            <ErrorBox error={loadError} />
          </div>
        ) : !url ? (
          <Spinner />
        ) : isPdf ? (
          <object data={url} type="application/pdf" className="h-[480px] w-full" aria-label={t.orders.receipt}>
            <div className="flex flex-col items-center gap-2 p-8 text-muted">
              <FileText className="size-8" />
              <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-brand underline">
                {t.orders.openReceipt}
              </a>
            </div>
          </object>
        ) : (
          <img src={url} alt={t.orders.receipt} className="mx-auto max-h-[480px] w-auto object-contain" />
        )}
      </div>

      {can("payments.confirm") && (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="danger" icon={<X className="size-4" />} onClick={() => setDialog("reject")}>
            {t.orders.reject}
          </Button>
          <Button icon={<Check className="size-4" />} onClick={() => setDialog("confirm")}>
            {t.orders.confirm}
          </Button>
        </div>
      )}

      <Modal
        open={dialog !== null}
        onClose={() => {
          setDialog(null);
          setText("");
        }}
        title={dialog === "confirm" ? t.orders.confirm : t.orders.reject}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              {t.common.cancel}
            </Button>
            <Button
              variant={dialog === "reject" ? "danger" : "primary"}
              busy={decide.isPending}
              disabled={dialog === "reject" && text.trim().length < 3}
              onClick={() => dialog && decide.mutate(dialog)}
            >
              {dialog === "confirm" ? t.orders.confirm : t.orders.reject}
            </Button>
          </>
        }
      >
        {dialog === "confirm" && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{t.orders.confirmHint}</p>}
        <TextInput
          label={dialog === "confirm" ? t.orders.confirmNote : t.orders.rejectReason}
          value={text}
          maxLength={255}
          required={dialog === "reject"}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
      </Modal>
    </Card>
  );
}
