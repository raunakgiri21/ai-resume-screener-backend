import { z } from 'zod';

export const AnalysisResultSchema = z
  .object({
    documentAssessment: z
      .object({
        jobDescriptionIsRelevant: z.boolean(),
        resumeIsRelevant: z.boolean(),
        reason: z.string().min(1),
      })
      .strict(),

    score: z.number().int().min(0).max(100),

    matchingSkills: z
      .array(
        z
          .object({
            skill: z.string().min(1),
            evidence: z.string().min(1),
          })
          .strict(),
      )
      .max(5),

    skillGaps: z
      .array(
        z
          .object({
            skill: z.string().min(1),
            reason: z.string().min(1),
          })
          .strict(),
      )
      .max(3),

    interviewQuestions: z
      .array(
        z
          .object({
            question: z.string().min(1),
            reason: z.string().min(1),
          })
          .strict(),
      )
      .max(3),

    summary: z.string().min(1),
  })
  .strict();

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
