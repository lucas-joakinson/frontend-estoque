import { z } from 'zod';

export const createAssetSchema = z.object({
  patrimonio: z.string()
    .min(1, 'O patrimônio é obrigatório')
    .max(6, 'O patrimônio deve ter no máximo 6 dígitos')
    .regex(/^\d+$/, 'O patrimônio deve conter apenas números'),
  productId: z.string().min(1, 'Selecione um produto'),
  status: z.enum(['DISPONIVEL', 'EM_USO', 'EM_MANUTENCAO', 'DEFEITO', 'DESCARTADO'], {
    invalid_type_error: 'Selecione um status válido',
    required_error: 'O status é obrigatório',
  }),
  location: z.string().min(1, 'A localização é obrigatória'),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;

export const updateAssetSchema = z.object({
  status: z.enum(['DISPONIVEL', 'EM_USO', 'EM_MANUTENCAO', 'DEFEITO', 'DESCARTADO'], {
    invalid_type_error: 'Selecione um status válido',
    required_error: 'O status é obrigatório',
  }),
  location: z.string().min(1, 'A localização é obrigatória'),
  notes: z.string().optional(),
});

export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
