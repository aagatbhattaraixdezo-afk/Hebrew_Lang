import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminPanelClient from "./admin-panel-client";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true, name: true, email: true },
  });

  if (!admin) {
    redirect("/api/auth/signout?callbackUrl=/login");
  }

  const [
    studentsCount,
    coursesCount,
    modulesCount,
    lessonsCount,
    recentActive,
    learners,
    dbCourses,
    dbScenarios
  ] = await Promise.all([
    prisma.user.count({ where: { role: "LEARNER", tenantId: admin.tenantId } }),
    prisma.course.count({ where: { tenantId: admin.tenantId } }),
    prisma.module.count({ where: { course: { tenantId: admin.tenantId } } }),
    prisma.lesson.count({ where: { module: { course: { tenantId: admin.tenantId } } } }),
    prisma.user.findMany({
      where: { role: "LEARNER", tenantId: admin.tenantId, lastActiveOn: { not: null } },
      orderBy: { lastActiveOn: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, xp: true, lastActiveOn: true },
    }),
    prisma.user.findMany({
      where: { role: "LEARNER", tenantId: admin.tenantId },
      orderBy: { xp: "desc" },
      include: {
        enrollments: {
          include: {
            course: {
              select: {
                title: true,
              },
            },
          },
        },
        progress: {
          where: { completed: true },
          select: { id: true },
        },
      },
    }),
    prisma.course.findMany({
      where: { tenantId: admin.tenantId },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: {
            modules: true,
            enrollments: true,
          },
        },
      },
    }),
    prisma.scenario.findMany({
      where: { tenantId: admin.tenantId },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: {
            phrases: true,
            conversations: true,
          },
        },
      },
    }),
  ]);

  const stats = {
    students: studentsCount,
    courses: coursesCount,
    modules: modulesCount,
    lessons: lessonsCount,
  };

  const students = learners.map((l) => ({
    id: l.id,
    name: l.name,
    email: l.email,
    xp: l.xp,
    streakCount: l.streakCount,
    lessonsCompleted: l.progress.length,
    enrolledCourses: l.enrollments.map((e) => e.course.title),
    lastActiveOn: l.lastActiveOn ? l.lastActiveOn.toISOString() : null,
  }));

  const courses = dbCourses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    level: c.level,
    coverColor: c.coverColor,
    status: c.status,
    modulesCount: c._count.modules,
    enrollmentsCount: c._count.enrollments,
    order: c.order,
  }));

  const scenarios = dbScenarios.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    setting: s.setting,
    aiRolePrompt: s.aiRolePrompt,
    level: s.level,
    icon: s.icon,
    status: s.status,
    phrasesCount: s._count.phrases,
    conversationsCount: s._count.conversations,
  }));

  const apiKeyConfigured = !!process.env.GEMINI_API_KEY;

  return (
    <AdminPanelClient
      adminName={admin.name || admin.email}
      stats={stats}
      recentStudents={recentActive}
      students={students}
      courses={courses}
      scenarios={scenarios}
      apiKeyConfigured={apiKeyConfigured}
    />
  );
}

