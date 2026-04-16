import { z } from 'zod';

export const headsetSchema = z.object({
  matricula: z.string().min(1, 'A matrícula é obrigatória'),
  lacre: z.string().min(1, 'O lacre é obrigatório'),
  marca: z.string().min(1, 'A marca é obrigatória'),
  numeroSerie: z.string().min(1, 'O número de série é obrigatório'),
  status: z.enum(['LIGADO', 'DESLIGADO', 'MANUTENÇÃO']),
  observacoes: z.string().optional().nullable(),
});

export type HeadsetInput = z.infer<typeof headsetSchema>;
