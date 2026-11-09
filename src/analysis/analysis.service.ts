import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { FileValidationService } from './file-validation.service.js';
import { DocumentExtractionService } from './document-extraction.service.js';
import { AnalysisRepository } from './analysis.repository.js';
import { AiService } from '../ai/ai.service.js';

import type { UploadedFile } from './types/uploaded-file.type.js';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly fileValidationService: FileValidationService,
    private readonly documentExtractionService: DocumentExtractionService,
    private readonly aiService: AiService,
    private readonly analysisRepository: AnalysisRepository,
  ) {}

  async createAnalysis(
    candidateName: string,
    jobDescription: UploadedFile,
    resume: UploadedFile,
  ) {
    // 1. Validate uploaded files.
    await Promise.all([
      this.fileValidationService.validate(jobDescription),
      this.fileValidationService.validate(resume),
    ]);

    // 2. Extract document text.
    const [jdResult, resumeResult] = await Promise.all([
      this.documentExtractionService.extract(jobDescription),
      this.documentExtractionService.extract(resume),
    ]);

    // 3. Generate AI analysis and validate its response.
    const aiResponse = await this.aiService.analyze(
      candidateName,
      jdResult.text,
      resumeResult.text,
    );

    // Reject documents that don't represent a JD and a resume.
    const assessment = aiResponse.result.documentAssessment;

    if (!assessment.jobDescriptionIsRelevant || !assessment.resumeIsRelevant) {
      throw new BadRequestException({
        code: 'IRRELEVANT_DOCUMENTS',
        message: 'Uploaded documents are not valid for resume screening.',
        details: assessment.reason,
        documentAssessment: {
          jobDescriptionValid: assessment.jobDescriptionIsRelevant,
          resumeValid: assessment.resumeIsRelevant,
        },
      });
    }

    // 4. Persist the validated result.
    try {
      const savedAnalysis = await this.analysisRepository.create({
        candidateName,
        jobDescriptionText: jdResult.text,
        resumeText: resumeResult.text,
        aiProvider: aiResponse.provider,
        result: aiResponse.result,
      });

      return {
        ...savedAnalysis,
        documents: {
          jobDescription: {
            filename: jobDescription.originalname,
            characterCount: jdResult.text.length,
            truncated: jdResult.truncated,
          },
          resume: {
            filename: resume.originalname,
            characterCount: resumeResult.text.length,
            truncated: resumeResult.truncated,
          },
        },
      };
    } catch(error) {
      console.error('Error saving analysis:', error);
      this.logger.error('Failed to persist candidate analysis.');

      throw new InternalServerErrorException(
        'Analysis was generated but could not be saved. Please try again.',
      );
    }
  }

  async getHistory(filters: {
    search?: string;
    minScore?: number;
    maxScore?: number;
    page: number;
    limit: number;
  }) {
    try {
      return await this.analysisRepository.findAll(filters);
    } catch {
      this.logger.error('Failed to retrieve analysis history.');

      throw new InternalServerErrorException(
        'Unable to retrieve analysis history.',
      );
    }
  }

  async getAnalysisById(id: string) {
    try {
      const analysis = await this.analysisRepository.findById(id);

      if (!analysis) {
        throw new NotFoundException('Analysis not found.');
      }

      return analysis;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Failed to retrieve individual analysis.');

      throw new InternalServerErrorException('Unable to retrieve analysis.');
    }
  }
}
