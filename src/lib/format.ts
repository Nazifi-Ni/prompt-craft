export function formatPrice(amount: number, currency = "NGN") {
  if (!amount) return "Free";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export type PromptVariable = {
  name: string;
  label: string | undefined;
  type: "text" | "textarea" | "select" | undefined;
  placeholder: string | undefined;
  options: string[] | undefined;
  required: boolean;
  help: string | undefined;
};

export function parseVariables(raw: unknown): PromptVariable[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
    .map((v) => ({
      name: String(v['name'] ?? v['key'] ?? ""),
      label: v['label'] ? String(v['label']) : undefined,
      type: (v['type'] as PromptVariable["type"]) ?? "text",
      placeholder: v['placeholder'] ? String(v['placeholder']) : undefined,
      options: Array.isArray(v['options']) ? v['options'].map(String) : undefined,
      required: v['required'] === true,
      help: v['help'] ? String(v['help']) : undefined,
    }))
    .filter((v) => v.name.length > 0);
}

/** Replaces {{name}} / [name] / {name} placeholders with user values. */
export function fillTemplate(body: string, values: Record<string, string>) {
  let out = body;
  for (const [key, value] of Object.entries(values)) {
    const replacement = value.trim() || `[${key}]`;
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out
      .replace(new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}`, "gi"), replacement)
      .replace(new RegExp(`\\{\\s*${escaped}\\s*\\}`, "gi"), replacement)
      .replace(new RegExp(`\\[\\s*${escaped}\\s*\\]`, "gi"), replacement);
  }
  return out;
}
