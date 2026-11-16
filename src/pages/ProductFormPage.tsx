import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ArrowLeft, Upload, Trash2, Star, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import type { AdminProduct } from "../lib/types";
import { keys, useLookups } from "../lib/queries";
import { Button, Card, ErrorBox, IconButton, PageHeader, SelectInput, Spinner, TextArea, TextInput, Toggle, useErrorText } from "../components/ui";
import { useFeedback } from "../components/feedback";

interface FormState {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  categoryId: string;
  groupId: string;
  originId: string;
  erpName: string;
  erpId: string;
  baseUnit: "kg" | "ton";
  isActive: boolean;
  isNew: boolean;
  sortOrder: string;
}

const empty: FormState = {
  nameAr: "",
  nameEn: "",
  descriptionAr: "",
  descriptionEn: "",
  categoryId: "",
  groupId: "",
  originId: "",
  erpName: "",
  erpId: "",
  baseUnit: "kg",
  isActive: false,
  isNew: false,
  sortOrder: "0",
};

function fromProduct(p: AdminProduct): FormState {
  return {
    nameAr: p.name.ar,
    nameEn: p.name.en,
    descriptionAr: p.description.ar,
    descriptionEn: p.description.en,
    categoryId: String(p.categoryId),
    groupId: p.groupId ? String(p.groupId) : "",
    originId: p.originId ? String(p.originId) : "",
    erpName: p.erpName ?? "",
    erpId: p.erpId ?? "",
    baseUnit: p.baseUnit,
    isActive: p.isActive,
    isNew: p.isNew,
    sortOrder: String(p.sortOrder),
  };
}

function toPayload(f: FormState) {
  return {
    nameAr: f.nameAr.trim(),
    nameEn: f.nameEn.trim(),
    descriptionAr: f.descriptionAr.trim() || null,
    descriptionEn: f.descriptionEn.trim() || null,
    categoryId: Number(f.categoryId),
    groupId: f.groupId ? Number(f.groupId) : null,
    originId: f.originId ? Number(f.originId) : null,
    erpName: f.erpName.trim() || null,
    erpId: f.erpId.trim() || null,
    baseUnit: f.baseUnit,
    isActive: f.isActive,
    isNew: f.isNew,
    sortOrder: Number(f.sortOrder) || 0,
  };
}

export function ProductFormPage() {
  const { id } = useParams();
  const productId = id && id !== "new" ? Number(id) : null;
  const { t, pick, dir } = useI18n();
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const lookups = useLookups();

  const product = useQuery({
    queryKey: keys.product(productId ?? 0),
    queryFn: () => api.get<AdminProduct>(`/products/${productId}`),
    enabled: productId !== null,
  });

  const [form, setForm] = useState<FormState>(empty);
  const loadedFor = useRef<number | null>(null);
  useEffect(() => {
    if (product.data && loadedFor.current !== product.data.id) {
      setForm(fromProduct(product.data));
      loadedFor.current = product.data.id;
    }
  }, [product.data]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: (payload: ReturnType<typeof toPayload>) =>
      productId ? api.patch<AdminProduct>(`/products/${productId}`, payload) : api.post<AdminProduct>("/products", payload),
    onSuccess: (saved) => {
      qc.setQueryData(keys.product(saved.id), saved);
      void qc.invalidateQueries({ queryKey: keys.products });
      if (productId) {
        toast(t.common.saved);
      } else {
        toast(t.productForm.created);
        navigate(`/products/${saved.id}`, { replace: true });
      }
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate(toPayload(form));
  }

  if (productId !== null && product.isPending) return <Spinner />;
  if (product.isError) return <ErrorBox error={product.error} onRetry={() => void product.refetch()} />;

  const groups = lookups.data?.groups.filter((g) => String(g.categoryId) === form.categoryId) ?? [];
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;
  const erpConflict = save.error && (save.error as { code?: string }).code === "ERP_NAME_TAKEN";

  return (
    <form onSubmit={submit}>
      <Link to="/products" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand">
        <Back className="size-4" />
        {t.nav.products}
      </Link>
      <PageHeader
        title={productId ? pick(product.data?.name) || t.productForm.editTitle : t.productForm.newTitle}
        subtitle={product.data ? <span className="ltr">/{product.data.slug}</span> : undefined}
        actions={
          <Button type="submit" busy={save.isPending}>
            {save.isPending ? t.common.saving : t.common.save}
          </Button>
        }
      />

      {save.isError && (
        <div className="mb-4">
          <ErrorBox error={save.error} />
        </div>
      )}

      {product.data?.erpNameConflict && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="size-4 shrink-0" />
          {t.productForm.conflictWarning}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card title={t.productForm.basics}>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label={t.productForm.nameAr} dir="rtl" lang="ar" required minLength={2} maxLength={200} value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
              <TextInput label={t.productForm.nameEn} dir="ltr" lang="en" required minLength={2} maxLength={200} value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
              <TextArea label={t.productForm.descriptionAr} dir="rtl" lang="ar" maxLength={5000} value={form.descriptionAr} onChange={(e) => set("descriptionAr", e.target.value)} />
              <TextArea label={t.productForm.descriptionEn} dir="ltr" lang="en" maxLength={5000} value={form.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} />
            </div>
          </Card>

          <Card title={t.productForm.erp}>
            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
              <TextInput
                label={t.productForm.erpName}
                hint={t.productForm.erpNameHint}
                error={erpConflict ? t.errors.ERP_NAME_TAKEN : undefined}
                maxLength={200}
                value={form.erpName}
                onChange={(e) => set("erpName", e.target.value)}
              />
              <TextInput label={t.productForm.erpId} hint={t.productForm.erpIdHint} dir="ltr" maxLength={80} value={form.erpId} onChange={(e) => set("erpId", e.target.value)} />
            </div>
          </Card>

          {productId ? <ImagesCard product={product.data!} /> : <Card title={t.productForm.images}><p className="text-sm text-muted">{t.productForm.imagesAfterSave}</p></Card>}
        </div>

        <div className="space-y-4">
          <Card title={t.productForm.classification}>
            <div className="space-y-4">
              <SelectInput
                label={t.productForm.category}
                required
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value, groupId: "" }))}
              >
                <option value="" disabled>
                  —
                </option>
                {lookups.data?.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {pick(c.name)}
                  </option>
                ))}
              </SelectInput>
              <SelectInput label={t.productForm.group} value={form.groupId} onChange={(e) => set("groupId", e.target.value)} disabled={!form.categoryId}>
                <option value="">{t.productForm.noGroup}</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {pick(g.name)}
                  </option>
                ))}
              </SelectInput>
              <SelectInput label={t.productForm.origin} value={form.originId} onChange={(e) => set("originId", e.target.value)}>
                <option value="">{t.productForm.noOrigin}</option>
                {lookups.data?.origins.map((o) => (
                  <option key={o.id} value={o.id}>
                    {pick(o.name)}
                  </option>
                ))}
              </SelectInput>
            </div>
          </Card>

          <Card title={t.productForm.display}>
            <div className="space-y-4">
              <Toggle label={t.productForm.isActive} checked={form.isActive} onChange={(v) => set("isActive", v)} />
              <Toggle label={t.productForm.isNew} checked={form.isNew} onChange={(v) => set("isNew", v)} />
              <SelectInput label={t.productForm.baseUnit} value={form.baseUnit} onChange={(e) => set("baseUnit", e.target.value as "kg" | "ton")}>
                <option value="kg">{t.productForm.unitKg}</option>
                <option value="ton">{t.productForm.unitTon}</option>
              </SelectInput>
              <TextInput label={t.productForm.sortOrder} type="number" min={0} max={100000} dir="ltr" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
              {product.data && <TextInput label={t.productForm.slug} hint={t.productForm.slugHint} dir="ltr" value={product.data.slug} readOnly disabled />}
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}

