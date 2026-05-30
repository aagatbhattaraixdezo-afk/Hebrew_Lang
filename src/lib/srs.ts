// Simplified SM-2 spaced-repetition scheduling.
// Each card stores ease (multiplier), intervalDays, reps, and dueOn.

export type Grade = "again" | "hard" | "good" | "easy";

export type CardSchedule = {
  ease: number;
  intervalDays: number;
  reps: number;
  dueOn: Date;
};

export function scheduleNext(state: CardSchedule, grade: Grade): CardSchedule {
  let { ease, intervalDays, reps } = state;

  if (grade === "again") {
    ease = Math.max(1.3, ease - 0.2);
    intervalDays = 0;
    reps = 0;
  } else if (grade === "hard") {
    ease = Math.max(1.3, ease - 0.15);
    intervalDays = reps === 0 ? 1 : Math.max(1, Math.round(intervalDays * 1.2));
    reps += 1;
  } else if (grade === "good") {
    intervalDays = reps === 0 ? 1 : Math.max(1, Math.round(intervalDays * ease));
    reps += 1;
  } else if (grade === "easy") {
    ease += 0.15;
    intervalDays = reps === 0 ? 2 : Math.max(2, Math.round(intervalDays * ease * 1.3));
    reps += 1;
  }

  const dueOn = new Date();
  dueOn.setHours(0, 0, 0, 0);
  dueOn.setDate(dueOn.getDate() + intervalDays);

  return { ease, intervalDays, reps, dueOn };
}

export function xpForGrade(grade: Grade): number {
  return grade === "again" ? 0 : grade === "hard" ? 2 : grade === "good" ? 3 : 4;
}
