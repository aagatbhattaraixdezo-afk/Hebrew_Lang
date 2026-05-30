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

function makeCode(): string {
  // Human-readable, 8 chars from an unambiguous alphabet
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) {
    s += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return `HEB-${s.slice(0, 4)}-${s.slice(4)}`;
}

export async function generateEnrollmentCode(courseId: string) {
  await requireAdmin();
  for (let i = 0; i < 5; i++) {
    const code = makeCode();
    try {
      await prisma.enrollmentCode.create({ data: { code, courseId } });
      revalidatePath(`/admin/courses/${courseId}`);
      return { ok: true as const, code };
    } catch {
      // collision — try again
    }
  }
  return { ok: false as const, error: "could not generate unique code" };
}

const redeemSchema = z.object({
  code: z.string().min(1).max(40),
  userId: z.string().min(1),
});

export async function redeemEnrollmentCode(input: z.infer<typeof redeemSchema>) {
  // Called from the public redeem page after the user has been created.
  const parsed = redeemSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const { code, userId } = parsed.data;

  const ec = await prisma.enrollmentCode.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!ec) return { ok: false as const, error: "code not found" };
  if (ec.redeemedBy) return { ok: false as const, error: "code already used" };
  if (ec.expiresAt && ec.expiresAt < new Date()) {
    return { ok: false as const, error: "code expired" };
  }

  await prisma.$transaction([
    prisma.enrollmentCode.update({
      where: { id: ec.id },
      data: { redeemedBy: userId, redeemedAt: new Date() },
    }),
    prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: ec.courseId } },
      create: { userId, courseId: ec.courseId },
      update: {},
    }),
  ]);

  return { ok: true as const, courseId: ec.courseId };
}

export async function deleteEnrollmentCode(id: string) {
  await requireAdmin();
  const ec = await prisma.enrollmentCode.findUnique({ where: { id } });
  if (!ec) return;
  await prisma.enrollmentCode.delete({ where: { id } });
  revalidatePath(`/admin/courses/${ec.courseId}`);
}
