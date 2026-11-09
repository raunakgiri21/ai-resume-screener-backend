import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { AnalysisService } from './analysis.service.js';
import { AnalysisQuerySchema } from './schemas/analysis-query.schema.js';
import type { UploadedFile } from './types/uploaded-file.type.js';

@Controller('api/analyses')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'jobDescription', maxCount: 1 },
        { name: 'resume', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: {
          fileSize: 5 * 1024 * 1024,
          files: 2,
          fields: 1,
        },
      },
    ),
  )
  async createAnalysis(
    @Body('candidateName') candidateName: string,
    @UploadedFiles()
    files: {
      jobDescription?: UploadedFile[];
      resume?: UploadedFile[];
    },
  ) {
    if (
      typeof candidateName !== 'string' ||
      !candidateName.trim() ||
      candidateName.trim().length > 100
    ) {
      throw new BadRequestException(
        'Candidate name is required and must not exceed 100 characters.',
      );
    }

    const jobDescription = files?.jobDescription?.[0];
    const resume = files?.resume?.[0];

    if (!jobDescription || !resume) {
      throw new BadRequestException(
        'Both jobDescription and resume files are required.',
      );
    }

    return this.analysisService.createAnalysis(
      candidateName.trim(),
      jobDescription,
      resume,
    );
  }

  @Get()
  async getHistory(@Query() query: Record<string, string>) {
    const validation = AnalysisQuerySchema.safeParse(query);

    if (!validation.success) {
      throw new BadRequestException({
        message: 'Invalid history query parameters.',
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    return this.analysisService.getHistory(validation.data);
  }

  @Get(':id')
  async getAnalysisById(@Param('id') id: string) {
    if (!id || id.length > 100) {
      throw new BadRequestException('Invalid analysis ID.');
    }

    return this.analysisService.getAnalysisById(id);
  }
}
