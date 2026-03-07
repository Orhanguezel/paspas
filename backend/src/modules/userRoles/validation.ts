import { z } from "zod";

const erpRoleEnum = z.enum(["admin", "sevkiyatci", "operator", "satin_almaci"]);
const entityIdSchema = z.string().trim().min(1);

export const userRoleListQuerySchema = z.object({
  user_id: entityIdSchema.optional(),
  role: z
    .enum([
      "admin",
      "sevkiyatci",
      "operator",
      "satin_almaci",
      // legacy roller (geriye donuk filtre)
      "moderator",
      "seller",
      "user",
    ])
    .optional(),
  order: z.literal("created_at").optional(),
  direction: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export const createUserRoleSchema = z.object({
  user_id: entityIdSchema,
  role: erpRoleEnum,
});

export const roleSlugSchema = z.object({
  slug: erpRoleEnum,
});

export const setRolePermissionsSchema = z.object({
  permissions: z.array(z.string().trim().min(1)).default([]),
});

export type UserRoleListQuery = z.infer<typeof userRoleListQuerySchema>;
export type CreateUserRoleInput = z.infer<typeof createUserRoleSchema>;
export type RoleSlugInput = z.infer<typeof roleSlugSchema>;
export type SetRolePermissionsInput = z.infer<typeof setRolePermissionsSchema>;
