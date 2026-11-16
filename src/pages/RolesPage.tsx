import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Lock, Check } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import { api } from "../lib/api";
import type { Permission, Role } from "../lib/types";
import { keys, useRoles } from "../lib/queries";
import { Badge, Button, Card, Checkbox, ErrorBox, IconButton, Modal, PageHeader, Spinner, TextInput, useErrorText } from "../components/ui";
import { useFeedback } from "../components/feedback";

export function RolesPage() {
  const { t, fmt, pick } = useI18n();
  const { toast, confirm } = useFeedback();
  const errorText = useErrorText();
  const qc = useQueryClient();
  const roles = useRoles();
  const permissions = useQuery({ queryKey: keys.permissions, queryFn: () => api.get<Permission[]>("/permissions"), staleTime: Infinity });
  const [editing, setEditing] = useState<Role | "new" | null>(null);

  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/roles/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.roles }),
    onError: (err) => toast(errorText(err), "error"),
  });

  if (roles.isPending || permissions.isPending) return <Spinner />;
  if (roles.isError) return <ErrorBox error={roles.error} onRetry={() => void roles.refetch()} />;
  if (permissions.isError) return <ErrorBox error={permissions.error} onRetry={() => void permissions.refetch()} />;

  return (
    <>
      <PageHeader
        title={t.roles.title}
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>
            {t.roles.new}
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {roles.data.map((r) => (
          <Card
            key={r.id}
            title={pick(r.name)}
            actions={
              r.isSystem ? (
                <Lock className="size-4 text-muted" aria-label={t.roles.system} />
              ) : (
                <div className="flex gap-1">
                  <IconButton label={t.common.edit} onClick={() => setEditing(r)}>
                    <Pencil className="size-4" />
                  </IconButton>
                  <IconButton
                    label={t.common.delete}
                    className="hover:bg-red-50 hover:text-red-700"
                    onClick={async () => {
                      if (await confirm({ message: fmt(t.roles.deleteConfirm, { name: pick(r.name) }), confirmLabel: t.common.delete, danger: true })) remove.mutate(r.id);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              )
            }
          >
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
              <code className="ltr rounded bg-cream px-1.5 py-0.5">{r.key}</code>
              <Badge>{fmt(t.roles.staffCount, { count: r.staffCount })}</Badge>
              {r.isSystem && <Badge tone="brand">{t.roles.system}</Badge>}
            </div>
            <ul className="space-y-1.5 text-sm">
              {permissions.data.map((p) => {
                const has = r.permissions.includes(p);
                return (
                  <li key={p} className={has ? "flex items-center gap-2" : "flex items-center gap-2 text-muted/60 line-through"}>
                    <Check className={has ? "size-4 text-emerald-600" : "size-4 opacity-0"} aria-hidden />
                    {t.permissions[p] ?? p}
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>
      {editing && <RoleDialog role={editing === "new" ? null : editing} permissions={permissions.data} onClose={() => setEditing(null)} />}
    </>
  );
}

function RoleDialog({ role, permissions, onClose }: { role: Role | null; permissions: Permission[]; onClose: () => void }) {
  const { t } = useI18n();
  const { toast } = useFeedback();
  const qc = useQueryClient();
  const [key, setKey] = useState("");
  const [nameAr, setNameAr] = useState(role?.name.ar ?? "");
  const [nameEn, setNameEn] = useState(role?.name.en ?? "");
  const [perms, setPerms] = useState<Set<Permission>>(new Set(role?.permissions ?? []));

  const save = useMutation({
    mutationFn: () => {
      const body = { nameAr: nameAr.trim(), nameEn: nameEn.trim(), permissions: [...perms] };
      return role ? api.patch<Role>(`/roles/${role.id}`, body) : api.post<Role>("/roles", { ...body, key: key.trim() });
    },
    onSuccess: () => {
      toast(t.common.saved);
      void qc.invalidateQueries({ queryKey: keys.roles });
      void qc.invalidateQueries({ queryKey: ["auth"] });
      onClose();
    },
  });

  const toggle = (p: Permission, on: boolean) =>
    setPerms((s) => {
      const next = new Set(s);
      if (on) next.add(p);
      else next.delete(p);
      return next;
    });

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={role ? t.common.edit : t.roles.new}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="role-form" busy={save.isPending}>
            {t.common.save}
          </Button>
        </>
      }
    >
      <form id="role-form" onSubmit={submit} className="space-y-4">
        {save.isError && <ErrorBox error={save.error} />}
        {!role && (
          <TextInput label={t.roles.key} hint={t.roles.keyHint} dir="ltr" required pattern="[a-z][a-z0-9_\-]{1,39}" value={key} onChange={(e) => setKey(e.target.value.toLowerCase())} />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label={t.roles.nameAr} dir="rtl" required minLength={2} maxLength={80} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
          <TextInput label={t.roles.nameEn} dir="ltr" required minLength={2} maxLength={80} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
        </div>
        <fieldset className="space-y-2.5">
          <legend className="mb-2 text-sm font-semibold">{t.roles.permissions}</legend>
          {permissions.map((p) => (
            <Checkbox key={p} label={t.permissions[p] ?? p} checked={perms.has(p)} onChange={(on) => toggle(p, on)} />
          ))}
        </fieldset>
      </form>
    </Modal>
  );
}
