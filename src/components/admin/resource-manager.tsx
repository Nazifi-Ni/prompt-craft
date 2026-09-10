import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Row = Record<string, unknown>;

export type FieldType = "text" | "textarea" | "number" | "select" | "switch" | "csv" | "json";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  help?: string;
};

export type ResourceManagerProps = {
  table: string;
  title: string;
  description: string;
  fields: Field[];
  defaults: Row;
  orderBy: string;
  columns: { name: string; label: string }[];
  primaryKey?: string;
  editableKey?: boolean;
};

function toFormValue(field: Field, value: unknown): string | boolean {
  if (field.type === "switch") return Boolean(value);
  if (field.type === "csv") return Array.isArray(value) ? value.join(", ") : "";
  if (field.type === "json") return value == null ? "" : JSON.stringify(value, null, 2);
  if (value == null) return "";
  return String(value);
}

function fromFormValue(field: Field, value: string | boolean): unknown {
  if (field.type === "switch") return Boolean(value);
  const text = typeof value === "string" ? value.trim() : "";
  if (field.type === "csv")
    return text
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  if (field.type === "json") return text === "" ? {} : JSON.parse(text);
  if (field.type === "number") return text === "" ? 0 : Number(text);
  return text === "" ? null : text;
}

export function ResourceManager({
  table,
  title,
  description,
  fields,
  defaults,
  orderBy,
  columns,
  primaryKey = "id",
  editableKey = false,
}: ResourceManagerProps) {
  const queryClient = useQueryClient();
  const client = supabase as unknown as {
    from: (t: string) => any;
  };
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>({});

  const listQuery = useQuery({
    queryKey: ["admin", table],
    queryFn: async () => {
      const { data, error } = await client.from(table).select("*").order(orderBy);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const rows = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  function openCreate() {
    setEditing(null);
    setForm(
      Object.fromEntries(fields.map((f) => [f.name, toFormValue(f, defaults[f.name] ?? null)])),
    );
    setOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setForm(Object.fromEntries(fields.map((f) => [f.name, toFormValue(f, row[f.name])])));
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload: Row = { ...defaults };
      for (const field of fields) {
        payload[field.name] = fromFormValue(field, form[field.name] ?? "");
      }
      for (const field of fields) {
        if (field.required && (payload[field.name] === null || payload[field.name] === "")) {
          throw new Error(`${field.label} is required`);
        }
      }
      if (editing) {
        if (!editableKey) delete payload[primaryKey];
        const { error } = await client
          .from(table)
          .update(payload)
          .eq(primaryKey, editing[primaryKey]);
        if (error) throw error;
      } else {
        const { error } = await client.from(table).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? `${title} updated` : `${title} created`);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", table] });
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Save failed"),
  });

  const remove = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await client.from(table).delete().eq(primaryKey, row[primaryKey]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", table] });
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Delete failed"),
  });

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button onClick={openCreate} size="sm" className="rounded-full">
          <Plus className="mr-1.5 size-4" /> New
        </Button>
      </div>

      <div className="ledger-card mt-6 overflow-x-auto">
        {listQuery.isLoading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        ) : listQuery.error ? (
          <p className="p-5 text-sm text-destructive">
            {listQuery.error instanceof Error ? listQuery.error.message : "Could not load records"}
          </p>
        ) : rows.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No records yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/70 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {columns.map((c) => (
                  <th key={c.name} className="px-4 py-3 font-medium">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row[primaryKey])} className="border-b border-border/50 last:border-0">
                  {columns.map((c) => (
                    <td key={c.name} className="max-w-[22rem] truncate px-4 py-3 text-foreground">
                      {Array.isArray(row[c.name])
                        ? (row[c.name] as unknown[]).join(", ")
                        : typeof row[c.name] === "boolean"
                          ? row[c.name]
                            ? "Yes"
                            : "No"
                          : row[c.name] == null
                            ? "—"
                            : String(row[c.name])}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this record?")) remove.mutate(row);
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${title}` : `New ${title}`}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.type === "switch" ? (
                  <div className="flex items-center gap-2">
                    <Switch
                      id={field.name}
                      checked={Boolean(form[field.name])}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({ ...prev, [field.name]: checked }))
                      }
                    />
                    <span className="text-sm text-muted-foreground">{field.help}</span>
                  </div>
                ) : field.type === "select" ? (
                  <select
                    id={field.name}
                    value={String(form[field.name] ?? "")}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {(field.options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" || field.type === "json" ? (
                  <Textarea
                    id={field.name}
                    rows={field.type === "json" ? 8 : 4}
                    value={String(form[field.name] ?? "")}
                    placeholder={field.placeholder}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    className={field.type === "json" ? "font-mono text-xs" : undefined}
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type === "number" ? "number" : "text"}
                    value={String(form[field.name] ?? "")}
                    placeholder={field.placeholder}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  />
                )}
                {field.help && field.type !== "switch" && (
                  <p className="text-xs text-muted-foreground">{field.help}</p>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-full">
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
