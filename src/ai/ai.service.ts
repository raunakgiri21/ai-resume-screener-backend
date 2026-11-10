import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { Groq } from 'groq-sdk';

import {
  AnalysisResultSchema,
  type AnalysisResult,
} from './schemas/analysis.schema.js';

import { PromptService } from './prompt.service.js';

type AnalysisResponse = {
  provider: 'gemini' | 'groq';
  result: AnalysisResult;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly timeoutMs = 30_000;

  constructor(private readonly promptService: PromptService) {}

  async analyze(
    candidateName: string,
    jobDescription: string,
    resume: string,
  ): Promise<AnalysisResponse> {
    const systemPrompt = this.promptService.buildSystemPrompt();

    const userPrompt = this.promptService.buildUserPrompt(
      candidateName,
      jobDescription,
      resume,
    );

    // Attempt primary provider first.
    try {
      const result = await this.withTimeout(
        this.generateWithGemini(systemPrompt, userPrompt),
      );
      return {
        provider: 'gemini',
        result,
      };
    } catch {
      this.logger.warn('Gemini analysis failed. Attempting Groq fallback.');
    }

    // Use Groq only when a fallback key is configured.
    if (process.env.GROQ_API_KEY) {
      try {
        const result = await this.withTimeout(
          this.generateWithGroq(systemPrompt, userPrompt),
        );

        return {
          provider: 'groq',
          result,
        };
      } catch {
        this.logger.error('Groq analysis also failed.');
      }
    }

    throw new ServiceUnavailableException(
      'AI analysis is temporarily unavailable. Please try again later.',
    );
  }

  private async generateWithGemini(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<AnalysisResult> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    const client = new GoogleGenAI({ apiKey });

    const response = await client.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 3000,
      },
    });

    return this.parseAndValidate(response.text);
  }

  private async generateWithGroq(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<AnalysisResult> {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error('Groq API key is not configured.');
    }

    const client = new Groq({
      apiKey,
      timeout: this.timeoutMs,
      maxRetries: 0,
    });

    const response = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      response_format: {
        type: 'json_object',
      },
      temperature: 0.2,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;

    return this.parseAndValidate(content);
  }

  private parseAndValidate(content: string | null | undefined): AnalysisResult {
    if (!content) {
      throw new Error('AI returned an empty response.');
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('AI returned malformed JSON.');
    }

    const validation = AnalysisResultSchema.safeParse(parsed);

    if (!validation.success) {
      throw new Error('AI response failed schema validation.');
    }

    return validation.data;
  }

  private async withTimeout<T>(promise: Promise<T>): Promise<T> {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error('AI provider request timed out.')),
            this.timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}
