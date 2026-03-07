import { z } from 'zod';

const roleEnum = z.enum(['admin', 'sevkiyatci', 'operator', 'satin_almaci']);

const pathSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => value.startsWith('/'), { message: 'redirect_path_invalid' });

export const updateSchema = z.object({
  showQuickLogin: z.boolean(),
  allowPasswordLogin: z.boolean(),
  roleCardsEnabled: z.boolean(),
  redirects: z.object({
    admin: pathSchema,
    sevkiyatci: pathSchema,
    operator: pathSchema,
    satin_almaci: pathSchema,
  }),
  enabledRoles: z.array(roleEnum).default(['admin', 'sevkiyatci', 'operator', 'satin_almaci']),
});

export type UpdateLoginSettingsBody = z.infer<typeof updateSchema>;
