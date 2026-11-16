import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, KeyRound, Power, Copy, UserCog } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import type { StaffMember } from "../lib/types";
import { keys, useRoles } from "../lib/queries";
import { Badge, Button, Card, ErrorBox, IconButton, Modal, PageHeader, SelectInput, Spinner, TextInput, useErrorText } from "../components/ui";
import { useFeedback } from "../components/feedback";

export function StaffPage() {
  const { t, fmt, lang, formatDate } = useI18n();
  const { staff: me } = useAuth();
  const { toast, confirm } = useFeedback();
  const errorText = useErrorText();
  const qc = useQueryClient();
  const roles = useRoles();
  const list = useQuery({ queryKey: keys.staff, queryFn: () => api.get<StaffMember[]>("/staff") });

  const [creating, setCreating] = useState(false);
  const [roleFor, setRoleFor] = useState<StaffMember | null>(null);
  const [temp, setTemp] = useState<{ name: string; password: string } | null>(null);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: keys.staff });
    void qc.invalidateQueries({ queryKey: keys.roles });
  };

  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => api.patch<StaffMember>(`/staff/${id}`, body),
    onSuccess: () => {
      toast(t.common.saved);
      refresh();
    },
    onError: (err) => toast(errorText(err), "error"),
  });

  const reset = useMutation({
    mutationFn: (s: StaffMember) => api.post<{ temporaryPassword: string }>(`/staff/${s.id}/reset-password`),
    onSuccess: (res, s) => {
      setTemp({ name: s.name, password: res.temporaryPassword });
      refresh();
    },
    onError: (err) => toast(errorText(err), "error"),
  });

  const roleName = (r: StaffMember["role"]) => (lang === "ar" ? r.nameAr : r.nameEn);

  if (list.isPending) return <Spinner />;
  if (list.isError) return <ErrorBox error={list.error} onRetry={() => void list.refetch()} />;

  return (
    <>
      <PageHeader
        title={t.staff.title}
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
            {t.staff.new}
          </Button>
        }
      />
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-cream/60 text-xs text-muted">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">{t.staff.name}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.staff.role}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.staff.status}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.staff.lastLogin}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {list.data.map((s) => {
                const isMe = s.id === me?.id;
                const locked = s.lockedUntil && new Date(s.lockedUntil) > new Date();
                return (
                  <tr key={s.id} className="hover:bg-surface">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-bold">
                        {s.name}
                        {isMe && <Badge tone="brand">{t.staff.you}</Badge>}
                      </div>
                      <div className="ltr text-xs text-muted">{s.email}</div>
                    </td>
                    <td className="px-4 py-3">{roleName(s.role)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={s.isActive ? "success" : "neutral"}>{s.isActive ? t.common.active : t.staff.inactive}</Badge>
                        {locked && <Badge tone="danger">{t.staff.locked}</Badge>}
                        {s.mustChangePassword && <Badge tone="warning">{t.staff.pendingPassword}</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{s.lastLoginAt ? formatDate(s.lastLoginAt) : t.staff.never}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <IconButton label={t.staff.changeRole} disabled={isMe} onClick={() => setRoleFor(s)}>
                          <UserCog className="size-4" />
                        </IconButton>
                        <IconButton
                          label={t.staff.resetPassword}
                          onClick={async () => {
                            if (await confirm({ message: fmt(t.staff.resetConfirm, { name: s.name }), confirmLabel: t.staff.resetPassword })) reset.mutate(s);
                          }}
                        >
                          <KeyRound className="size-4" />
                        </IconButton>
                        <IconButton
                          label={s.isActive ? t.staff.deactivate : t.staff.activate}
                          disabled={isMe}
                          className={s.isActive ? "hover:bg-red-50 hover:text-red-700" : ""}
                          onClick={async () => {
                            if (!s.isActive) return update.mutate({ id: s.id, body: { isActive: true } });
                            if (await confirm({ message: fmt(t.staff.deactivateConfirm, { name: s.name }), confirmLabel: t.staff.deactivate, danger: true })) {
                              update.mutate({ id: s.id, body: { isActive: false } });
                            }
                          }}
                        >
                          <Power className="size-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {creating && (
        <CreateStaffDialog
          roles={roles.data ?? []}
          onClose={() => setCreating(false)}
          onCreated={(name, password) => {
            setCreating(false);
            setTemp({ name, password });
            refresh();
          }}
        />
      )}

      {roleFor && (
        <ChangeRoleDialog
          member={roleFor}
          roles={roles.data ?? []}
          onClose={() => setRoleFor(null)}
          onSave={(roleId) => update.mutate({ id: roleFor.id, body: { roleId } }, { onSuccess: () => setRoleFor(null) })}
          busy={update.isPending}
        />
      )}

      {temp && <TempPasswordDialog name={temp.name} password={temp.password} onClose={() => setTemp(null)} />}
    </>
  );
}

type RoleOption = { id: number; name: { ar: string; en: string } };

function CreateStaffDialog({ roles, onClose, onCreated }: { roles: RoleOption[]; onClose: () => void; onCreated: (name: string, password: string) => void }) {
  const { t, pick } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const create = useMutation({
    mutationFn: () => api.post<{ temporaryPassword: string }>("/staff", { name: name.trim(), email: email.trim(), roleId: Number(roleId) }),
    onSuccess: (res) => onCreated(name.trim(), res.temporaryPassword),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t.staff.new}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="staff-form" busy={create.isPending}>
            {t.common.create}
          </Button>
        </>
      }
    >
      <form id="staff-form" onSubmit={submit} className="space-y-4">
        {create.isError && <ErrorBox error={create.error} />}
        <TextInput label={t.staff.name} required minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <TextInput label={t.staff.email} type="email" dir="ltr" required maxLength={191} value={email} onChange={(e) => setEmail(e.target.value)} />
        <SelectInput label={t.staff.role} required value={roleId} onChange={(e) => setRoleId(e.target.value)}>
          <option value="" disabled>
            —
          </option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {pick(r.name)}
            </option>
          ))}
        </SelectInput>
      </form>
    </Modal>
  );
}

