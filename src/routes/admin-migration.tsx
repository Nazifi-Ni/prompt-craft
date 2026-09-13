import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin-migration")({
  component: AdminMigration,
});

function AdminMigration() {
  const { user, isPro } = useAccount();
  const [status, setStatus] = useState("Idle");

  async function runMigration() {
    setStatus("Running...");
    try {
      // 1. Set existing toolkits to pro
      const { error: err1 } = await supabase
        .from("toolkits")
        .update({ access_level: "pro" })
        .neq("slug", "free-ai-toolkit");
      if (err1) throw err1;

      // 2. Insert the Free AI Toolkit
      const { data: toolkit, error: err2 } = await supabase
        .from("toolkits")
        .upsert({
          id: "11111111-1111-1111-1111-111111111111",
          name: "Free AI Toolkit",
          slug: "free-ai-toolkit",
          short_description: "A collection of free AI prompts available to everyone.",
          description: "A curated collection of free prompts and tools to help you get started with Meridian. Explore our capabilities without any cost.",
          icon: "Gift",
          audience: "Everyone",
          display_order: 0,
          status: "published",
          access_level: "free",
        }, { onConflict: "slug" })
        .select()
        .single();
      if (err2) throw err2;

      // 3. Insert Category
      const { data: category, error: err3 } = await supabase
        .from("toolkit_categories")
        .upsert({
          id: "22222222-2222-2222-2222-222222222222",
          toolkit_id: toolkit.id,
          name: "Essentials",
          slug: "essentials",
          description: "Essential free prompts to get you started.",
          display_order: 1,
        }, { onConflict: "toolkit_id,slug" })
        .select()
        .single();
      if (err3) throw err3;

      // 4. Update Prompts
      const promptsToMove = [
        "profile-strength-audit",
        "feynman-concept-explainer",
        "job-search-sprint-planner",
      ];
      
      for (const slug of promptsToMove) {
        const { error: err4 } = await supabase
          .from("prompts")
          .update({
            toolkit_id: toolkit.id,
            category_id: category.id,
          })
          .eq("slug", slug);
        if (err4) throw err4;
      }

      setStatus("Success! Migration completed.");
    } catch (err: any) {
      console.error(err);
      setStatus("Error: " + err.message);
    }
  }

  return (
    <div className="min-h-screen bg-background p-10">
      <h1 className="text-2xl font-bold">Admin Database Migration</h1>
      <p className="mt-4">Status: {status}</p>
      
      <div className="mt-8">
        <Button onClick={runMigration}>Run Migration</Button>
      </div>
    </div>
  );
}
