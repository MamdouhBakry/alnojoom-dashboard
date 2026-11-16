import { Languages } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import { Button } from "./ui";

export function LanguageButton() {
  const { t, lang, setLang } = useI18n();
  return (
    <Button variant="ghost" onClick={() => setLang(lang === "ar" ? "en" : "ar")} icon={<Languages className="size-4" />} lang={lang === "ar" ? "en" : "ar"}>
      {t.nav.language}
    </Button>
  );
}
