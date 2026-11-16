import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Package, EyeOff, Images } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import type { AdminProduct, Paged } from "../lib/types";
import { useErpConflicts, useOffers } from "../lib/queries";
import { PageHeader } from "../components/ui";

function Stat({ icon, value, label, to }: { icon: ReactNode; value: number | undefined; label: string; to: string }) {
  return (
    <Link to={to} className="flex items-center gap-4 rounded-2xl border border-line/70 bg-white p-5 transition-shadow hover:shadow-md">
      <span className="flex size-12 items-center justify-center rounded-xl bg-brand-subtle text-brand">{icon}</span>
      <span>
        <span className="ltr block text-2xl font-extrabold">{value ?? "…"}</span>
        <span className="text-sm text-muted">{label}</span>
      </span>
    </Link>
  );
}

export function HomePage() {
  const { t, fmt } = useI18n();
  const { staff, can } = useAuth();
  const canProducts = can("products.manage");
  const canOffers = can("offers.manage");

  const count = (status: "active" | "inactive") =>
    api.get<Paged<AdminProduct>>(`/products?status=${status}&pageSize=1`).then((r) => r.total);
  const active = useQuery({ queryKey: ["products", "count", "active"], queryFn: () => count("active"), enabled: canProducts });
  const hidden = useQuery({ queryKey: ["products", "count", "inactive"], queryFn: () => count("inactive"), enabled: canProducts });
  const offers = useOffers(canOffers);
  const conflicts = useErpConflicts(canProducts);

  return (
    <>
      <PageHeader title={fmt(t.home.welcome, { name: staff?.name ?? "" })} subtitle={t.home.subtitle} />

      {canProducts && !!conflicts.data?.length && (
        <div role="alert" className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <div className="mb-2 flex items-center gap-2 font-bold">
            <AlertTriangle className="size-5" />
            {t.home.erpWarningTitle}
          </div>
          <p className="mb-3 text-sm">{t.home.erpWarningBody}</p>
          <ul className="space-y-1 text-sm">
            {conflicts.data.map((c) => (
              <li key={c.erpName}>
                <strong>«{c.erpName}»</strong>:{" "}
                {c.products.map((p, i) => (
                  <span key={p.id}>
                    {i > 0 && "، "}
                    <Link to={`/products/${p.id}`} className="underline underline-offset-2 hover:text-brand">
                      {p.nameAr} <span className="ltr text-xs">({p.slug})</span>
                    </Link>
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {canProducts && <Stat icon={<Package className="size-6" />} value={active.data} label={t.home.productsCount} to="/products" />}
        {canProducts && <Stat icon={<EyeOff className="size-6" />} value={hidden.data} label={t.home.hiddenCount} to="/products" />}
        {canOffers && (
          <Stat
            icon={<Images className="size-6" />}
            value={offers.data?.filter((s) => s.offer?.isActive).length}
            label={t.home.offersCount}
            to="/offers"
          />
        )}
      </div>
    </>
  );
}
