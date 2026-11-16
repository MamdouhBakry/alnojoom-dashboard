import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Link } from "react-router";
import { Loader2, X } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import { ApiError } from "../lib/api";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------- buttons

type Variant = "primary" | "secondary" | "danger" | "ghost";
const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover disabled:bg-brand/50",
  secondary: "bg-white text-ink border border-line hover:border-brand/40 hover:bg-brand-subtle",
  danger: "bg-white text-red-700 border border-red-200 hover:bg-red-50",
  ghost: "text-muted hover:bg-brand-subtle hover:text-brand",
};

export function Button({
  variant = "primary",
  busy,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean; icon?: ReactNode }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || busy}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
    >
      {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

/** A router link that looks like a button (never nest a <button> inside an <a>). */
export function LinkButton({ to, variant = "primary", icon, children }: { to: string; variant?: Variant; icon?: ReactNode; children: ReactNode }) {
  return (
    <Link to={to} className={cx("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors", variants[variant])}>
      {icon}
      {children}
    </Link>
  );
}

export function IconButton({ label, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={cx("inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-brand-subtle hover:text-brand disabled:opacity-40", className)}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------- form fields

const inputBase =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:bg-cream";

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs text-red-700">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function TextInput({ label, hint, error, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <input id={id} {...rest} className={cx(inputBase, className)} aria-invalid={!!error} />
    </Field>
  );
}

export function TextArea({ label, hint, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <textarea id={id} rows={4} {...rest} className={cx(inputBase, "resize-y leading-relaxed", className)} />
    </Field>
  );
}

export function SelectInput({ label, hint, children, className, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <select id={id} {...rest} className={cx(inputBase, className)}>
        {children}
      </select>
    </Field>
  );
}

export function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={cx("flex cursor-pointer items-center gap-3 text-sm", disabled && "cursor-not-allowed opacity-60")}>
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {/* justify-end follows the text direction, so the knob moves the right way in RTL and LTR. */}
      <span className="flex h-6 w-11 shrink-0 items-center rounded-full bg-line p-0.5 transition-colors peer-checked:justify-end peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40">
        <span className="size-5 rounded-full bg-white shadow" />
      </span>
      <span className="font-medium">{label}</span>
    </label>
  );
}

export function Checkbox({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={cx("flex cursor-pointer items-center gap-2.5 text-sm", disabled && "cursor-not-allowed opacity-60")}>
      <input type="checkbox" className="size-4 accent-brand" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

// ---------------------------------------------------------------- layout bits

export function Card({ title, actions, children, className }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-2xl border border-line/70 bg-white p-5 shadow-[0_6px_22px_-4px_rgb(43_43_43/0.07)]", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-bold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

type Tone = "neutral" | "success" | "warning" | "danger" | "brand";
const tones: Record<Tone, string> = {
  neutral: "bg-cream text-muted",
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-700",
  brand: "bg-brand-subtle text-brand",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", tones[tone])}>{children}</span>;
}

export function Spinner({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted" role="status">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="text-sm">{label ?? t.common.loading}</span>
    </div>
  );
}

export function useErrorText() {
  const { t } = useI18n();
  return (err: unknown) => {
    const code = err instanceof ApiError ? err.code : "UNKNOWN";
    return t.errors[code] ?? t.errors.UNKNOWN!;
  };
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useI18n();
  const text = useErrorText();
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <span>{text(error)}</span>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t.common.retry}
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- modal

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className={cx("m-auto w-[calc(100%-2rem)] rounded-2xl border border-line bg-white p-0 text-ink shadow-2xl", wide ? "max-w-3xl" : "max-w-lg")}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-line/60 px-5 py-4">
            <h2 className="text-lg font-bold">{title}</h2>
            <IconButton label={t.common.close} onClick={onClose}>
              <X className="size-5" />
            </IconButton>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line/60 px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
