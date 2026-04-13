import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'O nome da categoria é obrigatório'),
});

export type CategoryInput = z.infer<typeof categorySchema>;
