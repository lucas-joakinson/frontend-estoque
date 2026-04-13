import { z } from 'zod';

export const loginSchema = z.object({
  matricula: z.string().min(1, 'A matrícula é obrigatória'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export type LoginInput = z.infer<typeof loginSchema>;
