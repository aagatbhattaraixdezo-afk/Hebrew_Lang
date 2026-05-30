"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { deleteScenario } from "./actions";

export function DeleteScenarioBtn({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  return (
    <ConfirmAction
      title={`Delete "${title}"?`}
      description="Deletes the scenario, all its phrases, and all roleplay conversation history. This cannot be undone."
      confirmLabel="Delete scenario"
      trigger={
        <Button variant="ghost" size="icon" aria-label="Delete">
          <Trash2 className="h-4 w-4 text-danger" />
        </Button>
      }
      onConfirm={async () => {
        await deleteScenario(id);
        router.refresh();
      }}
    />
  );
}
