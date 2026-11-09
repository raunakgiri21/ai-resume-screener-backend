import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AnalysisResult } from '../ai/schemas/analysis.schema.js';

interface CreateAnalysisInput {
  candidateName: string;
  jobDescriptionText: string;
  resumeText: string;
  aiProvider: 'gemini' | 'groq';
  result: AnalysisResult;
}

interface FindAnalysesInput {
  search?: string;
  minScore?: number;
  maxScore?: number;
  page: number;
  limit: number;
}

@Injectable()
export class AnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAnalysisInput) {
    const { result } = input;

    const analysis = await this.prisma.analysis.create({
      data: {
        candidateName: input.candidateName,
        jobDescriptionText: input.jobDescriptionText,
        resumeText: input.resumeText,
        score: result.score,
        matchingSkills: JSON.stringify(result.matchingSkills),
        skillGaps: JSON.stringify(result.skillGaps),
        interviewQuestions: JSON.stringify(result.interviewQuestions),
        summary: result.summary,
        aiProvider: input.aiProvider,
      },
    });

    return this.deserialize(analysis);
  }

  async findAll(filters: FindAnalysesInput) {
    const where = {
      ...(filters.search
        ? {
            candidateName: {
              contains: filters.search,
            },
          }
        : {}),
      ...(filters.minScore !== undefined || filters.maxScore !== undefined
        ? {
            score: {
              ...(filters.minScore !== undefined
                ? { gte: filters.minScore }
                : {}),
              ...(filters.maxScore !== undefined
                ? { lte: filters.maxScore }
                : {}),
            },
          }
        : {}),
    };

    const skip = (filters.page - 1) * filters.limit;

    const [records, total] = await Promise.all([
      this.prisma.analysis.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: filters.limit,
        select: {
          id: true,
          candidateName: true,
          score: true,
          summary: true,
          aiProvider: true,
          createdAt: true,
        },
      }),
      this.prisma.analysis.count({ where }),
    ]);

    return {
      data: records,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async findById(id: string) {
    const record = await this.prisma.analysis.findUnique({
      where: { id },
    });

    return record ? this.deserialize(record) : null;
  }

  private deserialize<
    T extends {
      matchingSkills: string;
      skillGaps: string;
      interviewQuestions: string;
    },
  >(record: T) {
    return {
      ...record,
      matchingSkills: JSON.parse(record.matchingSkills),
      skillGaps: JSON.parse(record.skillGaps),
      interviewQuestions: JSON.parse(record.interviewQuestions),
    };
  }
}
