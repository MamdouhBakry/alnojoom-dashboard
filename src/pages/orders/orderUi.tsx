import { useI18n } from "../../i18n/I18nProvider";
import type { ErpStatus, OrderStatus, PaymentStatus } from "../../lib/types";
import { Badge } from "../../components/ui";

type Tone = "neutral" | "success" | "warning" | "danger" | "brand";

const orderTone: Record<OrderStatus, Tone> = {
  awaiting_payment: "neutral",
  awaiting_transfer: "neutral",
  transfer_review: "warning",
  paid: "success",
  cancelled: "danger",
};
const paymentTone: Record<PaymentStatus, Tone> = {
  initiated: "neutral",
  paid: "success",
  failed: "danger",
  awaiting_receipt: "neutral",
  pending_review: "warning",
  rejected: "danger",
  cancelled: "neutral",
  refunded: "danger",
};
const erpTone: Record<ErpStatus, Tone> = { not_sent: "neutral", pending: "warning", synced: "success", failed: "danger" };

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useI18n();
  return <Badge tone={orderTone[status]}>{t.orders.status[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { t } = useI18n();
  return <Badge tone={paymentTone[status]}>{t.orders.paymentStatus[status]}</Badge>;
}

export function ErpStatusBadge({ status }: { status: ErpStatus }) {
  const { t } = useI18n();
  return <Badge tone={erpTone[status]}>{t.orders.erpStatus[status]}</Badge>;
}

/** "1,234.50 ر.س" — digits always Latin, wrapped LTR by the caller's `ltr` class. */
export function useMoney() {
  const { t } = useI18n();
  const nf = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n: number) => `${nf.format(n)} ${t.orders.sar}`;
}
