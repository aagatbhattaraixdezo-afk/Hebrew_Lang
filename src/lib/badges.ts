import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Flame,
  Trophy,
  Award,
  Crown,
  Target,
  GraduationCap,
  BookCheck,
  Compass,
  Wrench,
} from "lucide-react";

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string; // tailwind class
  earned: boolean;
  progress?: { current: number; goal: number };
};

export type BadgeInput = {
  xp: number;
  streakCount: number;
  lessonsCompleted: number;
  coursesCompleted: number;
  correctMcqs: number;
  fixedMistakes: number;
};

export function computeBadges(i: BadgeInput): Badge[] {
  return [
    {
      id: "first-steps",
      name: "First steps",
      description: "Completed your first lesson.",
      icon: Sparkles,
      color: "text-accent",
      earned: i.lessonsCompleted >= 1,
      progress: { current: Math.min(i.lessonsCompleted, 1), goal: 1 },
    },
    {
      id: "word-collector",
      name: "Word collector",
      description: "Reached 100 XP.",
      icon: Award,
      color: "text-primary",
      earned: i.xp >= 100,
      progress: { current: Math.min(i.xp, 100), goal: 100 },
    },
    {
      id: "centurion",
      name: "Centurion",
      description: "Reached 500 XP.",
      icon: Trophy,
      color: "text-accent",
      earned: i.xp >= 500,
      progress: { current: Math.min(i.xp, 500), goal: 500 },
    },
    {
      id: "champion",
      name: "Champion",
      description: "Reached 1,000 XP.",
      icon: Crown,
      color: "text-primary",
      earned: i.xp >= 1000,
      progress: { current: Math.min(i.xp, 1000), goal: 1000 },
    },
    {
      id: "streak-starter",
      name: "Streak starter",
      description: "Practised 3 days in a row.",
      icon: Flame,
      color: "text-flame",
      earned: i.streakCount >= 3,
      progress: { current: Math.min(i.streakCount, 3), goal: 3 },
    },
    {
      id: "habit-builder",
      name: "Habit builder",
      description: "A full week of practice.",
      icon: Flame,
      color: "text-flame",
      earned: i.streakCount >= 7,
      progress: { current: Math.min(i.streakCount, 7), goal: 7 },
    },
    {
      id: "unstoppable",
      name: "Unstoppable",
      description: "30-day streak.",
      icon: Flame,
      color: "text-danger",
      earned: i.streakCount >= 30,
      progress: { current: Math.min(i.streakCount, 30), goal: 30 },
    },
    {
      id: "lexicographer",
      name: "Lexicographer",
      description: "Answered 50 questions correctly.",
      icon: BookCheck,
      color: "text-primary",
      earned: i.correctMcqs >= 50,
      progress: { current: Math.min(i.correctMcqs, 50), goal: 50 },
    },
    {
      id: "course-conqueror",
      name: "Course conqueror",
      description: "Finished an entire course.",
      icon: GraduationCap,
      color: "text-accent",
      earned: i.coursesCompleted >= 1,
      progress: { current: Math.min(i.coursesCompleted, 1), goal: 1 },
    },
    {
      id: "persistent",
      name: "Persistent",
      description: "Fixed a question you got wrong before.",
      icon: Wrench,
      color: "text-success",
      earned: i.fixedMistakes >= 1,
      progress: { current: Math.min(i.fixedMistakes, 1), goal: 1 },
    },
    {
      id: "explorer",
      name: "Explorer",
      description: "Completed lessons in 5+ topics.",
      icon: Compass,
      color: "text-primary",
      earned: i.lessonsCompleted >= 5,
      progress: { current: Math.min(i.lessonsCompleted, 5), goal: 5 },
    },
    {
      id: "scholar",
      name: "Scholar",
      description: "Reached level 5 (400 XP).",
      icon: Target,
      color: "text-accent",
      earned: i.xp >= 400,
      progress: { current: Math.min(i.xp, 400), goal: 400 },
    },
  ];
}
