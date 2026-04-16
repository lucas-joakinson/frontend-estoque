import { z } from 'zod';

export const computerSchema = z.object({
  patrimonio: z.string().min(1, 'Patrimônio é obrigatório'),
  hostname: z.string().min(1, 'Hostname é obrigatório'),
  status: z.enum(['Em uso', 'Manutenção', 'Defeito', 'Troca pendente', 'Em estoque']),
  localizacao: z.string().min(1, 'Localização é obrigatória'),
  observacoes: z.string().optional().nullable(),
});

export type ComputerInput = z.infer<typeof computerSchema>;