function ImagesCard({ product }: { product: AdminProduct }) {
  const { t } = useI18n();
  const { toast, confirm } = useFeedback();
  const errorText = useErrorText();
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const onSaved = (p: AdminProduct) => {
    qc.setQueryData(keys.product(p.id), p);
    void qc.invalidateQueries({ queryKey: [...keys.products, "list"] });
  };
  const onError = (err: unknown) => toast(errorText(err), "error");

  const upload = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("altAr", product.name.ar);
      fd.append("altEn", product.name.en);
      return api.post<AdminProduct>(`/products/${product.id}/images`, fd);
    },
    onSuccess: onSaved,
    onError,
  });

  const reorder = useMutation({
    mutationFn: (imageIds: number[]) => api.put<AdminProduct>(`/products/${product.id}/images/order`, { imageIds }),
    onSuccess: onSaved,
    onError,
  });

  const remove = useMutation({
    mutationFn: (imageId: number) => api.del<AdminProduct>(`/products/${product.id}/images/${imageId}`),
    onSuccess: onSaved,
    onError,
  });

  const ids = product.images.map((i) => i.id);
  const move = (from: number, to: number) => {
    const next = [...ids];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    reorder.mutate(next);
  };
  const busy = upload.isPending || reorder.isPending || remove.isPending;

  return (
    <Card
      title={t.productForm.images}
      actions={
        <>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload.mutate(file);
              e.target.value = "";
            }}
          />
          <Button variant="secondary" busy={upload.isPending} onClick={() => fileInput.current?.click()} icon={<Upload className="size-4" />}>
            {upload.isPending ? t.productForm.uploading : t.productForm.upload}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-xs text-muted">{t.productForm.imagesHint}</p>
      {product.images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {product.images.map((img, i) => (
            <li key={img.id} className="overflow-hidden rounded-xl border border-line/70 bg-white">
              <div className="relative">
                <img src={img.url} alt={img.alt.ar} className="aspect-square w-full object-cover" />
                {i === 0 && (
                  <span className="absolute start-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">1</span>
                )}
              </div>
              <div className="flex items-center justify-center gap-0.5 p-1">
                {i > 0 && (
                  <IconButton label={t.productForm.makeFirst} disabled={busy} onClick={() => move(i, 0)}>
                    <Star className="size-4" />
                  </IconButton>
                )}
                <IconButton label={t.productForm.moveUp} disabled={busy || i === 0} onClick={() => move(i, i - 1)}>
                  <ChevronUp className="size-4" />
                </IconButton>
                <IconButton label={t.productForm.moveDown} disabled={busy || i === ids.length - 1} onClick={() => move(i, i + 1)}>
                  <ChevronDown className="size-4" />
                </IconButton>
                <IconButton
                  label={t.common.delete}
                  disabled={busy}
                  className="hover:bg-red-50 hover:text-red-700"
                  onClick={async () => {
                    if (await confirm({ message: t.productForm.deleteImageConfirm, confirmLabel: t.common.delete, danger: true })) remove.mutate(img.id);
                  }}
                >
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
