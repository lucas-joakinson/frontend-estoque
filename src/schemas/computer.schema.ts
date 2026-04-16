import { z } from 'zod';

export const computerSchema = z.object({
  patrimonio: z.string().min(1, 'Patrimônio é obrigatório'),
  hostname: z.string().min(1, 'Hostname é obrigatório'),
  status: z.enum(['EM USO', 'MANUTENCAO', 'DEFEITO', 'TROCA PENDENTE', 'EM ESTOQUE'], {
    required_error: 'Status é obrigatório',
  }),
  location: z.string().min(1, 'Localização é obrigatória'),
});

export type ComputerInput = z.infer<typeof computerSchema>;
