import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/** Edge-safe Auth.js instance (no Prisma / bcrypt). Used by middleware only. */
export const { auth } = NextAuth(authConfig);