function ChangeRoleDialog({ member, roles, onClose, onSave, busy }: { member: StaffMember; roles: RoleOption[]; onClose: () => void; onSave: (roleId: number) => void; busy: boolean }) {
  const { t, pick } = useI18n();
  const [roleId, setRoleId] = useState(String(member.role.id));
  return (
    <Modal
      open
      onClose={onClose}
      title={`${t.staff.changeRole}: ${member.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button busy={busy} disabled={roleId === String(member.role.id)} onClick={() => onSave(Number(roleId))}>
            {t.common.save}
          </Button>
        </>
      }
    >
      <SelectInput label={t.staff.role} value={roleId} onChange={(e) => setRoleId(e.target.value)}>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {pick(r.name)}
          </option>
        ))}
      </SelectInput>
    </Modal>
  );
}

function TempPasswordDialog({ name, password, onClose }: { name: string; password: string; onClose: () => void }) {
  const { t, fmt } = useI18n();
  const { toast } = useFeedback();
  return (
    <Modal open onClose={onClose} title={t.staff.tempPasswordTitle} footer={<Button onClick={onClose}>{t.common.close}</Button>}>
      <p className="mb-4 text-sm leading-relaxed">{fmt(t.staff.tempPasswordBody, { name })}</p>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-cream/50 p-3">
        <code className="ltr flex-1 font-mono text-lg font-bold tracking-wider select-all">{password}</code>
        <Button
          variant="secondary"
          icon={<Copy className="size-4" />}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(password);
              toast(t.common.copied);
            } catch {
              /* clipboard blocked: the text is selectable */
            }
          }}
        >
          {t.common.copy}
        </Button>
      </div>
    </Modal>
  );
}
