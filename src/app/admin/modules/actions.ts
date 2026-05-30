"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("forbidden");
  }
  return session.user;
}

const moduleSchema = z.object({
  id: z.string().optional(),
  courseId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),
});

export async function saveModule(input: z.infer<typeof moduleSchema>) {
  await requireAdmin();
  const parsed = moduleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const data = parsed.data;

  if (data.id) {
    await prisma.module.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description || null,
        status: data.status,
      },
    });
  } else {
    const count = await prisma.module.count({ where: { courseId: data.courseId } });
    await prisma.module.create({
      data: {
        courseId: data.courseId,
        title: data.title,
        description: data.description || null,
        status: data.status,
        order: count,
      },
    });
  }

  revalidatePath(`/admin/courses/${data.courseId}`);
  return { ok: true as const };
}

export async function deleteModule(id: string) {
  await requireAdmin();
  const m = await prisma.module.delete({ where: { id } });
  revalidatePath(`/admin/courses/${m.courseId}`);
}

export async function moveModule(id: string, direction: "up" | "down") {
  await requireAdmin();
  const m = await prisma.module.findUnique({ where: { id } });
  if (!m) return;
  const neighbor = await prisma.module.findFirst({
    where: {
      courseId: m.courseId,
      order: direction === "up" ? { lt: m.order } : { gt: m.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return;
  await prisma.$transaction([
    prisma.module.update({ where: { id: m.id }, data: { order: neighbor.order } }),
    prisma.module.update({ where: { id: neighbor.id }, data: { order: m.order } }),
  ]);
  revalidatePath(`/admin/courses/${m.courseId}`);
}
