import { z } from 'zod';

export const headsetSchema = z.object({
  matricula: z.string().min(1, 'A matrícula é obrigatória'),
  lacre: z.string().min(1, 'O lacre é obrigatório').max(5, 'O lacre deve ter no máximo 5 caracteres'),
  marca: z.string().min(1, 'A marca é obrigatória'),
  numeroSerie: z.string().optional().nullable(),
  status: z.enum(['EM USO', 'RESERVA', 'TROCA PENDENTE', 'DESLIGADO']),
  observacoes: z.string().optional().nullable(),
});

export type HeadsetInput = z.infer<typeof headsetSchema>;
