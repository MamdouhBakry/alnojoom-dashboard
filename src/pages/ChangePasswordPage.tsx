import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { KeyRound } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import type { CurrentStaff } from "../lib/types";
import { Button, Card, ErrorBox, TextInput } from "../components/ui";
import { useFeedback } from "../components/feedback";

const RULE = /^(?=.*[A-Za-z؀-ۿ])(?=.*\d).{10,128}$/;

export function ChangePasswordPage() {
  const { t } = useI18n();
  const { staff, setStaff } = useAuth();
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const mismatch = again.length > 0 && next !== again;
  const weak = next.length > 0 && !RULE.test(next);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (mismatch || weak) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ staff: CurrentStaff }>("/auth/change-password", { currentPassword: current, newPassword: next });
      setStaff(res.staff);
      toast(t.changePassword.done);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card title={t.changePassword.title}>
        {staff?.mustChangePassword && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{t.changePassword.forcedHint}</p>
        )}
        <form onSubmit={submit} className="space-y-4">
          {error != null && <ErrorBox error={error} />}
          <TextInput label={t.changePassword.current} type="password" autoComplete="current-password" dir="ltr" required value={current} onChange={(e) => setCurrent(e.target.value)} />
          <TextInput
            label={t.changePassword.new}
            type="password"
            autoComplete="new-password"
            dir="ltr"
            required
            value={next}
            onChange={(e) => setNext(e.target.value)}
            hint={t.changePassword.rule}
            error={weak ? t.changePassword.rule : undefined}
          />
          <TextInput
            label={t.changePassword.confirm}
            type="password"
            autoComplete="new-password"
            dir="ltr"
            required
            value={again}
            onChange={(e) => setAgain(e.target.value)}
            error={mismatch ? t.changePassword.mismatch : undefined}
          />
          <Button type="submit" busy={busy} disabled={mismatch || weak || !next} className="w-full" icon={<KeyRound className="size-4" />}>
            {t.changePassword.submit}
          </Button>
        </form>
      </Card>
    </div>
  );
}
