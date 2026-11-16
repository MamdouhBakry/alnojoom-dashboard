import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ar, en, type Messages } from "./messages";

export type Lang = "ar" | "en";
const STORAGE_KEY = "nj-dashboard-lang";

interface I18nValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: Messages;
  setLang: (lang: Lang) => void;
  /** Replaces {name} placeholders. */
  fmt: (template: string, vars: Record<string, string | number>) => string;
  /** Picks the field for the current language from a { ar, en } pair. */
  pick: (value: { ar: string; en: string } | null | undefined) => string;
  formatDate: (iso: string | null | undefined) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ar" || saved === "en") return saved;
  } catch {
    /* storage blocked */
  }
  return "ar";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.title = (lang === "ar" ? ar : en).appName;
  }, [lang, dir]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage blocked */
    }
  }, []);

  const value = useMemo<I18nValue>(() => {
    const t = lang === "ar" ? ar : en;
    const dateFmt = new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return {
      lang,
      dir,
      t,
      setLang,
      fmt: (template, vars) => template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? "")),
      pick: (v) => (v ? (lang === "ar" ? v.ar : v.en) || v.ar || v.en : ""),
      formatDate: (iso) => (iso ? dateFmt.format(new Date(iso)) : ""),
    };
  }, [lang, dir, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
