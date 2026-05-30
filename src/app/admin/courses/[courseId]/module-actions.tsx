"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { ModuleFormDialog } from "../../modules/module-form";
import { deleteModule, moveModule } from "../../modules/actions";

type Module = {
  id: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED";
};

export function ModuleActions({
  courseId,
  module,
}: {
  courseId: string;
  module: Module;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      await moveModule(module.id, direction);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => move("up")}
        disabled={pending}
        aria-label="Move up"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => move("down")}
        disabled={pending}
        aria-label="Move down"
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
      <ModuleFormDialog courseId={courseId} module={module} />
      <ConfirmAction
        title={`Delete "${module.title}"?`}
        description="Deletes the module and all lessons, MCQs, the quiz, and the flashcard deck under it. This cannot be undone."
        confirmLabel="Delete module"
        trigger={
          <Button variant="ghost" size="icon" aria-label="Delete">
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        }
        onConfirm={async () => {
          await deleteModule(module.id);
          router.refresh();
        }}
      />
    </div>
  );
}
