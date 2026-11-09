import { z } from 'zod';

const EnvSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required.'),

    TURSO_DATABASE_URL: z.string().optional(),
    TURSO_AUTH_TOKEN: z.string().optional(),

    GEMINI_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
    GROQ_MODEL: z.string().min(1).default('openai/gpt-oss-20b'),

    PORT: z.coerce.number().int().min(1).max(65535).default(3000),

    FRONTEND_URL: z.string().default('http://localhost:5173'),
  })
  .refine(
    (env) => {
      if (env.NODE_ENV === 'production') {
        return Boolean(
          env.TURSO_DATABASE_URL?.trim() && env.TURSO_AUTH_TOKEN?.trim(),
        );
      }

      return Boolean(env.DATABASE_URL?.trim());
    },
    {
      message:
        'Configure Turso credentials in production or DATABASE_URL for local development.',
      path: ['DATABASE_URL'],
    },
  )
  .refine(
    (env) => Boolean(env.GEMINI_API_KEY?.trim() || env.GROQ_API_KEY?.trim()),
    {
      message: 'At least one AI provider API key must be configured.',
      path: ['GEMINI_API_KEY', 'GROQ_API_KEY'],
    },
  );

export function validateEnv() {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('\nInvalid environment configuration:');

    for (const issue of result.error.issues) {
      console.error(`- ${issue.path.join('.')}: ${issue.message}`);
    }

    throw new Error(
      'Application startup aborted due to invalid configuration.',
    );
  }

  return result.data;
}
