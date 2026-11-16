import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { LogIn } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/I18nProvider";
import { Button, ErrorBox, TextInput } from "../components/ui";
import { LanguageButton } from "../components/LanguageButton";

export function LoginPage() {
  const { t } = useI18n();
  const { staff, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const from = (location.state as { from?: string } | null)?.from ?? "/";
  if (staff) return <Navigate to={staff.mustChangePassword ? "/change-password" : from} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const me = await login(email, password);
      navigate(me.mustChangePassword ? "/change-password" : from, { replace: true });
    } catch (err) {
      setError(err);
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-cream to-surface px-4 py-10">
      <div className="absolute end-4 top-4">
        <LanguageButton />
      </div>
      <img src={`${import.meta.env.BASE_URL}stars-meat-logo-red.png`} alt={t.company} className="mb-6 h-20 w-auto" />
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-line/70 bg-white p-6 shadow-[0_16px_36px_-10px_rgb(142_31_45/0.2)]">
        <h1 className="text-center text-xl font-extrabold">{t.login.title}</h1>
        {error != null && <ErrorBox error={error} />}
        <TextInput
          label={t.login.email}
          type="email"
          autoComplete="username"
          required
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        <TextInput
          label={t.login.password}
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" busy={busy} className="w-full py-2.5" icon={<LogIn className="size-4" />}>
          {busy ? t.login.submitting : t.login.submit}
        </Button>
      </form>
    </div>
  );
}
