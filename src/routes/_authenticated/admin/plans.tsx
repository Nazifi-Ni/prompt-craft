import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager, type Field } from "@/components/admin/resource-manager";

export const Route = createFileRoute("/_authenticated/admin/plans")({
  component: AdminPlans,
});

const fields: Field[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "slug", label: "Slug", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "price_amount", label: "Price", type: "number", help: "In the smallest currency unit" },
  { name: "currency", label: "Currency", type: "text" },
  {
    name: "interval",
    label: "Billing interval",
    type: "select",
    options: [
      { value: "free", label: "Free" },
      { value: "monthly", label: "Monthly" },
      { value: "annual", label: "Annual" },
    ],
  },
  {
    name: "grants_access",
    label: "Grants access",
    type: "select",
    options: [
      { value: "free", label: "Free" },
      { value: "pro", label: "Pro" },
    ],
  },
  { name: "features", label: "Features", type: "csv", help: "Comma separated" },
  { name: "usage_limit", label: "Usage limit", type: "number" },
  { name: "is_active", label: "Active", type: "switch", help: "Show on the pricing page" },
  { name: "display_order", label: "Display order", type: "number" },
];

function AdminPlans() {
  return (
    <ResourceManager
      table="subscription_plans"
      title="Plan"
      description="Subscription plans and pricing shown to members."
      orderBy="display_order"
      fields={fields}
      defaults={{
        currency: "NGN",
        interval: "monthly",
        grants_access: "pro",
        is_active: true,
        display_order: 0,
        price_amount: 0,
        features: [],
      }}
      columns={[
        { name: "name", label: "Name" },
        { name: "price_amount", label: "Price" },
        { name: "interval", label: "Interval" },
        { name: "grants_access", label: "Access" },
        { name: "is_active", label: "Active" },
      ]}
    />
  );
}
