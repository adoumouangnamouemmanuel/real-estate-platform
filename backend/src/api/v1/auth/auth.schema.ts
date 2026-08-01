/** ----------------------- auth.schema.ts
 * 
 * Schema rules and definitions for the authementication module.
 * Rules for validating user credentials, tokens, and other authentication-related data structures are defined here.
 * Authentication includes user login, registration, password reset, and token management.
 * 
 */

import { Role } from '@prisma/client/wasm';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(100)
});

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
  role: z.nativeEnum(Role).default(Role.USER)
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
