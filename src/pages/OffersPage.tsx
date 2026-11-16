import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, ImagePlus, Link2, X } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import type { Offer, OfferSlot } from "../lib/types";
import { keys, useOffers } from "../lib/queries";
import { Badge, Button, ErrorBox, Modal, PageHeader, Spinner, TextInput, Toggle, cx, useErrorText } from "../components/ui";
import { useFeedback } from "../components/feedback";

type ImageField = "imageAr" | "imageEn" | "mobileImageAr" | "mobileImageEn";

export function OffersPage() {
  const { t, fmt, lang } = useI18n();
  const { toast, confirm } = useFeedback();
  const errorText = useErrorText();
  const qc = useQueryClient();
  const offers = useOffers();
  const [editing, setEditing] = useState<OfferSlot | null>(null);

  const clear = useMutation({
    mutationFn: (slot: number) => api.del(`/offers/${slot}`),
    onSuccess: () => {
      toast(t.offers.cleared);
      void qc.invalidateQueries({ queryKey: keys.offers });
    },
    onError: (err) => toast(errorText(err), "error"),
  });

  if (offers.isPending) return <Spinner />;
  if (offers.isError) return <ErrorBox error={offers.error} onRetry={() => void offers.refetch()} />;

  return (
    <>
      <PageHeader title={t.offers.title} subtitle={t.offers.subtitle} />
      <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {offers.data.map((s) => (
          <li key={s.slot} className="flex flex-col overflow-hidden rounded-2xl border border-line/70 bg-white">
            <div className="flex items-center justify-between gap-2 px-4 py-3">
              <span className="font-bold">{fmt(t.offers.slot, { slot: s.slot })}</span>
              {s.offer ? (
                <Badge tone={s.offer.isActive ? "success" : "neutral"}>{s.offer.isActive ? t.common.active : t.common.inactive}</Badge>
              ) : (
                <Badge>{t.offers.empty}</Badge>
              )}
            </div>
            {s.offer ? (
              <img src={lang === "ar" ? s.offer.image.ar : s.offer.image.en} alt={lang === "ar" ? s.offer.alt.ar : s.offer.alt.en} className={cx("aspect-[16/7] w-full bg-cream object-cover", !s.offer.isActive && "opacity-50 grayscale")} />
            ) : (
              <button type="button" onClick={() => setEditing(s)} className="flex aspect-[16/7] w-full flex-col items-center justify-center gap-2 bg-cream/60 text-muted hover:bg-brand-subtle hover:text-brand">
                <Plus className="size-6" />
                <span className="text-sm font-semibold">{t.offers.setUp}</span>
              </button>
            )}
            <div className="mt-auto flex items-center justify-between gap-2 px-4 py-3">
              <span className="flex min-w-0 items-center gap-1.5 truncate text-xs text-muted">
                {s.offer?.href && (
                  <>
                    <Link2 className="size-3.5 shrink-0" />
                    <span className="ltr truncate">{s.offer.href}</span>
                  </>
                )}
              </span>
              <div className="flex gap-2">
                {s.offer && (
                  <Button
                    variant="danger"
                    className="px-3"
                    aria-label={t.common.delete}
                    busy={clear.isPending && clear.variables === s.slot}
                    onClick={async () => {
                      if (await confirm({ message: fmt(t.offers.clearConfirm, { slot: s.slot }), confirmLabel: t.common.delete, danger: true })) clear.mutate(s.slot);
                    }}
                    icon={<Trash2 className="size-4" />}
                  />
                )}
                <Button variant="secondary" onClick={() => setEditing(s)} icon={s.offer ? <Pencil className="size-4" /> : <Plus className="size-4" />}>
                  {s.offer ? t.common.edit : t.offers.setUp}
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      {editing && <OfferDialog slot={editing.slot} offer={editing.offer} onClose={() => setEditing(null)} />}
    </>
  );
}

function ImagePicker({
  label,
  hint,
  currentUrl,
  file,
  onFile,
  onRemove,
  removed,
  required,
}: {
  label: string;
  hint?: string;
  currentUrl: string | null;
  file: File | null;
  onFile: (f: File | null) => void;
  onRemove?: () => void;
  removed?: boolean;
  required?: boolean;
}) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);
  const shown = preview ?? (removed ? null : currentUrl);

  return (
    <div className="space-y-1.5">
      <div className="text-sm font-semibold">
        {label}
        {required && <span className="text-brand"> *</span>}
      </div>
      <div className="overflow-hidden rounded-xl border border-dashed border-line bg-cream/40">
        {shown ? (
          <img src={shown} alt="" className="aspect-[16/7] w-full object-cover" />
        ) : (
          <div className="flex aspect-[16/7] items-center justify-center text-muted">
            <ImagePlus className="size-6" />
          </div>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => input.current?.click()}>
          {shown ? t.offers.replace : t.offers.choose}
        </Button>
        {file && <Badge tone="brand">{t.offers.newImage}</Badge>}
        {(file || (onRemove && currentUrl && !removed)) && (
          <Button
            variant="ghost"
            className="px-2 py-1.5 text-xs"
            icon={<X className="size-3.5" />}
            onClick={() => {
              if (file) onFile(null);
              else onRemove?.();
            }}
          >
            {t.offers.remove}
          </Button>
        )}
      </div>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

function OfferDialog({ slot, offer, onClose }: { slot: number; offer: Offer | null; onClose: () => void }) {
  const { t, fmt } = useI18n();
  const { toast } = useFeedback();
  const qc = useQueryClient();
  const [files, setFiles] = useState<Partial<Record<ImageField, File | null>>>({});
  const [removeMobile, setRemoveMobile] = useState({ ar: false, en: false });
  const [altAr, setAltAr] = useState(offer?.alt.ar ?? "");
  const [altEn, setAltEn] = useState(offer?.alt.en ?? "");
  const [href, setHref] = useState(offer?.href ?? "");
  const [isActive, setIsActive] = useState(offer?.isActive ?? true);

  const save = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      for (const [k, f] of Object.entries(files)) if (f) fd.append(k, f);
      fd.append("altAr", altAr.trim());
      fd.append("altEn", altEn.trim());
      fd.append("href", href.trim());
      fd.append("isActive", String(isActive));
      if (removeMobile.ar) fd.append("removeMobileImageAr", "true");
      if (removeMobile.en) fd.append("removeMobileImageEn", "true");
      return api.put<Offer>(`/offers/${slot}`, fd);
    },
    onSuccess: () => {
      toast(t.common.saved);
      void qc.invalidateQueries({ queryKey: keys.offers });
      onClose();
    },
  });

  const setFile = (field: ImageField) => (f: File | null) => setFiles((x) => ({ ...x, [field]: f }));
  const isNew = !offer;
  const missingImages = isNew && (!files.imageAr || !files.imageEn);

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={fmt(t.offers.slot, { slot })}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="offer-form" busy={save.isPending} disabled={missingImages}>
            {save.isPending ? t.common.saving : t.common.save}
          </Button>
        </>
      }
    >
      <form id="offer-form" onSubmit={submit} className="space-y-5">
        {save.isError && <ErrorBox error={save.error} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <ImagePicker label={t.offers.imageAr} required={isNew} currentUrl={offer?.image.ar ?? null} file={files.imageAr ?? null} onFile={setFile("imageAr")} />
          <ImagePicker label={t.offers.imageEn} required={isNew} currentUrl={offer?.image.en ?? null} file={files.imageEn ?? null} onFile={setFile("imageEn")} />
          <ImagePicker
            label={t.offers.mobileImageAr}
            hint={t.offers.mobileHint}
            currentUrl={offer?.mobileImage?.ar ?? null}
            file={files.mobileImageAr ?? null}
            onFile={(f) => {
              setFile("mobileImageAr")(f);
              if (f) setRemoveMobile((r) => ({ ...r, ar: false }));
            }}
            removed={removeMobile.ar}
            onRemove={() => setRemoveMobile((r) => ({ ...r, ar: true }))}
          />
          <ImagePicker
            label={t.offers.mobileImageEn}
            hint={t.offers.mobileHint}
            currentUrl={offer?.mobileImage?.en ?? null}
            file={files.mobileImageEn ?? null}
            onFile={(f) => {
              setFile("mobileImageEn")(f);
              if (f) setRemoveMobile((r) => ({ ...r, en: false }));
            }}
            removed={removeMobile.en}
            onRemove={() => setRemoveMobile((r) => ({ ...r, en: true }))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label={t.offers.altAr} hint={t.offers.altHint} dir="rtl" lang="ar" required minLength={2} maxLength={255} value={altAr} onChange={(e) => setAltAr(e.target.value)} />
          <TextInput label={t.offers.altEn} dir="ltr" lang="en" required minLength={2} maxLength={255} value={altEn} onChange={(e) => setAltEn(e.target.value)} />
        </div>
        <TextInput
          label={t.offers.href}
          hint={t.offers.hrefHint}
          dir="ltr"
          maxLength={255}
          placeholder="/products"
          pattern="(/[^/].*|/|https://\S+)?"
          value={href}
          onChange={(e) => setHref(e.target.value)}
        />
        <Toggle label={t.offers.isActive} checked={isActive} onChange={setIsActive} />
      </form>
    </Modal>
  );
}
