import { useState, type ReactNode } from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router";
import { Home, Package, Images, Users, ShieldCheck, LogOut, Menu, KeyRound, ReceiptText, Contact, ChartColumn } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/I18nProvider";
import type { Permission } from "../lib/types";
import { LanguageButton } from "./LanguageButton";
import { Spinner, cx } from "./ui";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  permission?: Permission;
}

/** Signed-in shell: sidebar on desktop, drawer on mobile. Sends signed-out staff to /login. */
export function Layout() {
  const { t, pick } = useI18n();
  const { staff, loading, logout, can } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (loading) return <Spinner />;
  if (!staff) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (staff.mustChangePassword && location.pathname !== "/change-password") return <Navigate to="/change-password" replace />;

  const items: NavItem[] = [
    { to: "/", label: t.nav.home, icon: <Home className="size-5" /> },
    { to: "/orders", label: t.nav.orders, icon: <ReceiptText className="size-5" />, permission: "orders.view" },
    { to: "/customers", label: t.nav.customers, icon: <Contact className="size-5" />, permission: "customers.view" },
    { to: "/reports", label: t.nav.reports, icon: <ChartColumn className="size-5" />, permission: "reports.export" },
    { to: "/products", label: t.nav.products, icon: <Package className="size-5" />, permission: "products.manage" },
    { to: "/offers", label: t.nav.offers, icon: <Images className="size-5" />, permission: "offers.manage" },
    { to: "/staff", label: t.nav.staff, icon: <Users className="size-5" />, permission: "staff.manage" },
    { to: "/roles", label: t.nav.roles, icon: <ShieldCheck className="size-5" />, permission: "staff.manage" },
  ];
  const visible = items.filter((i) => !i.permission || can(i.permission));
  const locked = staff.mustChangePassword;

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {!locked &&
        visible.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.to === "/"}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                isActive ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white",
              )
            }
          >
            {i.icon}
            {i.label}
          </NavLink>
        ))}
    </nav>
  );

  const userBox = (
    <div className="border-t border-white/10 p-3 text-white">
      <div className="px-3 pb-2">
        <div className="truncate text-sm font-bold">{staff.name}</div>
        <div className="truncate text-xs text-white/60">{pick(staff.role.name)}</div>
      </div>
      {!locked && (
        <NavLink to="/change-password" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white">
          <KeyRound className="size-4" />
          {t.changePassword.title}
        </NavLink>
      )}
      <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white">
        <LogOut className="size-4 rtl:-scale-x-100" />
        {t.nav.logout}
      </button>
    </div>
  );

  const brand = (
    <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
      <img src={`${import.meta.env.BASE_URL}stars-meat-emblem-red.png`} alt="" className="size-10 rounded-lg bg-white p-1" />
      <div className="text-sm leading-tight font-bold text-white">{t.appName}</div>
    </div>
  );

  const sidebarClass = "flex w-64 flex-col bg-gradient-to-b from-brand to-brand-dark";

  return (
    <div className="flex min-h-screen">
      <aside className={cx(sidebarClass, "sticky top-0 hidden h-screen shrink-0 lg:flex")}>
        {brand}
        {nav}
        {userBox}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label={t.common.close} className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className={cx(sidebarClass, "absolute inset-y-0 start-0 shadow-2xl")}>
            {brand}
            {nav}
            {userBox}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line/60 bg-surface/90 px-4 py-3 backdrop-blur lg:px-8">
          <button type="button" onClick={() => setOpen(true)} className="inline-flex size-10 items-center justify-center rounded-lg text-ink hover:bg-brand-subtle lg:hidden" aria-label={t.nav.menu}>
            <Menu className="size-5" />
          </button>
          <div className="hidden text-sm text-muted lg:block">{t.company}</div>
          <LanguageButton />
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function RequirePermission({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { can } = useAuth();
  const { t } = useI18n();
  if (!can(permission)) return <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{t.errors.FORBIDDEN}</p>;
  return <>{children}</>;
}
