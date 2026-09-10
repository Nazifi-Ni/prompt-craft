import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager, type Field } from "@/components/admin/resource-manager";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

const fields: Field[] = [
  { name: "key", label: "Key", type: "text", required: true },
  {
    name: "value",
    label: "Value (JSON)",
    type: "json",
    help: 'Any JSON value, e.g. {"enabled": true} or "Some text"',
  },
];

function AdminSettings() {
  return (
    <ResourceManager
      table="site_settings"
      title="Setting"
      description="Site-wide configuration values."
      orderBy="key"
      primaryKey="key"
      editableKey
      fields={fields}
      defaults={{ value: {} }}
      columns={[
        { name: "key", label: "Key" },
        { name: "value", label: "Value" },
      ]}
    />
  );
}
