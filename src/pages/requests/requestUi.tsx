import { useEffect, useState, type ReactNode } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { api } from "../../lib/api";
import type { RequestList, RequestStatus } from "../../lib/types";
import { Badge, Button, Card, SelectInput, TextArea, cx, useErrorText } from "../../components/ui";
import { useFeedback } from "../../components/feedback";

/** Admin API paths for the two kinds of website requests. */
export type RequestKind = "messages" | "quote-requests";

export const REQUEST_STATUSES: RequestStatus[] = ["new", "in_progress", "closed", "spam"];
const TABS: (RequestStatus | "all")[] = ["all", ...REQUEST_STATUSES];
const PAGE_SIZE = 25;

const tone: Record<RequestStatus, "brand" | "warning" | "success" | "neutral"> = {
  new: "brand",
  in_progress: "warning",
  closed: "success",
  spam: "neutral",
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const { t } = useI18n();
  return <Badge tone={tone[status]}>{t.requests.status[status]}</Badge>;
}

export function CaptchaBadge() {
  const { t } = useI18n();
  return (
    <span title={t.requests.captchaUnverifiedHint}>
      <Badge tone="danger">
        <AlertTriangle className="size-3" aria-hidden />
        {t.requests.captchaUnverified}
      </Badge>
    </span>
  );
}

/** Status tabs + search + paging state and the list query for one kind of request. */
export function useRequestList<T>(kind: RequestKind) {
  const [status, setStatus] = useState<RequestStatus | "all">("all");
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
    queryKey: [kind, "list", params.toString()],
    queryFn: () => api.get<RequestList<T>>(`/${kind}?${params}`),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
  const pages = list.data ? Math.max(1, Math.ceil(list.data.total / PAGE_SIZE)) : 1;
  return { list, status, setStatus, search, setSearch, page, setPage, pages };
}

export function StatusTabs({
  value,
  onChange,
  counts,
}: {
  value: RequestStatus | "all";
  onChange: (s: RequestStatus | "all") => void;
  counts: Partial<Record<RequestStatus, number>>;
}) {
  const { t } = useI18n();
  // "All" excludes spam, like the API.
  const allCount = REQUEST_STATUSES.filter((s) => s !== "spam").reduce((a, s) => a + (counts[s] ?? 0), 0);
  return (
    <div className="mb-4 flex flex-wrap gap-2" role="tablist">
      {TABS.map((s) => {
        const n = s === "all" ? allCount : (counts[s] ?? 0);
        return (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={value === s}
            onClick={() => onChange(s)}
            className={cx(
              "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              value === s ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand/40",
              s === "new" && n > 0 && value !== s && "border-brand/30 bg-brand-subtle",
            )}
          >
            {s === "all" ? t.requests.allTab : t.requests.status[s]}
            <span className={cx("ltr rounded-full px-1.5 text-xs", value === s ? "bg-white/20" : "bg-cream")}>{n}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const { t } = useI18n();
  return (
    <Card className="mb-4">
      <label className="relative block">
        <span className="sr-only">{t.common.search}</span>
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-line bg-white py-2 ps-9 pe-3 text-sm focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none"
        />
      </label>
    </Card>
  );
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  const { t, fmt, dir } = useI18n();
  if (pages <= 1) return null;
  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line/50 px-4 py-3 text-sm">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)} icon={<Prev className="size-4" />}>
        {t.common.previous}
      </Button>
      <span className="text-muted">{fmt(t.common.pageOf, { page, pages })}</span>
      <Button variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        {t.common.next}
        <Next className="size-4" />
      </Button>
    </div>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 text-end font-medium">{children}</dd>
    </div>
  );
}

/** wa.me link from an E.164 number (+9665XXXXXXXX → 9665XXXXXXXX). */
export function whatsappUrl(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

/** Status + internal note, saved together. Records who changed it (shown under the form). */
export function FollowUpCard({
  kind,
  id,
  status,
  staffNote,
  handledBy,
  handledAt,
}: {
  kind: RequestKind;
  id: number;
  status: RequestStatus;
  staffNote: string | null;
  handledBy: { name: string | null } | null;
  handledAt: string | null;
}) {
  const { t, formatDate } = useI18n();
  const { toast } = useFeedback();
  const errorText = useErrorText();
  const qc = useQueryClient();
  const [nextStatus, setNextStatus] = useState<RequestStatus>(status);
  const [note, setNote] = useState(staffNote ?? "");
  const dirty = nextStatus !== status || note.trim() !== (staffNote ?? "");

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/${kind}/${id}`, {
        ...(nextStatus !== status ? { status: nextStatus } : {}),
        ...(note.trim() !== (staffNote ?? "") ? { staffNote: note.trim() || null } : {}),
      }),
    onSuccess: () => {
      toast(t.common.saved);
      void qc.invalidateQueries({ queryKey: [kind] });
      void qc.invalidateQueries({ queryKey: ["requests", "counts"] });
    },
    onError: (err) => toast(errorText(err), "error"),
  });

  return (
    <Card title={t.requests.followUp}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (dirty) save.mutate();
        }}
      >
        <SelectInput label={t.requests.statusLabel} value={nextStatus} onChange={(e) => setNextStatus(e.target.value as RequestStatus)}>
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t.requests.status[s]}
            </option>
          ))}
        </SelectInput>
        <TextArea label={t.requests.note} hint={t.requests.noteHint} value={note} maxLength={4000} onChange={(e) => setNote(e.target.value)} />
        <Button type="submit" busy={save.isPending} disabled={!dirty}>
          {save.isPending ? t.common.saving : t.common.save}
        </Button>
        {handledAt && (
          <p className="text-xs text-muted">
            {t.requests.lastUpdate} <bdi>{handledBy?.name ?? t.common.none}</bdi> · <bdi>{formatDate(handledAt)}</bdi>
          </p>
        )}
      </form>
    </Card>
  );
}
