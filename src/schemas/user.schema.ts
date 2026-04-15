import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  matricula: z.string().min(6, 'A matrícula deve ter no mínimo 6 caracteres'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  role: z.string().min(1, 'O cargo é obrigatório'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório').optional(),
  password: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres').optional().or(z.literal('')),
  role: z.string().min(1, 'O cargo é obrigatório'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
