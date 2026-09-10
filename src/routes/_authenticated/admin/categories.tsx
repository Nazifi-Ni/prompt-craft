import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResourceManager, type Field } from "@/components/admin/resource-manager";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

function AdminCategories() {
  const { data: toolkits } = useQuery({
    queryKey: ["admin", "toolkit-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("toolkits").select("id,name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const fields: Field[] = [
    {
      name: "toolkit_id",
      label: "Toolkit",
      type: "select",
      required: true,
      options: (toolkits ?? []).map((t) => ({ value: t.id, label: t.name })),
    },
    { name: "name", label: "Name", type: "text", required: true },
    { name: "slug", label: "Slug", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "icon", label: "Icon", type: "text" },
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
    { name: "display_order", label: "Display order", type: "number" },
  ];

  return (
    <ResourceManager
      table="toolkit_categories"
      title="Category"
      description="Numbered sections inside each toolkit."
      orderBy="display_order"
      fields={fields}
      defaults={{ status: "published", display_order: 0 }}
      columns={[
        { name: "name", label: "Name" },
        { name: "slug", label: "Slug" },
        { name: "status", label: "Status" },
        { name: "display_order", label: "Order" },
      ]}
    />
  );
}
