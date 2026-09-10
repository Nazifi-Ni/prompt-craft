import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResourceManager, type Field } from "@/components/admin/resource-manager";

export const Route = createFileRoute("/_authenticated/admin/prompts")({
  component: AdminPrompts,
});

function AdminPrompts() {
  const { data: toolkits } = useQuery({
    queryKey: ["admin", "toolkit-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("toolkits").select("id,name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin", "category-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("toolkit_categories")
        .select("id,name,toolkit_id")
        .order("display_order");
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
    {
      name: "category_id",
      label: "Category",
      type: "select",
      options: [
        { value: "", label: "— none —" },
        ...(categories ?? []).map((c) => ({ value: c.id, label: c.name })),
      ],
    },
    { name: "title", label: "Title", type: "text", required: true },
    { name: "slug", label: "Slug", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "purpose", label: "Purpose", type: "textarea" },
    {
      name: "body",
      label: "Prompt body",
      type: "textarea",
      required: true,
      help: "Use {{variable_name}} placeholders for the fill-in fields.",
    },
    {
      name: "variables",
      label: "Variables (JSON)",
      type: "json",
      help: '[{"name":"course","label":"Course","type":"text","required":true}]',
    },
    { name: "instructions", label: "How to use", type: "textarea" },
    { name: "example_input", label: "Example input", type: "textarea" },
    { name: "example_output", label: "Example output", type: "textarea" },
    { name: "pro_tip", label: "Pro tip", type: "textarea" },
    { name: "warning", label: "Authenticity warning", type: "textarea" },
    { name: "tags", label: "Tags", type: "csv", help: "Comma separated" },
    {
      name: "difficulty",
      label: "Difficulty",
      type: "select",
      options: [
        { value: "beginner", label: "Beginner" },
        { value: "intermediate", label: "Intermediate" },
        { value: "advanced", label: "Advanced" },
      ],
    },
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
    { name: "is_featured", label: "Featured", type: "switch" },
    { name: "display_order", label: "Display order", type: "number" },
  ];

  return (
    <ResourceManager
      table="prompts"
      title="Prompt"
      description="Full prompt library. Pro prompts stay locked for free members."
      orderBy="display_order"
      fields={fields}
      defaults={{
        status: "draft",
        access_level: "free",
        difficulty: "beginner",
        is_featured: false,
        display_order: 0,
        tags: [],
        variables: [],
        body: "",
      }}
      columns={[
        { name: "title", label: "Title" },
        { name: "slug", label: "Slug" },
        { name: "access_level", label: "Access" },
        { name: "status", label: "Status" },
        { name: "display_order", label: "Order" },
      ]}
    />
  );
}
