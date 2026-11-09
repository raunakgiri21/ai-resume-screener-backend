import { z } from 'zod';

export const AnalysisQuerySchema = z
  .object({
    search: z.string().trim().max(100).optional(),

    minScore: z.coerce.number().int().min(0).max(100).optional(),

    maxScore: z.coerce.number().int().min(0).max(100).optional(),

    page: z.coerce.number().int().min(1).max(100000).default(1),

    limit: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict()
  .refine(
    (data) =>
      data.minScore === undefined ||
      data.maxScore === undefined ||
      data.minScore <= data.maxScore,
    {
      message: 'minScore cannot be greater than maxScore.',
      path: ['minScore'],
    },
  );

export type AnalysisQuery = z.infer<typeof AnalysisQuerySchema>;
