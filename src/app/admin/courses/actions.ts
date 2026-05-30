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

const courseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  level: z.string().max(40).optional().nullable(),
  coverColor: z.string().max(20).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),
});

export async function saveCourse(input: z.infer<typeof courseSchema>) {
  const user = await requireAdmin();
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const data = parsed.data;

  if (data.id) {
    await prisma.course.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description || null,
        level: data.level || null,
        coverColor: data.coverColor || null,
        status: data.status,
      },
    });
  } else {
    const count = await prisma.course.count({ where: { tenantId: user.tenantId } });
    await prisma.course.create({
      data: {
        tenantId: user.tenantId,
        title: data.title,
        description: data.description || null,
        level: data.level || null,
        coverColor: data.coverColor || null,
        status: data.status,
        order: count,
      },
    });
  }

  revalidatePath("/admin/courses");
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function deleteCourse(id: string) {
  await requireAdmin();
  await prisma.course.delete({ where: { id } });
  revalidatePath("/admin/courses");
  revalidatePath("/admin");
}

export async function moveCourse(id: string, direction: "up" | "down") {
  await requireAdmin();
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return;
  const neighbor = await prisma.course.findFirst({
    where: {
      tenantId: course.tenantId,
      order: direction === "up" ? { lt: course.order } : { gt: course.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return;
  await prisma.$transaction([
    prisma.course.update({ where: { id: course.id }, data: { order: neighbor.order } }),
    prisma.course.update({ where: { id: neighbor.id }, data: { order: course.order } }),
  ]);
  revalidatePath("/admin/courses");
}
