import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager, type Field } from "@/components/admin/resource-manager";

export const Route = createFileRoute("/_authenticated/admin/faqs")({
  component: AdminFaqs,
});

const fields: Field[] = [
  { name: "question", label: "Question", type: "text", required: true },
  { name: "answer", label: "Answer", type: "textarea", required: true },
  { name: "display_order", label: "Display order", type: "number" },
  { name: "is_published", label: "Published", type: "switch" },
];

function AdminFaqs() {
  return (
    <ResourceManager
      table="faqs"
      title="FAQ"
      description="Questions shown on the home and pricing pages."
      orderBy="display_order"
      fields={fields}
      defaults={{ display_order: 0, is_published: true }}
      columns={[
        { name: "question", label: "Question" },
        { name: "display_order", label: "Order" },
        { name: "is_published", label: "Published" },
      ]}
    />
  );
}
