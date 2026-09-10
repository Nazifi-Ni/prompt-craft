import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager, type Field } from "@/components/admin/resource-manager";

export const Route = createFileRoute("/_authenticated/admin/toolkits")({
  component: AdminToolkits,
});

const fields: Field[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "slug", label: "Slug", type: "text", required: true, help: "Used in the public URL" },
  { name: "audience", label: "Audience", type: "text", placeholder: "Scholarship applicants" },
  { name: "short_description", label: "Short description", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "features", label: "Features", type: "csv", help: "Comma separated" },
  { name: "outcomes", label: "Outcomes", type: "csv", help: "Comma separated" },
  {
    name: "access_level",
    label: "Access level",
    type: "select",
    options: [
      { value: "free", label: "Free" },
      { value: "pro", label: "Pro" },
    ],
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
      { value: "archived", label: "Archived" },
    ],
  },
  { name: "is_featured", label: "Featured", type: "switch", help: "Show on the homepage" },
  { name: "display_order", label: "Display order", type: "number" },
  { name: "icon", label: "Icon", type: "text" },
  { name: "image_url", label: "Image URL", type: "text" },
  { name: "seo_title", label: "SEO title", type: "text" },
  { name: "seo_description", label: "SEO description", type: "textarea" },
];

function AdminToolkits() {
  return (
    <ResourceManager
      table="toolkits"
      title="Toolkit"
      description="Prompt libraries shown in the public directory."
      orderBy="display_order"
      fields={fields}
      defaults={{
        access_level: "free",
        status: "draft",
        is_featured: false,
        display_order: 0,
        features: [],
        outcomes: [],
      }}
      columns={[
        { name: "name", label: "Name" },
        { name: "slug", label: "Slug" },
        { name: "access_level", label: "Access" },
        { name: "status", label: "Status" },
        { name: "display_order", label: "Order" },
      ]}
    />
  );
}
