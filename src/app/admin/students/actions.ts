"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
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

const studentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(72).optional(),
});

export async function saveStudent(
  input: z.infer<typeof studentSchema>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;
  const email = data.email.toLowerCase();

  if (data.id) {
    const patch: { name: string; email: string; passwordHash?: string } = {
      name: data.name,
      email,
    };
    if (data.password) patch.passwordHash = await bcrypt.hash(data.password, 10);
    await prisma.user.update({ where: { id: data.id }, data: patch });
  } else {
    if (!data.password) return { ok: false, error: "password required" };
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return { ok: false, error: "email already in use" };
    await prisma.user.create({
      data: {
        tenantId: admin.tenantId,
        name: data.name,
        email,
        passwordHash: await bcrypt.hash(data.password, 10),
        role: "LEARNER",
      },
    });
  }
  revalidatePath("/admin/students");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteStudent(id: string) {
  const admin = await requireAdmin();
  // Belt-and-braces: refuse to delete other admins.
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.role === "ADMIN") return;
  if (target.id === admin.id) return;
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/students");
  revalidatePath("/admin");
}

const bulkSchema = z.object({
  rows: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .min(1)
    .max(500),
  courseId: z.string().optional(),
});

export async function bulkCreateStudents(
  input: z.infer<typeof bulkSchema>
): Promise<{ ok: true; created: number; skipped: number } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  const parsed = bulkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  let created = 0;
  let skipped = 0;
  for (const row of parsed.data.rows) {
    const email = row.email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      skipped++;
      continue;
    }
    const user = await prisma.user.create({
      data: {
        tenantId: admin.tenantId,
        name: row.name,
        email,
        passwordHash: await bcrypt.hash(row.password, 10),
        role: "LEARNER",
      },
    });
    if (parsed.data.courseId) {
      await prisma.enrollment.create({
        data: { userId: user.id, courseId: parsed.data.courseId },
      });
    }
    created++;
  }
  revalidatePath("/admin/students");
  revalidatePath("/admin");
  return { ok: true, created, skipped };
}

export async function setEnrollment(
  userId: string,
  courseId: string,
  enroll: boolean
) {
  await requireAdmin();
  if (enroll) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId },
      update: {},
    });
  } else {
    await prisma.enrollment.deleteMany({ where: { userId, courseId } });
  }
  revalidatePath("/admin/students");
}
