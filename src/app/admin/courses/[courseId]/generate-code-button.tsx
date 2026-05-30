"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateEnrollmentCode } from "../../enrollments/actions";

export function GenerateCodeButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await generateEnrollmentCode(courseId);
          router.refresh();
        });
      }}
    >
      <Plus className="h-4 w-4" />
      Generate code
    </Button>
  );
}
