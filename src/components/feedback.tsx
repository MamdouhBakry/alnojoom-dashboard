import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import { Button, Modal, cx } from "./ui";

interface Toast {
  id: number;
  text: string;
  tone: "success" | "error";
}

interface ConfirmOptions {
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface FeedbackValue {
  toast: (text: string, tone?: Toast["tone"]) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackValue | null>(null);

/** App-wide toasts and a promise-based confirm dialog. */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const nextId = useRef(1);

  const toast = useCallback((text: string, tone: Toast["tone"] = "success") => {
    const id = nextId.current++;
    setToasts((list) => [...list, { id, text, tone }]);
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), tone === "error" ? 6000 : 3500);
  }, []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setPending(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setPending(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <Modal
        open={!!pending}
        onClose={() => settle(false)}
        title={t.common.confirm}
        footer={
          <>
            <Button variant="secondary" onClick={() => settle(false)}>
              {t.common.cancel}
            </Button>
            <Button variant={pending?.danger ? "danger" : "primary"} onClick={() => settle(true)} autoFocus>
              {pending?.confirmLabel ?? t.common.confirm}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed">{pending?.message}</p>
      </Modal>
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((x) => (
          <div
            key={x.id}
            className={cx(
              "pointer-events-auto flex max-w-md items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg",
              x.tone === "success" ? "bg-ink text-white" : "bg-red-700 text-white",
            )}
          >
            {x.tone === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertTriangle className="size-4 shrink-0" />}
            {x.text}
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used inside FeedbackProvider");
  return ctx;
}
