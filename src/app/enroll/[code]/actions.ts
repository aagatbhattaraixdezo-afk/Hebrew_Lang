"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(72),
});

export async function enrollWithCode(
  input: z.infer<typeof schema>
): Promise<{ ok: true; courseId: string } | { ok: false; error: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { code, name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const ec = await prisma.enrollmentCode.findUnique({
    where: { code: code.toUpperCase() },
    include: { course: { select: { tenantId: true } } },
  });
  if (!ec) return { ok: false, error: "code not found" };
  if (ec.redeemedBy) return { ok: false, error: "code already used" };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { ok: false, error: "email already in use" };

  const user = await prisma.user.create({
    data: {
      tenantId: ec.course.tenantId,
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "LEARNER",
    },
  });

  await prisma.$transaction([
    prisma.enrollmentCode.update({
      where: { id: ec.id },
      data: { redeemedBy: user.id, redeemedAt: new Date() },
    }),
    prisma.enrollment.create({
      data: { userId: user.id, courseId: ec.courseId },
    }),
  ]);

  return { ok: true, courseId: ec.courseId };
}
