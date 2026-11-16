import { useEffect, useState } from "react";
import { Link } from "react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, RotateCcw, Search, ImageOff, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import type { AdminProduct, Paged } from "../lib/types";
import { keys, useLookups } from "../lib/queries";
import { Badge, Button, Card, ErrorBox, IconButton, LinkButton, PageHeader, Spinner, cx, useErrorText } from "../components/ui";
import { useFeedback } from "../components/feedback";

type Status = "all" | "active" | "inactive" | "deleted";
const PAGE_SIZE = 25;

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function ProductsPage() {
  const { t, pick, fmt, dir, lang } = useI18n();
  const { toast, confirm } = useFeedback();
  const errorText = useErrorText();
  const qc = useQueryClient();
  const lookups = useLookups();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search.trim());

  useEffect(() => setPage(1), [debounced, categoryId, status]);

  const params = new URLSearchParams({ status, page: String(page), pageSize: String(PAGE_SIZE) });
  if (debounced) params.set("search", debounced);
  if (categoryId) params.set("categoryId", categoryId);

  const list = useQuery({
    queryKey: [...keys.products, "list", params.toString()],
    queryFn: () => api.get<Paged<AdminProduct>>(`/products?${params}`),
    placeholderData: keepPreviousData,
  });

  const action = useMutation({
    mutationFn: ({ p, kind }: { p: AdminProduct; kind: "delete" | "restore" }) =>
      kind === "delete" ? api.del<AdminProduct>(`/products/${p.id}`) : api.post<AdminProduct>(`/products/${p.id}/restore`),
    onSuccess: (_d, { kind }) => {
      toast(kind === "delete" ? t.products.deletedToast : t.products.restoredToast);
      void qc.invalidateQueries({ queryKey: keys.products });
    },
    onError: (err) => toast(errorText(err), "error"),
  });

  async function remove(p: AdminProduct) {
    if (await confirm({ message: fmt(t.products.deleteConfirm, { name: pick(p.name) }), confirmLabel: t.common.delete, danger: true })) {
      action.mutate({ p, kind: "delete" });
    }
  }
  async function restore(p: AdminProduct) {
    if (await confirm({ message: fmt(t.products.restoreConfirm, { name: pick(p.name) }), confirmLabel: t.products.restore })) {
      action.mutate({ p, kind: "restore" });
    }
  }

  const categoryName = (id: number) => pick(lookups.data?.categories.find((c) => c.id === id)?.name);
  const originName = (id: number) => pick(lookups.data?.origins.find((o) => o.id === id)?.name);
  const pages = list.data ? Math.max(1, Math.ceil(list.data.total / PAGE_SIZE)) : 1;
  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <>
      <PageHeader
        title={t.products.title}
        actions={
          <LinkButton to="/products/new" icon={<Plus className="size-4" />}>
            {t.products.new}
          </LinkButton>
        }
      />

      <Card className="mb-4">
        <div className="grid gap-3 md:grid-cols-[1fr_200px_180px]">
          <label className="relative block">
            <span className="sr-only">{t.common.search}</span>
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.products.searchPlaceholder}
              className="w-full rounded-lg border border-line bg-white py-2 ps-9 pe-3 text-sm focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none"
            />
          </label>
          <select aria-label={t.products.category} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
            <option value="">{`${t.products.category}: ${t.common.all}`}</option>
            {lookups.data?.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {pick(c.name)}
              </option>
            ))}
          </select>
          <select aria-label={t.products.status} value={status} onChange={(e) => setStatus(e.target.value as Status)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
            <option value="all">{`${t.products.status}: ${t.common.all}`}</option>
            <option value="active">{t.common.active}</option>
            <option value="inactive">{t.common.inactive}</option>
            <option value="deleted">{t.common.deleted}</option>
          </select>
        </div>
      </Card>

      {list.isError && <ErrorBox error={list.error} onRetry={() => void list.refetch()} />}
      {list.isPending && <Spinner />}

      {list.data && (
        <Card className="overflow-hidden p-0">
          {list.data.items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">{t.products.empty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className={cx("w-full min-w-[720px] text-sm", list.isFetching && "opacity-60")}>
                <thead className="bg-cream/60 text-start text-xs text-muted">
                  <tr>
                    <th className="px-4 py-3 text-start font-semibold">{t.products.columns.product}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t.products.columns.category}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t.products.columns.erpName}</th>
                    <th className="px-4 py-3 text-start font-semibold">{t.products.columns.status}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {list.data.items.map((p) => (
                    <tr key={p.id} className="hover:bg-surface">
                      <td className="px-4 py-3">
                        <Link to={`/products/${p.id}`} className="flex items-center gap-3">
                          {p.images[0] ? (
                            <img src={p.images[0].url} alt="" loading="lazy" className="size-12 shrink-0 rounded-lg object-cover" />
                          ) : (
                            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-cream text-muted">
                              <ImageOff className="size-5" />
                            </span>
                          )}
                          <span className="min-w-0">
                            <span className="block font-bold hover:text-brand">{pick(p.name)}</span>
                            <span className="block truncate text-xs text-muted" lang={lang === "ar" ? "en" : "ar"}>
                              {lang === "ar" ? p.name.en : p.name.ar}
                            </span>
                          </span>
                          {p.isNew && <Badge tone="brand">{t.products.newBadge}</Badge>}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {categoryName(p.categoryId)}
                        {p.originId && <span className="block text-xs text-muted">{originName(p.originId)}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {p.erpName ? <span>{p.erpName}</span> : <Badge tone="warning">{t.products.erpMissing}</Badge>}
                        {p.erpNameConflict && (
                          <div className="mt-1">
                            <Badge tone="danger">{t.products.erpConflict}</Badge>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.deletedAt ? (
                          <Badge tone="danger">{t.common.deleted}</Badge>
                        ) : p.isActive ? (
                          <Badge tone="success">{t.common.active}</Badge>
                        ) : (
                          <Badge>{t.common.inactive}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {p.deletedAt ? (
                            <IconButton label={t.products.restore} onClick={() => void restore(p)}>
                              <RotateCcw className="size-4" />
                            </IconButton>
                          ) : (
                            <>
                              <Link to={`/products/${p.id}`} aria-label={t.common.edit} title={t.common.edit} className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-brand-subtle hover:text-brand">
                                <Pencil className="size-4" />
                              </Link>
                              <IconButton label={t.common.delete} onClick={() => void remove(p)} className="hover:bg-red-50 hover:text-red-700">
                                <Trash2 className="size-4" />
                              </IconButton>
                            </>
                          )}
                        </div>
                      </td>
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
