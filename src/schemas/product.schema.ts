import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'O nome do modelo é obrigatório'),
  brand: z.string().optional(),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
